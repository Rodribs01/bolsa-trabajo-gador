import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ApplicantsService } from '../applicants/applicants.service.js';
import { ApplicantSkill } from '../applicants/entities/applicant-skill.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { ApplicationStatus } from '../common/enums/application-status.enum.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { CompanyStatus } from '../common/enums/company-status.enum.js';
import { JobOfferStatus } from '../common/enums/job-offer-status.enum.js';
import { NotificationType } from '../common/enums/notification-type.enum.js';
import { Company } from '../companies/entities/company.entity.js';
import { JobOfferSkill } from '../job-offers/entities/job-offer-skill.entity.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ListOfferApplicationsDto } from './dto/list-offer-applications.dto.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';
import { Application } from './entities/application.entity.js';

// Cada estado solo avanza al siguiente paso o a RECHAZADO; CONTRATADO y RECHAZADO son finales
const NEXT_STATUSES: Record<string, ApplicationStatus[]> = {
  [ApplicationStatus.SEEN]: [
    ApplicationStatus.SHORTLISTED,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.SHORTLISTED]: [
    ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.INTERVIEW]: [
    ApplicationStatus.FINALIST,
    ApplicationStatus.REJECTED,
  ],
  [ApplicationStatus.FINALIST]: [
    ApplicationStatus.HIRED,
    ApplicationStatus.REJECTED,
  ],
};

