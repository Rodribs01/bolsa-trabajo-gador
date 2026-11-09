import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { Skill } from '../catalogs/entities/skill.entity.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { CatalogType } from '../common/enums/catalog-type.enum.js';
import { CompanyStatus } from '../common/enums/company-status.enum.js';
import { JobOfferStatus } from '../common/enums/job-offer-status.enum.js';
import { Company } from '../companies/entities/company.entity.js';
import { ListJobOffersDto } from './dto/list-job-offers.dto.js';
import { SaveJobOfferDto } from './dto/save-job-offer.dto.js';
import { JobOfferProfession } from './entities/job-offer-profession.entity.js';
import { JobOfferSkill } from './entities/job-offer-skill.entity.js';
import { JobOffer } from './entities/job-offer.entity.js';

const DETAIL_RELATIONS = {
  contractType: true,
  modality: true,
  municipality: true,
  professions: { profession: true },
  skills: { skill: true },
};

const ADMIN_DETAIL_RELATIONS = {
  contractType: true,
  modality: true,
  municipality: true,
  professions: { profession: true },
  skills: { skill: true },
  company: { sector: true },
};

interface StatusChangeFields {
  observation?: string | null;
  publishedAt?: Date;
}

@Injectable()
export class JobOffersService {
  constructor(
    @InjectRepository(JobOffer)
    private readonly offerRepository: Repository<JobOffer>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Catalog)
    private readonly catalogRepository: Repository<Catalog>,
    @InjectRepository(Skill)
    private readonly skillRepository: Repository<Skill>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
  ) {}

  async create(userId: number, dto: SaveJobOfferDto, ip: string) {
    const company = await this.getCompany(userId);
    this.checkCompanyApproved(company);
    await this.validateOffer(dto);

    const offerId = await this.dataSource.transaction(async (manager) => {
      const offer = manager.create(JobOffer, this.toOfferFields(dto));
      offer.companyId = company.id;
      await manager.save(offer);
      await this.saveProfessionsAndSkills(manager, offer.id, dto);
      return offer.id;
    });

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'ofertas',
      recordId: offerId,
      newData: { titulo: dto.title, estado: JobOfferStatus.DRAFT },
      ip: ip,
    });

    return this.findCompanyOffer(userId, offerId);
  }

  // La empresa solo puede editar una oferta en BORRADOR
  async update(userId: number, id: number, dto: SaveJobOfferDto, ip: string) {
    const company = await this.getCompany(userId);
    this.checkCompanyApproved(company);
    const offer = await this.getOwnOffer(company.id, id);

    if (offer.status !== JobOfferStatus.DRAFT) {
      throw new BadRequestException(
        'Solo se puede editar una oferta en borrador',
      );
    }
    await this.validateOffer(dto);

    await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        JobOffer,
        { id: id, status: JobOfferStatus.DRAFT },
        this.toOfferFields(dto),
      );
      if (result.affected !== 1) {
        throw new BadRequestException(
          'Solo se puede editar una oferta en borrador',
        );
      }
      await manager.delete(JobOfferProfession, { jobOfferId: id });
      await manager.delete(JobOfferSkill, { jobOfferId: id });
      await this.saveProfessionsAndSkills(manager, id, dto);
    });

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'ofertas',
      recordId: id,
      previousData: { titulo: offer.title },
      newData: { titulo: dto.title },
      ip: ip,
    });

    return this.findCompanyOffer(userId, id);
  }

  async findCompanyOffers(userId: number, dto: ListJobOffersDto) {
    const company = await this.getCompany(userId);
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const where = dto.status
      ? { companyId: company.id, status: dto.status }
      : { companyId: company.id };

    const [items, total] = await this.offerRepository.findAndCount({
      where: where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: items, total: total, page: page, limit: limit };
  }

  async findCompanyOffer(userId: number, id: number): Promise<JobOffer> {
    const company = await this.getCompany(userId);
    const offer = await this.offerRepository.findOne({
      where: { id: id, companyId: company.id },
      relations: DETAIL_RELATIONS,
    });
    if (!offer) {
      throw new NotFoundException('La oferta no existe');
    }
    return offer;
  }

  async submit(userId: number, id: number, ip: string) {
    const company = await this.getCompany(userId);
    this.checkCompanyApproved(company);
    const offer = await this.getOwnOffer(company.id, id);

    this.checkClosingDate(offer.closingDate);
    await this.changeStatus(
      offer,
      [JobOfferStatus.DRAFT],
      JobOfferStatus.IN_REVIEW,
      userId,
      ip,
      { observation: null },
    );
    return this.findCompanyOffer(userId, id);
  }

  async close(userId: number, id: number, ip: string) {
    const company = await this.getCompany(userId);
    const offer = await this.getOwnOffer(company.id, id);

    await this.changeStatus(
      offer,
      [JobOfferStatus.PUBLISHED, JobOfferStatus.IN_SELECTION],
      JobOfferStatus.CLOSED,
      userId,
      ip,
    );
    return this.findCompanyOffer(userId, id);
  }

  async cancel(userId: number, id: number, ip: string) {
    const company = await this.getCompany(userId);
    const offer = await this.getOwnOffer(company.id, id);

    await this.changeStatus(
      offer,
      [
        JobOfferStatus.DRAFT,
        JobOfferStatus.IN_REVIEW,
        JobOfferStatus.PUBLISHED,
        JobOfferStatus.IN_SELECTION,
      ],
      JobOfferStatus.CANCELLED,
      userId,
      ip,
    );
    return this.findCompanyOffer(userId, id);
  }

  async findPendingForAdmin(dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [items, total] = await this.offerRepository.findAndCount({
      where: { status: JobOfferStatus.IN_REVIEW },
      relations: ADMIN_DETAIL_RELATIONS,
      order: { updatedAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: items, total: total, page: page, limit: limit };
  }

  async approve(adminId: number, id: number, ip: string) {
    const offer = await this.getOfferForAdmin(id);
    if (offer.company.status !== CompanyStatus.APPROVED) {
      throw new BadRequestException(
        'La empresa de esta oferta no está aprobada',
      );
    }
    this.checkClosingDate(offer.closingDate);

    await this.changeStatus(
      offer,
      [JobOfferStatus.IN_REVIEW],
      JobOfferStatus.PUBLISHED,
      adminId,
      ip,
      { observation: null, publishedAt: new Date() },
    );
    return this.getOfferForAdmin(id);
  }

  // La Gobernación devuelve la oferta a BORRADOR para que la empresa la corrija
  async returnToDraft(
    adminId: number,
    id: number,
    observation: string,
    ip: string,
  ) {
    const offer = await this.getOfferForAdmin(id);

    await this.changeStatus(
      offer,
      [JobOfferStatus.IN_REVIEW],
      JobOfferStatus.DRAFT,
      adminId,
      ip,
      { observation: observation },
    );
    return this.getOfferForAdmin(id);
  }

  private async getCompany(userId: number): Promise<Company> {
    const company = await this.companyRepository.findOneBy({ userId: userId });
    if (!company) {
      throw new NotFoundException('La empresa no existe');
    }
    return company;
  }

  // Solo una empresa APROBADA puede crear y publicar ofertas
  private checkCompanyApproved(company: Company): void {
    if (company.status !== CompanyStatus.APPROVED) {
      throw new ForbiddenException(
        'Tu empresa debe estar aprobada por la Gobernación',
      );
    }
  }

  private async getOwnOffer(companyId: number, id: number): Promise<JobOffer> {
    const offer = await this.offerRepository.findOneBy({
      id: id,
      companyId: companyId,
    });
    if (!offer) {
      throw new NotFoundException('La oferta no existe');
    }
    return offer;
  }

  private async getOfferForAdmin(id: number): Promise<JobOffer> {
    const offer = await this.offerRepository.findOne({
      where: { id: id },
      relations: ADMIN_DETAIL_RELATIONS,
    });
    if (!offer) {
      throw new NotFoundException('La oferta no existe');
    }
    return offer;
  }

  private async changeStatus(
    offer: JobOffer,
    allowedFrom: JobOfferStatus[],
    newStatus: JobOfferStatus,
    userId: number,
    ip: string,
    extraFields: StatusChangeFields = {},
  ): Promise<void> {
    const previousStatus = offer.status;
    if (!allowedFrom.includes(previousStatus)) {
      throw new BadRequestException(
        'La oferta no puede pasar a ese estado desde su estado actual',
      );
    }

    const result = await this.offerRepository.update(
      { id: offer.id, status: previousStatus },
      { ...extraFields, status: newStatus },
    );
    if (result.affected !== 1) {
      throw new ConflictException(
        'El estado de la oferta cambió. Vuelve a cargar la página',
      );
    }

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CHANGE_STATUS,
      tableName: 'ofertas',
      recordId: offer.id,
      previousData: { estado: previousStatus },
      newData: { estado: newStatus, observacion: extraFields.observation },
      ip: ip,
    });
  }

  private async validateOffer(dto: SaveJobOfferDto): Promise<void> {
    this.checkClosingDate(dto.closingDate);
    this.checkSalary(dto);

    const skillIds: number[] = [];
    for (const skill of dto.skills) {
      if (skillIds.includes(skill.skillId)) {
        throw new BadRequestException('No repitas habilidades');
      }
      skillIds.push(skill.skillId);
    }

    await this.checkCatalog(
      dto.contractTypeId,
      CatalogType.CONTRACT_TYPE,
      'El tipo de contrato seleccionado no es válido',
    );
    await this.checkCatalog(
      dto.modalityId,
      CatalogType.MODALITY,
      'La modalidad seleccionada no es válida',
    );
    await this.checkCatalog(
      dto.municipalityId,
      CatalogType.MUNICIPALITY,
      'El municipio seleccionado no es válido',
    );

    const professions = await this.catalogRepository.countBy({
      id: In(dto.professionIds),
      type: CatalogType.PROFESSION,
      active: true,
    });
    if (professions !== dto.professionIds.length) {
      throw new BadRequestException(
        'Alguna profesión seleccionada no es válida',
      );
    }

    const skills = await this.skillRepository.countBy({
      id: In(skillIds),
      active: true,
    });
    if (skills !== skillIds.length) {
      throw new BadRequestException(
        'Alguna habilidad seleccionada no es válida',
      );
    }
  }

  private checkClosingDate(closingDate: string): void {
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/La_Paz',
    });
    if (closingDate <= today) {
      throw new BadRequestException(
        'La fecha de cierre debe ser posterior a hoy',
      );
    }
  }

  // El salario es un rango de mínimo a máximo, salvo que sea a tratar
  private checkSalary(dto: SaveJobOfferDto): void {
    if (dto.salaryToNegotiate) {
      return;
    }
    if (
      typeof dto.minSalary !== 'number' ||
      typeof dto.maxSalary !== 'number'
    ) {
      throw new BadRequestException(
        'Indica el salario mínimo y máximo, o marca "A tratar"',
      );
    }
    if (dto.minSalary > dto.maxSalary) {
      throw new BadRequestException(
        'El salario mínimo no puede ser mayor que el máximo',
      );
    }
  }

  private async checkCatalog(
    id: number,
    type: CatalogType,
    message: string,
  ): Promise<void> {
    const exists = await this.catalogRepository.existsBy({
      id: id,
      type: type,
      active: true,
    });
    if (!exists) {
      throw new BadRequestException(message);
    }
  }

  private toOfferFields(dto: SaveJobOfferDto) {
    let minSalary: number | null = null;
    let maxSalary: number | null = null;
    if (!dto.salaryToNegotiate) {
      minSalary = dto.minSalary ?? null;
      maxSalary = dto.maxSalary ?? null;
    }

    return {
      title: dto.title,
      description: dto.description,
      requiredRequirements: dto.requiredRequirements,
      desiredRequirements: dto.desiredRequirements ?? null,
      yearsOfExperience: dto.yearsOfExperience,
      contractTypeId: dto.contractTypeId,
      modalityId: dto.modalityId,
      municipalityId: dto.municipalityId,
      salaryToNegotiate: dto.salaryToNegotiate,
      minSalary: minSalary,
      maxSalary: maxSalary,
      benefits: dto.benefits ?? null,
      closingDate: dto.closingDate,
      vacancies: dto.vacancies,
    };
  }

  private async saveProfessionsAndSkills(
    manager: EntityManager,
    offerId: number,
    dto: SaveJobOfferDto,
  ): Promise<void> {
    for (const professionId of dto.professionIds) {
      await manager.save(
        manager.create(JobOfferProfession, {
          jobOfferId: offerId,
          professionId: professionId,
        }),
      );
    }
    for (const skill of dto.skills) {
      await manager.save(
        manager.create(JobOfferSkill, {
          jobOfferId: offerId,
          skillId: skill.skillId,
          required: skill.required,
        }),
      );
    }
  }
}
