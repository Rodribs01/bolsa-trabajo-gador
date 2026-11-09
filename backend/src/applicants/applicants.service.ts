import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
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
const CVS_FOLDER = 'private/cvs';
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const MINIMUM_AGE = 18;
const EARLIEST_BIRTH_DATE = '1930-01-01';
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

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

  async getFullProfile(userId: number) {
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
    // Se recalcula al leer porque un trabajo sin fecha de fin sigue sumando años
    for (const experience of experiences) {
      experience.years = this.calculateYears(
        experience.startDate,
        experience.endDate,
      );
    }
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
    await this.updateCompletion(profile.id);

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

    return this.getFullProfile(userId);
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

    let updated = false;
    try {
      const result = await this.profileRepository.update(
        { id: profile.id, photo: profile.photo ?? IsNull() },
        { photo: fileName },
      );
      updated = result.affected === 1;
    } catch (error) {
      await this.fileStorage.delete(PHOTOS_FOLDER, fileName);
      throw error;
    }
    if (!updated) {
      await this.fileStorage.delete(PHOTOS_FOLDER, fileName);
      throw new ConflictException(
        'Tu foto ya se actualizó con otra subida. Vuelve a cargar la página',
      );
    }

    await this.updateCompletion(profile.id);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'perfiles_postulante',
      recordId: profile.id,
      previousData: { foto: profile.photo },
      newData: { foto: fileName },
      ip: ip,
    });

    if (profile.photo) {
      await this.fileStorage.delete(PHOTOS_FOLDER, profile.photo);
    }

    return { photo: fileName };
  }

  async updateCv(
    userId: number,
    file: Express.Multer.File | undefined,
    ip: string,
  ) {
    if (!file) {
      throw new BadRequestException('Selecciona tu CV en PDF');
    }
    if (!this.fileStorage.isPdf(file)) {
      throw new BadRequestException('El CV debe ser un archivo PDF');
    }

    const profile = await this.findProfile(userId);
    const fileName = await this.fileStorage.save(CVS_FOLDER, file);

    let updated = false;
    try {
      const result = await this.profileRepository.update(
        { id: profile.id, cv: profile.cv ?? IsNull() },
        { cv: fileName },
      );
      updated = result.affected === 1;
    } catch (error) {
      await this.fileStorage.delete(CVS_FOLDER, fileName);
      throw error;
    }
    if (!updated) {
      await this.fileStorage.delete(CVS_FOLDER, fileName);
      throw new ConflictException(
        'Tu CV ya se actualizó con otra subida. Vuelve a cargar la página',
      );
    }

    const completionPercentage = await this.updateCompletion(profile.id);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'perfiles_postulante',
      recordId: profile.id,
      previousData: { cv: profile.cv },
      newData: { cv: fileName },
      ip: ip,
    });

    if (profile.cv) {
      await this.fileStorage.delete(CVS_FOLDER, profile.cv);
    }

    return { hasCv: true, completionPercentage: completionPercentage };
  }

  async getMyCv(userId: number): Promise<StreamableFile> {
    const profile = await this.findProfile(userId);
    if (!profile.cv) {
      throw new NotFoundException('Aún no subiste tu CV');
    }
    return this.openCv(profile);
  }

  openCv(profile: ApplicantProfile): StreamableFile {
    if (!profile.cv) {
      throw new NotFoundException('El CV no está disponible');
    }
    const stream = this.fileStorage.open(CVS_FOLDER, profile.cv);
    if (!stream) {
      throw new NotFoundException('El CV no está disponible');
    }
    return new StreamableFile(stream, {
      type: 'application/pdf',
      disposition: `inline; filename="cv-postulante-${profile.id}.pdf"`,
    });
  }

  // Sin fecha de fin, los años se cuentan hasta hoy
  calculateYears(
    startDate: string,
    endDate: string | null | undefined,
  ): number {
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/La_Paz',
    });
    const start = new Date(startDate).getTime();
    const end = new Date(endDate ?? today).getTime();
    const days = (end - start) / MILLISECONDS_PER_DAY;
    return Math.round((days / 365.25) * 10) / 10;
  }

  calculateTotalYears(experiences: Experience[]): number {
    let total = 0;
    for (const experience of experiences) {
      total += this.calculateYears(experience.startDate, experience.endDate);
    }
    return Math.round(total * 10) / 10;
  }

  // Pesos de RF02: datos 20, foto 10, formación 20, experiencia 15, habilidades 15, idiomas 5, CV 15
  async updateCompletion(profileId: number): Promise<number> {
    const profile = await this.profileRepository.findOneByOrFail({
      id: profileId,
    });
    let percentage = 0;

    if (
      profile.birthDate &&
      profile.address &&
      profile.municipalityId &&
      profile.professionId
    ) {
      percentage += 20;
    }
    if (profile.photo) {
      percentage += 10;
    }
    if (await this.educationRepository.existsBy({ profileId: profileId })) {
      percentage += 20;
    }
    if (await this.experienceRepository.existsBy({ profileId: profileId })) {
      percentage += 15;
    }
    if (await this.skillRepository.existsBy({ profileId: profileId })) {
      percentage += 15;
    }
    if (await this.languageRepository.existsBy({ profileId: profileId })) {
      percentage += 5;
    }
    if (profile.cv) {
      percentage += 15;
    }

    await this.profileRepository.update(
      { id: profileId },
      { completionPercentage: percentage },
    );
    return percentage;
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