@Injectable()
export class CompanyApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(JobOffer)
    private readonly offerRepository: Repository<JobOffer>,
    @InjectRepository(JobOfferSkill)
    private readonly offerSkillRepository: Repository<JobOfferSkill>,
    @InjectRepository(ApplicantSkill)
    private readonly applicantSkillRepository: Repository<ApplicantSkill>,
    private readonly applicantsService: ApplicantsService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findByOffer(
    userId: number,
    offerId: number,
    dto: ListOfferApplicationsDto,
  ) {
    const company = await this.getApprovedCompany(userId);
    const offerExists = await this.offerRepository.existsBy({
      id: offerId,
      companyId: company.id,
    });
    if (!offerExists) {
      throw new NotFoundException('La oferta no existe');
    }

    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const [applications, total] = await this.applicationRepository.findAndCount(
      {
        where: {
          jobOfferId: offerId,
          status: dto.status ?? Not(ApplicationStatus.WITHDRAWN),
        },
        relations: {
          profile: { profession: true, municipality: true, experiences: true },
        },
        order: { matchPercentage: 'DESC', createdAt: 'ASC', id: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      },
    );

    const items = [];
    for (const application of applications) {
      const profile = application.profile;
      items.push({
        id: application.id,
        status: application.status,
        matchPercentage: application.matchPercentage,
        createdAt: application.createdAt,
        applicant: {
          firstNames: profile.firstNames,
          lastNames: profile.lastNames,
          photo: profile.photo,
          profession: profile.profession ? profile.profession.name : null,
          municipality: profile.municipality ? profile.municipality.name : null,
          yearsOfExperience: this.applicantsService.calculateTotalYears(
            profile.experiences,
          ),
        },
      });
    }

    return {
      items: items,
      total: total,
      page: page,
      limit: limit,
      statusCounts: await this.countByStatus(offerId),
    };
  }

  async findOne(userId: number, id: number, ip: string) {
    const company = await this.getApprovedCompany(userId);
    const application = await this.openApplication(company.id, id, userId, ip);

    return {
      id: application.id,
      status: application.status,
      matchPercentage: application.matchPercentage,
      createdAt: application.createdAt,
      seenAt: application.seenAt,
      offer: { id: application.jobOffer.id, title: application.jobOffer.title },
      offerSkills: await this.getOfferSkills(
        application.jobOfferId,
        application.profileId,
      ),
      applicant: await this.applicantsService.getFullProfile(
        application.profile.userId,
      ),
    };
  }

  async getCv(userId: number, id: number, ip: string): Promise<StreamableFile> {
    const company = await this.getApprovedCompany(userId);
    const application = await this.openApplication(company.id, id, userId, ip);
    return this.applicantsService.openCv(application.profile);
  }

  async updateStatus(
    userId: number,
    id: number,
    dto: UpdateApplicationStatusDto,
    ip: string,
  ) {
    const company = await this.getApprovedCompany(userId);
    const application = await this.getOwnApplication(company.id, id);

    // Una oferta cerrada aún permite registrar a quién se contrató; una anulada ya no tiene proceso
    if (application.jobOffer.status === JobOfferStatus.CANCELLED) {
      throw new BadRequestException(
        'La oferta está anulada. Ya no se pueden cambiar sus postulaciones',
      );
    }

    const previousStatus = application.status;
    const allowedStatuses = NEXT_STATUSES[previousStatus] ?? [];
    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `La postulación no puede pasar de ${previousStatus} a ${dto.status}`,
      );
    }

    const result = await this.applicationRepository.update(
      { id: id, status: previousStatus },
      { status: dto.status },
    );
    if (result.affected !== 1) {
      throw new ConflictException(
        'El estado de la postulación cambió. Vuelve a cargar la página',
      );
    }

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CHANGE_STATUS,
      tableName: 'postulaciones',
      recordId: id,
      previousData: { estado: previousStatus },
      newData: { estado: dto.status },
      ip: ip,
    });

    await this.notificationsService.notify({
      userId: application.profile.userId,
      type: NotificationType.APPLICATION_STATUS,
      title: 'Tu postulación cambió de estado',
      message: `Tu postulación a "${application.jobOffer.title}" en ${application.jobOffer.company.businessName} pasó al estado "${statusName(dto.status)}".`,
      link: '/applicant/applications',
    });

    return { id: id, status: dto.status };
  }

  // Una empresa pendiente, rechazada o suspendida no accede a los datos de los postulantes
  private async getApprovedCompany(userId: number): Promise<Company> {
    const company = await this.companyRepository.findOneBy({ userId: userId });
    if (!company) {
      throw new NotFoundException('La empresa no existe');
    }
    if (company.status !== CompanyStatus.APPROVED) {
      throw new ForbiddenException(
        'Tu empresa debe estar aprobada por la Gobernación',
      );
    }
    return company;
  }

  private async getOwnApplication(
    companyId: number,
    id: number,
  ): Promise<Application> {
    const application = await this.applicationRepository.findOne({
      where: {
        id: id,
        status: Not(ApplicationStatus.WITHDRAWN),
        jobOffer: { companyId: companyId },
      },
      relations: { jobOffer: { company: true }, profile: true },
    });
    if (!application) {
      throw new NotFoundException('Postulación no encontrada');
    }
    return application;
  }

  // Abrir el perfil o el CV por primera vez pasa la postulación de POSTULADO a VISTO
  private async openApplication(
    companyId: number,
    id: number,
    userId: number,
    ip: string,
  ): Promise<Application> {
    const application = await this.getOwnApplication(companyId, id);
    if (application.status !== ApplicationStatus.APPLIED) {
      return application;
    }

    const seenAt = new Date();
    const result = await this.applicationRepository.update(
      { id: id, status: ApplicationStatus.APPLIED },
      { status: ApplicationStatus.SEEN, seenAt: seenAt },
    );
    if (result.affected !== 1) {
      return this.getOwnApplication(companyId, id);
    }

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CHANGE_STATUS,
      tableName: 'postulaciones',
      recordId: id,
      previousData: { estado: ApplicationStatus.APPLIED },
      newData: { estado: ApplicationStatus.SEEN },
      ip: ip,
    });

    await this.notificationsService.notify({
      userId: application.profile.userId,
      type: NotificationType.CV_VIEWED,
      title: 'Una empresa revisó tu postulación',
      message: `${application.jobOffer.company.businessName} abrió tu perfil para la oferta "${application.jobOffer.title}".`,
      link: '/applicant/applications',
    });

    application.status = ApplicationStatus.SEEN;
    application.seenAt = seenAt;
    return application;
  }

  private async countByStatus(offerId: number) {
    const rows = await this.applicationRepository
      .createQueryBuilder('application')
      .select('application.status', 'status')
      .addSelect('COUNT(*)', 'total')
      .where('application.jobOfferId = :offerId', { offerId: offerId })
      .andWhere('application.status != :withdrawn', {
        withdrawn: ApplicationStatus.WITHDRAWN,
      })
      .groupBy('application.status')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.status] = Number(row.total);
    }
    return counts;
  }

  private async getOfferSkills(offerId: number, profileId: number) {
    const offerSkills = await this.offerSkillRepository.find({
      where: { jobOfferId: offerId },
      relations: { skill: true },
      order: { required: 'DESC', id: 'ASC' },
    });
    const applicantSkills = await this.applicantSkillRepository.findBy({
      profileId: profileId,
    });

    const applicantSkillIds: number[] = [];
    for (const applicantSkill of applicantSkills) {
      applicantSkillIds.push(applicantSkill.skillId);
    }

    const items = [];
    for (const offerSkill of offerSkills) {
      items.push({
        skillId: offerSkill.skillId,
        name: offerSkill.skill.name,
        required: offerSkill.required,
        matched: applicantSkillIds.includes(offerSkill.skillId),
      });
    }
    return items;
  }
}

function statusName(status: ApplicationStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
