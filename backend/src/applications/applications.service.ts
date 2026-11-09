import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantsService } from '../applicants/applicants.service.js';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { ApplicantSkill } from '../applicants/entities/applicant-skill.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { ApplicationStatus } from '../common/enums/application-status.enum.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { JobOfferSkill } from '../job-offers/entities/job-offer-skill.entity.js';
import { PublicJobOffersService } from '../job-offers/public-job-offers.service.js';
import { Application } from './entities/application.entity.js';

const COMPLETION_THRESHOLD = 80;
const REQUIRED_SKILL_WEIGHT = 2;
const DESIRED_SKILL_WEIGHT = 1;

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(ApplicantSkill)
    private readonly applicantSkillRepository: Repository<ApplicantSkill>,
    @InjectRepository(JobOfferSkill)
    private readonly offerSkillRepository: Repository<JobOfferSkill>,
    private readonly applicantsService: ApplicantsService,
    private readonly publicJobOffersService: PublicJobOffersService,
    private readonly auditService: AuditService,
  ) {}

  async apply(userId: number, offerId: number, ip: string) {
    const profile = await this.findProfile(userId);

    // Una empresa suspendida conserva sus ofertas en PUBLICADA, pero ya no recibe postulaciones
    const offer = await this.publicJobOffersService.findOpenOffer(offerId);
    if (!offer) {
      throw new NotFoundException(
        'La oferta no existe o ya no recibe postulaciones',
      );
    }

    const completion = await this.applicantsService.updateCompletion(
      profile.id,
    );
    if (completion <= COMPLETION_THRESHOLD) {
      throw new BadRequestException(
        `Tu perfil está al ${completion}%. Necesitas más de ${COMPLETION_THRESHOLD}% para postular`,
      );
    }
    // Sin CV un perfil puede llegar a 85%, pero las bases lo exigen
    if (!profile.cv) {
      throw new BadRequestException('Debes subir tu CV en PDF para postular');
    }

    const matchPercentage = await this.calculateMatch(profile.id, offerId);

    let application: Application;
    try {
      application = await this.applicationRepository.save(
        this.applicationRepository.create({
          jobOfferId: offerId,
          profileId: profile.id,
          matchPercentage: matchPercentage,
        }),
      );
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'Ya postulaste a esta oferta. Una postulación retirada no se puede repetir',
        );
      }
      throw error;
    }

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'postulaciones',
      recordId: application.id,
      newData: { oferta_id: offerId, porcentaje_match: matchPercentage },
      ip: ip,
    });

    return {
      id: application.id,
      jobOfferId: offerId,
      status: application.status,
      matchPercentage: matchPercentage,
      createdAt: application.createdAt,
    };
  }

  async findMine(userId: number, dto: PaginationDto) {
    const profile = await this.findProfile(userId);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [applications, total] = await this.applicationRepository.findAndCount(
      {
        where: { profileId: profile.id },
        relations: {
          jobOffer: {
            company: { sector: true },
            contractType: true,
            modality: true,
            municipality: true,
          },
        },
        order: { createdAt: 'DESC', id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      },
    );

    const items = [];
    for (const application of applications) {
      items.push({
        id: application.id,
        status: application.status,
        matchPercentage: application.matchPercentage,
        createdAt: application.createdAt,
        offerStatus: application.jobOffer.status,
        available: this.publicJobOffersService.isOpen(application.jobOffer),
        offer: this.publicJobOffersService.toPublicSummary(
          application.jobOffer,
        ),
      });
    }
    return { items: items, total: total, page: page, limit: limit };
  }

  async withdraw(userId: number, id: number, ip: string) {
    const profile = await this.findProfile(userId);

    const result = await this.applicationRepository.update(
      { id: id, profileId: profile.id, status: ApplicationStatus.APPLIED },
      { status: ApplicationStatus.WITHDRAWN },
    );

    if (!result.affected) {
      const exists = await this.applicationRepository.existsBy({
        id: id,
        profileId: profile.id,
      });
      if (!exists) {
        throw new NotFoundException('Postulación no encontrada');
      }
      throw new BadRequestException(
        'Solo puedes retirar una postulación mientras está en estado POSTULADO',
      );
    }

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CHANGE_STATUS,
      tableName: 'postulaciones',
      recordId: id,
      previousData: { estado: ApplicationStatus.APPLIED },
      newData: { estado: ApplicationStatus.WITHDRAWN },
      ip: ip,
    });

    return { id: id, status: ApplicationStatus.WITHDRAWN };
  }

  // Habilidades de la oferta que el postulante tiene / total, con peso 2 si es obligatoria y 1 si es deseable
  private async calculateMatch(
    profileId: number,
    offerId: number,
  ): Promise<number> {
    const offerSkills = await this.offerSkillRepository.findBy({
      jobOfferId: offerId,
    });
    const applicantSkills = await this.applicantSkillRepository.findBy({
      profileId: profileId,
    });

    const applicantSkillIds: number[] = [];
    for (const applicantSkill of applicantSkills) {
      applicantSkillIds.push(applicantSkill.skillId);
    }

    let totalWeight = 0;
    let matchedWeight = 0;
    for (const offerSkill of offerSkills) {
      const weight = offerSkill.required
        ? REQUIRED_SKILL_WEIGHT
        : DESIRED_SKILL_WEIGHT;
      totalWeight += weight;
      if (applicantSkillIds.includes(offerSkill.skillId)) {
        matchedWeight += weight;
      }
    }

    if (totalWeight === 0) {
      return 0;
    }
    return Math.round((matchedWeight / totalWeight) * 100);
  }

  private async findProfile(userId: number): Promise<ApplicantProfile> {
    const profile = await this.profileRepository.findOneBy({ userId: userId });
    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }
    return profile;
  }
}
