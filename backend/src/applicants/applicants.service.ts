import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { CatalogType } from '../common/enums/catalog-type.enum.js';
import { FileStorageService } from '../common/files/file-storage.service.js';
import { User } from '../users/entities/user.entity.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ApplicantLanguage } from './entities/applicant-language.entity.js';
import { ApplicantProfile } from './entities/applicant-profile.entity.js';
import { ApplicantSkill } from './entities/applicant-skill.entity.js';
import { Education } from './entities/education.entity.js';
import { Experience } from './entities/experience.entity.js';

const PHOTOS_FOLDER = 'public/photos';
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MINIMUM_AGE = 18;
const EARLIEST_BIRTH_DATE = '1930-01-01';

@Injectable()
export class ApplicantsService {
  constructor(
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(Education)
    private readonly educationRepository: Repository<Education>,
    @InjectRepository(Experience)
    private readonly experienceRepository: Repository<Experience>,
    @InjectRepository(ApplicantSkill)
    private readonly skillRepository: Repository<ApplicantSkill>,
    @InjectRepository(ApplicantLanguage)
    private readonly languageRepository: Repository<ApplicantLanguage>,
    @InjectRepository(Catalog)
    private readonly catalogRepository: Repository<Catalog>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly fileStorage: FileStorageService,
  ) {}

  async getMyProfile(userId: number) {
    const profile = await this.profileRepository.findOne({
      where: { userId: userId },
      relations: { user: true, municipality: true, profession: true },
    });
    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    const educations = await this.educationRepository.find({
      where: { profileId: profile.id },
      order: { graduationYear: 'DESC', id: 'DESC' },
    });
    const experiences = await this.experienceRepository.find({
      where: { profileId: profile.id },
      order: { startDate: 'DESC', id: 'DESC' },
    });
    const skills = await this.skillRepository.find({
      where: { profileId: profile.id },
      relations: { skill: true },
      order: { id: 'ASC' },
    });
    const languages = await this.languageRepository.find({
      where: { profileId: profile.id },
      relations: { language: true },
      order: { id: 'ASC' },
    });

    const skillList: object[] = [];
    for (const item of skills) {
      skillList.push({
        id: item.id,
        skillId: item.skillId,
        name: item.skill.name,
        level: item.level,
      });
    }

    const languageList: object[] = [];
    for (const item of languages) {
      languageList.push({
        id: item.id,
        languageId: item.languageId,
        name: item.language.name,
        level: item.level,
      });
    }

    return {
      id: profile.id,
      ci: profile.ci,
      ciIssuedIn: profile.ciIssuedIn,
      firstNames: profile.firstNames,
      lastNames: profile.lastNames,
      email: profile.user.email,
      phone: profile.user.phone,
      birthDate: profile.birthDate,
      address: profile.address,
      municipalityId: profile.municipalityId,
      municipality: profile.municipality ? profile.municipality.name : null,
      professionId: profile.professionId,
      profession: profile.profession ? profile.profession.name : null,
      photo: profile.photo,
      hasCv: Boolean(profile.cv),
      summary: profile.summary,
      completionPercentage: profile.completionPercentage,
      educations: educations,
      experiences: experiences,
      skills: skillList,
      languages: languageList,
    };
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto, ip: string) {
    const profile = await this.findProfile(userId);

    this.validateBirthDate(dto.birthDate);
    // Un valor que ya tenía el perfil se conserva aunque luego se desactive en el catálogo
    if (dto.municipalityId && dto.municipalityId !== profile.municipalityId) {
      await this.validateCatalog(
        dto.municipalityId,
        CatalogType.MUNICIPALITY,
        'El municipio seleccionado no es válido',
      );
    }
    if (dto.professionId && dto.professionId !== profile.professionId) {
      await this.validateCatalog(
        dto.professionId,
        CatalogType.PROFESSION,
        'La profesión seleccionada no es válida',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        ApplicantProfile,
        { id: profile.id },
        {
          firstNames: dto.firstNames,
          lastNames: dto.lastNames,
          birthDate: dto.birthDate ?? null,
          address: dto.address || null,
          municipalityId: dto.municipalityId ?? null,
          professionId: dto.professionId ?? null,
          summary: dto.summary || null,
        },
      );
      await manager.update(
        User,
        { id: userId },
        { name: `${dto.firstNames} ${dto.lastNames}`, phone: dto.phone },
      );
    });

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'perfiles_postulante',
      recordId: profile.id,
      previousData: {
        municipio_id: profile.municipalityId,
        profesion_id: profile.professionId,
      },
      newData: {
        municipio_id: dto.municipalityId ?? null,
        profesion_id: dto.professionId ?? null,
      },
      ip: ip,
    });

    return this.getMyProfile(userId);
  }

  async updatePhoto(
    userId: number,
    file: Express.Multer.File | undefined,
    ip: string,
  ) {
    if (!file) {
      throw new BadRequestException('Selecciona una foto');
    }
    if (!this.fileStorage.isImage(file)) {
      throw new BadRequestException('La foto debe ser una imagen PNG o JPG');
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new BadRequestException('La foto debe pesar como máximo 2 MB');
    }

    const profile = await this.findProfile(userId);
    const fileName = await this.fileStorage.save(PHOTOS_FOLDER, file);

    try {
      await this.profileRepository.update(
        { id: profile.id },
        { photo: fileName },
      );
    } catch (error) {
      await this.fileStorage.delete(PHOTOS_FOLDER, fileName);
      throw error;
    }

    if (profile.photo) {
      await this.fileStorage.delete(PHOTOS_FOLDER, profile.photo);
    }

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'perfiles_postulante',
      recordId: profile.id,
      previousData: { foto: profile.photo },
      newData: { foto: fileName },
      ip: ip,
    });

    return { photo: fileName };
  }

  private async findProfile(userId: number): Promise<ApplicantProfile> {
    const profile = await this.profileRepository.findOneBy({ userId: userId });
    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }
    return profile;
  }

  private validateBirthDate(birthDate: string | null | undefined): void {
    if (!birthDate) {
      return;
    }

    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/La_Paz',
    });
    const currentYear = Number(today.slice(0, 4));
    const latestBirthDate = `${currentYear - MINIMUM_AGE}${today.slice(4)}`;

    if (birthDate < EARLIEST_BIRTH_DATE) {
      throw new BadRequestException('La fecha de nacimiento no es válida');
    }
    if (birthDate > latestBirthDate) {
      throw new BadRequestException('Debes tener al menos 18 años');
    }
  }

  private async validateCatalog(
    id: number,
    type: CatalogType,
    errorMessage: string,
  ): Promise<void> {
    const exists = await this.catalogRepository.existsBy({
      id: id,
      type: type,
      active: true,
    });
    if (!exists) {
      throw new BadRequestException(errorMessage);
    }
  }
}
