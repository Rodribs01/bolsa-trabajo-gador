import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { Skill } from '../catalogs/entities/skill.entity.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { CatalogType } from '../common/enums/catalog-type.enum.js';
import { ApplicantsService } from './applicants.service.js';
import { AddLanguageDto } from './dto/add-language.dto.js';
import { AddSkillDto } from './dto/add-skill.dto.js';
import { SaveEducationDto } from './dto/save-education.dto.js';
import { SaveExperienceDto } from './dto/save-experience.dto.js';
import { UpdateLanguageDto } from './dto/update-language.dto.js';
import { UpdateSkillDto } from './dto/update-skill.dto.js';
import { ApplicantLanguage } from './entities/applicant-language.entity.js';
import { ApplicantProfile } from './entities/applicant-profile.entity.js';
import { ApplicantSkill } from './entities/applicant-skill.entity.js';
import { Education } from './entities/education.entity.js';
import { Experience } from './entities/experience.entity.js';

const MAX_EDUCATIONS = 20;
const MAX_EXPERIENCES = 20;
const EARLIEST_START_DATE = '1950-01-01';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

@Injectable()
export class ApplicantSectionsService {
  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Education)
    private readonly educationRepository: Repository<Education>,
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
    @InjectRepository(ApplicantSkill)
    private readonly applicantSkillRepository: Repository<ApplicantSkill>,
    @InjectRepository(ApplicantLanguage)
    private readonly applicantLanguageRepository: Repository<ApplicantLanguage>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    @InjectRepository(Catalog)
    private readonly catalogRepository: Repository<Catalog>,
    private readonly auditService: AuditService,
    private readonly applicantsService: ApplicantsService,
  ) {}

  async addEducation(userId: number, dto: SaveEducationDto, ip: string) {
    const profileId = await this.findProfileId(userId);
    this.validateGraduationYear(dto.graduationYear);

    const total = await this.educationRepository.countBy({
      profileId: profileId,
    });
    if (total >= MAX_EDUCATIONS) {
      throw new BadRequestException(
        `Puedes registrar hasta ${MAX_EDUCATIONS} formaciones`,
      );
    }

    const education = await this.educationRepository.save(
      this.educationRepository.create({
        profileId: profileId,
        title: dto.title,
        institution: dto.institution,
        graduationYear: dto.graduationYear,
        nationalTitleNumber: dto.nationalTitleNumber || null,
      }),
    );
    await this.applicantsService.updateCompletion(profileId);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'formaciones',
      recordId: education.id,
      newData: { titulo: dto.title },
      ip: ip,
    });

    return education;
  }

  async updateEducation(
    userId: number,
    id: number,
    dto: SaveEducationDto,
    ip: string,
  ) {
    const education = await this.findEducation(userId, id);
    this.validateGraduationYear(dto.graduationYear);

    const previousTitle = education.title;
    education.title = dto.title;
    education.institution = dto.institution;
    education.graduationYear = dto.graduationYear;
    education.nationalTitleNumber = dto.nationalTitleNumber || null;
    await this.educationRepository.save(education);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'formaciones',
      recordId: id,
      previousData: { titulo: previousTitle },
      newData: { titulo: dto.title },
      ip: ip,
    });

    return education;
  }

  async removeEducation(userId: number, id: number, ip: string) {
    const education = await this.findEducation(userId, id);
    await this.educationRepository.delete({ id: id });
    await this.applicantsService.updateCompletion(education.profileId);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.DELETE,
      tableName: 'formaciones',
      recordId: id,
      previousData: { titulo: education.title },
      ip: ip,
    });

    return { message: 'Formación eliminada' };
  }

  async addExperience(userId: number, dto: SaveExperienceDto, ip: string) {
    const profileId = await this.findProfileId(userId);
    this.validateExperienceDates(dto.startDate, dto.endDate);

    const total = await this.experienceRepository.countBy({
      profileId: profileId,
    });
    if (total >= MAX_EXPERIENCES) {
      throw new BadRequestException(
        `Puedes registrar hasta ${MAX_EXPERIENCES} experiencias`,
      );
    }

    const experience = await this.experienceRepository.save(
      this.experienceRepository.create({
        profileId: profileId,
        company: dto.company,
        position: dto.position,
        location: dto.location || null,
        startDate: dto.startDate,
        endDate: dto.endDate ?? null,
        years: this.calculateYears(dto.startDate, dto.endDate),
        description: dto.description || null,
      }),
    );
    await this.applicantsService.updateCompletion(profileId);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'experiencias',
      recordId: experience.id,
      newData: { empresa: dto.company, cargo: dto.position },
      ip: ip,
    });

    return experience;
  }

  async updateExperience(
    userId: number,
    id: number,
    dto: SaveExperienceDto,
    ip: string,
  ) {
    const experience = await this.findExperience(userId, id);
    this.validateExperienceDates(dto.startDate, dto.endDate);

    const previousData = {
      empresa: experience.company,
      cargo: experience.position,
    };
    experience.company = dto.company;
    experience.position = dto.position;
    experience.location = dto.location || null;
    experience.startDate = dto.startDate;
    experience.endDate = dto.endDate ?? null;
    experience.years = this.calculateYears(dto.startDate, dto.endDate);
    experience.description = dto.description || null;
    await this.experienceRepository.save(experience);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'experiencias',
      recordId: id,
      previousData: previousData,
      newData: { empresa: dto.company, cargo: dto.position },
      ip: ip,
    });

    return experience;
  }

  async removeExperience(userId: number, id: number, ip: string) {
    const experience = await this.findExperience(userId, id);
    await this.experienceRepository.delete({ id: id });
    await this.applicantsService.updateCompletion(experience.profileId);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.DELETE,
      tableName: 'experiencias',
      recordId: id,
      previousData: { empresa: experience.company, cargo: experience.position },
      ip: ip,
    });

    return { message: 'Experiencia eliminada' };
  }

  async addSkill(userId: number, dto: AddSkillDto, ip: string) {
    const profileId = await this.findProfileId(userId);

    const exists = await this.skillRepository.existsBy({
      id: dto.skillId,
      active: true,
    });
    if (!exists) {
      throw new BadRequestException('La habilidad seleccionada no es válida');
    }

    let applicantSkill: ApplicantSkill;
    try {
      applicantSkill = await this.applicantSkillRepository.save(
        this.applicantSkillRepository.create({
          profileId: profileId,
          skillId: dto.skillId,
          level: dto.level,
        }),
      );
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Ya agregaste esta habilidad');
      }
      throw error;
    }
    await this.applicantsService.updateCompletion(profileId);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'postulante_habilidad',
      recordId: applicantSkill.id,
      newData: { habilidad_id: dto.skillId, nivel: dto.level },
      ip: ip,
    });

    return applicantSkill;
  }

  async updateSkill(
    userId: number,
    id: number,
    dto: UpdateSkillDto,
    ip: string,
  ) {
    const applicantSkill = await this.findApplicantSkill(userId, id);

    const previousLevel = applicantSkill.level;
    applicantSkill.level = dto.level;
    await this.applicantSkillRepository.save(applicantSkill);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'postulante_habilidad',
      recordId: id,
      previousData: { nivel: previousLevel },
      newData: { nivel: dto.level },
      ip: ip,
    });

    return applicantSkill;
  }

  async removeSkill(userId: number, id: number, ip: string) {
    const applicantSkill = await this.findApplicantSkill(userId, id);
    await this.applicantSkillRepository.delete({ id: id });
    await this.applicantsService.updateCompletion(applicantSkill.profileId);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.DELETE,
      tableName: 'postulante_habilidad',
      recordId: id,
      previousData: { habilidad_id: applicantSkill.skillId },
      ip: ip,
    });

    return { message: 'Habilidad eliminada' };
  }

  async addLanguage(userId: number, dto: AddLanguageDto, ip: string) {
    const profileId = await this.findProfileId(userId);

    const exists = await this.catalogRepository.existsBy({
      id: dto.languageId,
      type: CatalogType.LANGUAGE,
      active: true,
    });
    if (!exists) {
      throw new BadRequestException('El idioma seleccionado no es válido');
    }

    let applicantLanguage: ApplicantLanguage;
    try {
      applicantLanguage = await this.applicantLanguageRepository.save(
        this.applicantLanguageRepository.create({
          profileId: profileId,
          languageId: dto.languageId,
          level: dto.level,
        }),
      );
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Ya agregaste este idioma');
      }
      throw error;
    }
    await this.applicantsService.updateCompletion(profileId);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'postulante_idioma',
      recordId: applicantLanguage.id,
      newData: { idioma_id: dto.languageId, nivel: dto.level },
      ip: ip,
    });

    return applicantLanguage;
  }

  async updateLanguage(
    userId: number,
    id: number,
    dto: UpdateLanguageDto,
    ip: string,
  ) {
    const applicantLanguage = await this.findApplicantLanguage(userId, id);

    const previousLevel = applicantLanguage.level;
    applicantLanguage.level = dto.level;
    await this.applicantLanguageRepository.save(applicantLanguage);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'postulante_idioma',
      recordId: id,
      previousData: { nivel: previousLevel },
      newData: { nivel: dto.level },
      ip: ip,
    });

    return applicantLanguage;
  }

  async removeLanguage(userId: number, id: number, ip: string) {
    const applicantLanguage = await this.findApplicantLanguage(userId, id);
    await this.applicantLanguageRepository.delete({ id: id });
    await this.applicantsService.updateCompletion(applicantLanguage.profileId);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.DELETE,
      tableName: 'postulante_idioma',
      recordId: id,
      previousData: { idioma_id: applicantLanguage.languageId },
      ip: ip,
    });

    return { message: 'Idioma eliminado' };
  }

  private async findProfileId(userId: number): Promise<number> {
    const profile = await this.profileRepository.findOneBy({ userId: userId });
    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }
    return profile.id;
  }

  private async findEducation(userId: number, id: number): Promise<Education> {
    const profileId = await this.findProfileId(userId);
    const education = await this.educationRepository.findOneBy({
      id: id,
      profileId: profileId,
    });
    if (!education) {
      throw new NotFoundException('Formación no encontrada');
    }
    return education;
  }

  private async findExperience(
    userId: number,
    id: number,
  ): Promise<Experience> {
    const profileId = await this.findProfileId(userId);
    const experience = await this.experienceRepository.findOneBy({
      id: id,
      profileId: profileId,
    });
    if (!experience) {
      throw new NotFoundException('Experiencia no encontrada');
    }
    return experience;
  }

  private async findApplicantSkill(
    userId: number,
    id: number,
  ): Promise<ApplicantSkill> {
    const profileId = await this.findProfileId(userId);
    const applicantSkill = await this.applicantSkillRepository.findOneBy({
      id: id,
      profileId: profileId,
    });
    if (!applicantSkill) {
      throw new NotFoundException('Habilidad no encontrada');
    }
    return applicantSkill;
  }

  private async findApplicantLanguage(
    userId: number,
    id: number,
  ): Promise<ApplicantLanguage> {
    const profileId = await this.findProfileId(userId);
    const applicantLanguage = await this.applicantLanguageRepository.findOneBy({
      id: id,
      profileId: profileId,
    });
    if (!applicantLanguage) {
      throw new NotFoundException('Idioma no encontrado');
    }
    return applicantLanguage;
  }

  private today(): string {
    return new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/La_Paz',
    });
  }

  private validateGraduationYear(year: number): void {
    const currentYear = Number(this.today().slice(0, 4));
    if (year > currentYear) {
      throw new BadRequestException(
        'El año de titulación no puede ser posterior al año actual',
      );
    }
  }

  private validateExperienceDates(
    startDate: string,
    endDate: string | null | undefined,
  ): void {
    const today = this.today();
    if (startDate < EARLIEST_START_DATE) {
      throw new BadRequestException('La fecha de inicio no es válida');
    }
    if (startDate > today) {
      throw new BadRequestException('La fecha de inicio no puede ser futura');
    }
    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la de inicio',
      );
    }
    if (endDate && endDate > today) {
      throw new BadRequestException('La fecha de fin no puede ser futura');
    }
  }

  // Sin fecha de fin, los años se cuentan hasta hoy
  private calculateYears(
    startDate: string,
    endDate: string | null | undefined,
  ): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate ?? this.today()).getTime();
    const days = (end - start) / MILLISECONDS_PER_DAY;
    return Math.round((days / 365.25) * 10) / 10;
  }
}
