import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, MoreThanOrEqual, Repository } from 'typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { ApplicationStatus } from '../common/enums/application-status.enum.js';
import { CompanyStatus } from '../common/enums/company-status.enum.js';
import { JobOfferStatus } from '../common/enums/job-offer-status.enum.js';
import { Company } from '../companies/entities/company.entity.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';

const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];
const CHART_MONTHS = 6;
const TOP_PROFESSIONS = 5;

export interface ChartItem {
  name: string;
  total: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(JobOffer)
    private readonly offerRepository: Repository<JobOffer>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
  ) {}

  async getSummary() {
    const monthStart = this.monthStartInBolivia(0);

    const totalApplicants = await this.profileRepository.count({
      where: { user: { emailVerified: true } },
    });
    const newApplicants = await this.profileRepository.count({
      where: {
        user: { emailVerified: true },
        createdAt: MoreThanOrEqual(monthStart),
      },
    });

    const approvedCompanies = await this.companyRepository.count({
      where: { status: CompanyStatus.APPROVED },
    });
    const newApprovedCompanies = await this.companyRepository.count({
      where: {
        status: CompanyStatus.APPROVED,
        validatedAt: MoreThanOrEqual(monthStart),
      },
    });
    const pendingCompanies = await this.companyRepository.count({
      where: { status: CompanyStatus.PENDING },
    });
    const oldestPending = await this.companyRepository.findOne({
      where: { status: CompanyStatus.PENDING },
      order: { createdAt: 'ASC' },
    });

    const activeOffers = await this.offerRepository.count({
      where: {
        status: In([JobOfferStatus.PUBLISHED, JobOfferStatus.IN_SELECTION]),
      },
    });
    const offersInReview = await this.offerRepository.count({
      where: { status: JobOfferStatus.IN_REVIEW },
    });
    const publishedThisMonth = await this.offerRepository.count({
      where: { publishedAt: MoreThanOrEqual(monthStart) },
    });
    // Una oferta cerrada ya no se edita, así que su fecha de actualización es la del cierre
    const closedThisMonth = await this.offerRepository.count({
      where: {
        status: JobOfferStatus.CLOSED,
        updatedAt: MoreThanOrEqual(monthStart),
      },
    });

    const totalApplications = await this.applicationRepository.count();
    const hiredApplications = await this.applicationRepository.count({
      where: { status: ApplicationStatus.HIRED },
    });
    // Tasa de contratación = postulaciones contratadas / total de postulaciones x 100
    let hiringRate = 0;
    if (totalApplications > 0) {
      hiringRate =
        Math.round((hiredApplications / totalApplications) * 1000) / 10;
    }

    return {
      applicants: { total: totalApplicants, thisMonth: newApplicants },
      companies: {
        approved: approvedCompanies,
        approvedThisMonth: newApprovedCompanies,
        pending: pendingCompanies,
        oldestPendingSince: oldestPending ? oldestPending.createdAt : null,
      },
      offers: {
        active: activeOffers,
        inReview: offersInReview,
        publishedThisMonth: publishedThisMonth,
        closedThisMonth: closedThisMonth,
      },
      applications: {
        total: totalApplications,
        hired: hiredApplications,
        hiringRate: hiringRate,
      },
      applicationsByMonth: await this.countApplicationsByMonth(),
      applicantsByProfession: await this.countApplicantsByProfession(),
      companiesBySector: await this.countCompaniesBySector(),
      calculatedAt: new Date(),
    };
  }

  private async countApplicationsByMonth(): Promise<ChartItem[]> {
    const result: ChartItem[] = [];
    for (let i = CHART_MONTHS - 1; i >= 0; i--) {
      const start = this.monthStartInBolivia(i);
      const end = new Date(this.monthStartInBolivia(i - 1).getTime() - 1);
      const total = await this.applicationRepository.count({
        where: { createdAt: Between(start, end) },
      });
      result.push({ name: this.monthLabel(start), total: total });
    }
    return result;
  }

  private async countApplicantsByProfession(): Promise<ChartItem[]> {
    const rows: { name: string; total: string }[] = await this.profileRepository
      .createQueryBuilder('profile')
      .innerJoin('profile.user', 'user')
      .innerJoin('profile.profession', 'profession')
      .select('profession.name', 'name')
      .addSelect('COUNT(profile.id)', 'total')
      .where('user.emailVerified = :verified', { verified: true })
      .groupBy('profession.id')
      .addGroupBy('profession.name')
      .orderBy('total', 'DESC')
      .getRawMany();

    const result: ChartItem[] = [];
    let others = 0;
    for (const row of rows) {
      if (result.length < TOP_PROFESSIONS) {
        result.push({ name: row.name, total: Number(row.total) });
      } else {
        others += Number(row.total);
      }
    }
    if (others > 0) {
      result.push({ name: 'Otras', total: others });
    }
    return result;
  }

  private async countCompaniesBySector(): Promise<ChartItem[]> {
    const rows: { name: string; total: string }[] = await this.companyRepository
      .createQueryBuilder('company')
      .innerJoin('company.sector', 'sector')
      .select('sector.name', 'name')
      .addSelect('COUNT(company.id)', 'total')
      .where('company.status = :status', { status: CompanyStatus.APPROVED })
      .groupBy('sector.id')
      .addGroupBy('sector.name')
      .orderBy('total', 'DESC')
      .getRawMany();

    const result: ChartItem[] = [];
    for (const row of rows) {
      result.push({ name: row.name, total: Number(row.total) });
    }
    return result;
  }

  private monthStartInBolivia(monthsAgo: number): Date {
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/La_Paz',
    });
    let year = Number(today.slice(0, 4));
    let month = Number(today.slice(5, 7)) - monthsAgo;
    while (month < 1) {
      month += 12;
      year--;
    }
    while (month > 12) {
      month -= 12;
      year++;
    }
    const monthText = String(month).padStart(2, '0');
    return new Date(`${year}-${monthText}-01T00:00:00-04:00`);
  }

  private monthLabel(monthStart: Date): string {
    const local = new Date(monthStart.getTime() + 4 * 60 * 60 * 1000);
    return `${MONTH_NAMES[local.getUTCMonth()]} ${local.getUTCFullYear()}`;
  }
}
