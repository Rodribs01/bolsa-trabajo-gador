import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  FindOperator,
  FindOptionsWhere,
  In,
  LessThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { ApplicationStatus } from '../common/enums/application-status.enum.js';
import { CompanyStatus } from '../common/enums/company-status.enum.js';
import { JobOfferStatus } from '../common/enums/job-offer-status.enum.js';
import { ReportType } from '../common/enums/report-type.enum.js';
import { Company } from '../companies/entities/company.entity.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ReportQueryDto } from './dto/report-query.dto.js';

const MAX_ROWS = 5000;

const STATUS_LABELS: Record<string, string> = {
  PENDIENTE_VALIDACION: 'Pendiente',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  SUSPENDIDA: 'Suspendida',
  BORRADOR: 'Borrador',
  EN_REVISION_GADOR: 'En revisión',
  PUBLICADA: 'Publicada',
  EN_PROCESO_SELECCION: 'En selección',
  CERRADA: 'Cerrada',
  ANULADA: 'Anulada',
};

export interface ReportColumn {
  header: string;
  width: number;
}

export interface ReportData {
  title: string;
  fileName: string;
  filters: string;
  columns: ReportColumn[];
  rows: (string | number)[][];
  summary: string;
  landscape: boolean;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(JobOffer)
    private readonly offerRepository: Repository<JobOffer>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Catalog)
    private readonly catalogRepository: Repository<Catalog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getReport(type: ReportType, dto: ReportQueryDto): Promise<ReportData> {
    if (dto.from && dto.to && dto.from > dto.to) {
      throw new BadRequestException(
        'La fecha "desde" no puede ser posterior a la fecha "hasta"',
      );
    }
    let report: ReportData;
    if (type === ReportType.COMPANIES) {
      report = await this.companiesReport(dto);
    } else if (type === ReportType.APPLICANTS) {
      report = await this.applicantsReport(dto);
    } else if (type === ReportType.JOB_OFFERS) {
      report = await this.jobOffersReport(dto);
    } else {
      report = await this.hiringsReport(dto);
    }
    if (report.rows.length === MAX_ROWS) {
      report.summary += `   (Se muestran solo las primeras ${MAX_ROWS} filas: acorta el periodo)`;
    }
    return report;
  }

  async getIssuerName(userId: number): Promise<string> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException('El usuario no existe');
    }
    return user.name;
  }

  private async companiesReport(dto: ReportQueryDto): Promise<ReportData> {
    const statuses: string[] = Object.values(CompanyStatus);
    if (dto.status && !statuses.includes(dto.status)) {
      throw new BadRequestException('El estado de empresa no es válido');
    }
    const where: FindOptionsWhere<Company> = {};
    const range = this.dateRange(dto);
    if (range) {
      where.createdAt = range;
    }
    if (dto.status) {
      where.status = dto.status as CompanyStatus;
    }
    const companies = await this.companyRepository.find({
      where: where,
      relations: { sector: true, municipality: true },
      order: { createdAt: 'ASC' },
      take: MAX_ROWS,
    });

    const rows: (string | number)[][] = [];
    const counts: Record<string, number> = {};
    for (const company of companies) {
      rows.push([
        rows.length + 1,
        company.nit,
        company.businessName,
        company.sector.name,
        company.municipality.name,
        this.formatDate(company.createdAt),
        this.statusLabel(company.status),
      ]);
      counts[company.status] = (counts[company.status] ?? 0) + 1;
    }

    return {
      title: 'Reporte de empresas registradas',
      fileName: this.fileName('Empresas', dto),
      filters: `${this.periodText(dto)} · Estado: ${dto.status ? this.statusLabel(dto.status) : 'Todos'}`,
      columns: [
        { header: 'N.º', width: 6 },
        { header: 'NIT', width: 14 },
        { header: 'Razón social', width: 36 },
        { header: 'Rubro', width: 18 },
        { header: 'Municipio', width: 18 },
        { header: 'Registro', width: 12 },
        { header: 'Estado', width: 14 },
      ],
      rows: rows,
      summary:
        `Total: ${rows.length}   Aprobadas: ${counts[CompanyStatus.APPROVED] ?? 0}` +
        `   Pendientes: ${counts[CompanyStatus.PENDING] ?? 0}` +
        `   Rechazadas: ${counts[CompanyStatus.REJECTED] ?? 0}` +
        `   Suspendidas: ${counts[CompanyStatus.SUSPENDED] ?? 0}`,
      landscape: false,
    };
  }

  private async applicantsReport(dto: ReportQueryDto): Promise<ReportData> {
    const where: FindOptionsWhere<ApplicantProfile> = {
      user: { emailVerified: true },
    };
    const range = this.dateRange(dto);
    if (range) {
      where.createdAt = range;
    }
    if (dto.municipalityId) {
      where.municipalityId = dto.municipalityId;
    }
    const profiles = await this.profileRepository.find({
      where: where,
      relations: { user: true, profession: true, municipality: true },
      order: { lastNames: 'ASC', firstNames: 'ASC' },
      take: MAX_ROWS,
    });

    const rows: (string | number)[][] = [];
    let complete = 0;
    for (const profile of profiles) {
      rows.push([
        rows.length + 1,
        `${profile.ci} ${profile.ciIssuedIn}`,
        `${profile.lastNames} ${profile.firstNames}`,
        profile.profession ? profile.profession.name : 'Sin registrar',
        profile.municipality ? profile.municipality.name : 'Sin registrar',
        profile.user.phone ?? '-',
        `${profile.completionPercentage} %`,
      ]);
      if (profile.completionPercentage > 80) {
        complete++;
      }
    }

    return {
      title: 'Reporte de postulantes registrados',
      fileName: this.fileName('Postulantes', dto),
      filters: `${this.periodText(dto)} · Municipio: ${await this.catalogName(dto.municipalityId)}`,
      columns: [
        { header: 'N.º', width: 6 },
        { header: 'CI', width: 14 },
        { header: 'Nombre', width: 32 },
        { header: 'Profesión', width: 26 },
        { header: 'Municipio', width: 18 },
        { header: 'Celular', width: 14 },
        { header: 'Perfil', width: 9 },
      ],
      rows: rows,
      summary: `Total: ${rows.length}   Con perfil de más de 80 % (pueden postular): ${complete}`,
      landscape: false,
    };
  }

  private async jobOffersReport(dto: ReportQueryDto): Promise<ReportData> {
    const statuses: string[] = Object.values(JobOfferStatus);
    if (dto.status && !statuses.includes(dto.status)) {
      throw new BadRequestException('El estado de oferta no es válido');
    }
    // Los borradores no se reportan salvo que se pidan, porque la Gobernación aún no los revisó
    let statusFilter: JobOfferStatus | FindOperator<JobOfferStatus> = Not(
      JobOfferStatus.DRAFT,
    );
    if (dto.status) {
      statusFilter = dto.status as JobOfferStatus;
    }
    const where: FindOptionsWhere<JobOffer> = { status: statusFilter };
    const range = this.dateRange(dto);
    if (range) {
      where.createdAt = range;
    }
    const offers = await this.offerRepository.find({
      where: where,
      relations: { company: true, municipality: true },
      order: { createdAt: 'ASC' },
      take: MAX_ROWS,
    });
    const applicationCounts = await this.countApplications(offers);

    const rows: (string | number)[][] = [];
    const counts: Record<string, number> = {};
    let totalApplications = 0;
    for (const offer of offers) {
      const applications = applicationCounts[offer.id] ?? 0;
      totalApplications += applications;
      rows.push([
        rows.length + 1,
        offer.title,
        offer.company.businessName,
        offer.municipality.name,
        offer.publishedAt ? this.formatDate(offer.publishedAt) : '-',
        this.formatDateText(offer.closingDate),
        offer.vacancies,
        applications,
        this.statusLabel(offer.status),
      ]);
      counts[offer.status] = (counts[offer.status] ?? 0) + 1;
    }

    let summary = `Total: ${rows.length}`;
    for (const status of statuses) {
      if (counts[status]) {
        summary += `   ${this.statusLabel(status)}: ${counts[status]}`;
      }
    }
    summary += `   Postulaciones: ${totalApplications}`;

    return {
      title: 'Reporte de ofertas laborales',
      fileName: this.fileName('Ofertas', dto),
      filters: `${this.periodText(dto)} (fecha de creación) · Estado: ${dto.status ? this.statusLabel(dto.status) : 'Todos menos borradores'}`,
      columns: [
        { header: 'N.º', width: 6 },
        { header: 'Título', width: 34 },
        { header: 'Empresa', width: 28 },
        { header: 'Municipio', width: 16 },
        { header: 'Publicación', width: 13 },
        { header: 'Cierre', width: 12 },
        { header: 'Plazas', width: 8 },
        { header: 'Postulantes', width: 11 },
        { header: 'Estado', width: 14 },
      ],
      rows: rows,
      summary: summary,
      landscape: true,
    };
  }

  private async hiringsReport(dto: ReportQueryDto): Promise<ReportData> {
    const query = this.applicationRepository
      .createQueryBuilder('application')
      .innerJoin('application.jobOffer', 'offer')
      .innerJoin('offer.company', 'company')
      .innerJoin('company.sector', 'sector')
      .select('company.id', 'companyId')
      .addSelect('company.businessName', 'businessName')
      .addSelect('company.nit', 'nit')
      .addSelect('sector.name', 'sector')
      .addSelect('COUNT(DISTINCT offer.id)', 'offers')
      .addSelect('COUNT(application.id)', 'hired')
      .where('application.status = :status', {
        status: ApplicationStatus.HIRED,
      })
      .groupBy('company.id')
      .addGroupBy('company.businessName')
      .addGroupBy('company.nit')
      .addGroupBy('sector.name')
      .orderBy('hired', 'DESC')
      .limit(MAX_ROWS);

    // La fecha de contratación es la del último cambio de estado de la postulación
    if (dto.from) {
      query.andWhere('application.updatedAt >= :from', {
        from: this.startOfDay(dto.from),
      });
    }
    if (dto.to) {
      query.andWhere('application.updatedAt < :to', {
        to: this.startOfNextDay(dto.to),
      });
    }
    if (dto.sectorId) {
      query.andWhere('company.sectorId = :sectorId', {
        sectorId: dto.sectorId,
      });
    }
    const results: {
      businessName: string;
      nit: string;
      sector: string;
      offers: string;
      hired: string;
    }[] = await query.getRawMany();

    const rows: (string | number)[][] = [];
    let totalHired = 0;
    for (const result of results) {
      rows.push([
        rows.length + 1,
        result.businessName,
        result.nit,
        result.sector,
        Number(result.offers),
        Number(result.hired),
      ]);
      totalHired += Number(result.hired);
    }

    return {
      title: 'Reporte de contrataciones por empresa',
      fileName: this.fileName('Contrataciones', dto),
      filters: `${this.periodText(dto)} · Rubro: ${await this.catalogName(dto.sectorId)}`,
      columns: [
        { header: 'N.º', width: 6 },
        { header: 'Empresa', width: 36 },
        { header: 'NIT', width: 14 },
        { header: 'Rubro', width: 18 },
        { header: 'Ofertas con contratación', width: 14 },
        { header: 'Contratados', width: 12 },
      ],
      rows: rows,
      summary: `Empresas: ${rows.length}   Total de contratados: ${totalHired}`,
      landscape: false,
    };
  }

  private async countApplications(
    offers: JobOffer[],
  ): Promise<Record<number, number>> {
    const counts: Record<number, number> = {};
    if (offers.length === 0) {
      return counts;
    }
    const ids: number[] = [];
    for (const offer of offers) {
      ids.push(offer.id);
    }
    const results: { jobOfferId: number; total: string }[] =
      await this.applicationRepository
        .createQueryBuilder('application')
        .select('application.jobOfferId', 'jobOfferId')
        .addSelect('COUNT(application.id)', 'total')
        .where({ jobOfferId: In(ids) })
        .groupBy('application.jobOfferId')
        .getRawMany();
    for (const result of results) {
      counts[result.jobOfferId] = Number(result.total);
    }
    return counts;
  }

  private dateRange(dto: ReportQueryDto): FindOperator<Date> | undefined {
    if (dto.from && dto.to) {
      return And(
        MoreThanOrEqual(this.startOfDay(dto.from)),
        LessThan(this.startOfNextDay(dto.to)),
      );
    }
    if (dto.from) {
      return MoreThanOrEqual(this.startOfDay(dto.from));
    }
    if (dto.to) {
      return LessThan(this.startOfNextDay(dto.to));
    }
    return undefined;
  }

  private startOfDay(date: string): Date {
    return new Date(`${date}T00:00:00-04:00`);
  }

  private startOfNextDay(date: string): Date {
    const next = this.startOfDay(date);
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  private async catalogName(id: number | undefined): Promise<string> {
    if (!id) {
      return 'Todos';
    }
    const catalog = await this.catalogRepository.findOneBy({ id: id });
    if (!catalog) {
      throw new BadRequestException('El filtro seleccionado no existe');
    }
    return catalog.name;
  }

  private periodText(dto: ReportQueryDto): string {
    if (!dto.from && !dto.to) {
      return 'Periodo: todo el historial';
    }
    const from = dto.from ? this.formatDateText(dto.from) : 'el inicio';
    const to = dto.to ? this.formatDateText(dto.to) : 'hoy';
    return `Periodo: ${from} al ${to}`;
  }

  private fileName(name: string, dto: ReportQueryDto): string {
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/La_Paz',
    });
    return `${name}_${dto.from ?? 'inicio'}_${dto.to ?? today}`;
  }

  private statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('es-BO', {
      timeZone: 'America/La_Paz',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private formatDateText(date: string): string {
    return `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}`;
  }
}
