import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { CatalogType } from '../common/enums/catalog-type.enum.js';
import { CreateCatalogDto } from './dto/create-catalog.dto.js';
import { SaveSkillDto } from './dto/save-skill.dto.js';
import { UpdateCatalogDto } from './dto/update-catalog.dto.js';
import { Catalog } from './entities/catalog.entity.js';
import { Skill } from './entities/skill.entity.js';

@Injectable()
export class AdminCatalogsService {
  constructor(
    @InjectRepository(Catalog)
    private readonly catalogsRepository: Repository<Catalog>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    private readonly auditService: AuditService,
  ) {}

  findCatalogs(type: CatalogType) {
    return this.catalogsRepository.find({
      where: { type: type },
      relations: { parent: true },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  async createCatalog(userId: number, dto: CreateCatalogDto, ip: string) {
    const parentId = await this.checkParent(dto.type, dto.parentId);
    await this.checkDuplicateCatalog(dto.type, dto.name, null);

    const catalog = this.catalogsRepository.create({
      type: dto.type,
      name: dto.name,
      parentId: parentId,
      order: dto.order ?? 0,
      active: true,
    });
    await this.catalogsRepository.save(catalog);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'catalogos',
      recordId: catalog.id,
      newData: this.catalogData(catalog),
      ip: ip,
    });
    return catalog;
  }

  async updateCatalog(
    userId: number,
    id: number,
    dto: UpdateCatalogDto,
    ip: string,
  ) {
    const catalog = await this.catalogsRepository.findOneBy({ id: id });
    if (!catalog) {
      throw new NotFoundException('El registro del catálogo no existe');
    }
    const parentId = await this.checkParent(catalog.type, dto.parentId);
    await this.checkDuplicateCatalog(catalog.type, dto.name, catalog.id);

    const previousData = this.catalogData(catalog);
    catalog.name = dto.name;
    catalog.parentId = parentId;
    catalog.order = dto.order ?? catalog.order;
    catalog.active = dto.active;
    await this.catalogsRepository.save(catalog);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'catalogos',
      recordId: catalog.id,
      previousData: previousData,
      newData: this.catalogData(catalog),
      ip: ip,
    });
    return catalog;
  }

  findSkills() {
    return this.skillsRepository.find({
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async createSkill(userId: number, dto: SaveSkillDto, ip: string) {
    await this.checkDuplicateSkill(dto.name, null);

    const skill = this.skillsRepository.create({
      name: dto.name,
      category: dto.category || null,
      active: true,
    });
    await this.skillsRepository.save(skill);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.CREATE,
      tableName: 'habilidades',
      recordId: skill.id,
      newData: this.skillData(skill),
      ip: ip,
    });
    return skill;
  }

  async updateSkill(userId: number, id: number, dto: SaveSkillDto, ip: string) {
    const skill = await this.skillsRepository.findOneBy({ id: id });
    if (!skill) {
      throw new NotFoundException('La habilidad no existe');
    }
    await this.checkDuplicateSkill(dto.name, skill.id);

    const previousData = this.skillData(skill);
    skill.name = dto.name;
    skill.category = dto.category || null;
    if (dto.active !== undefined) {
      skill.active = dto.active;
    }
    await this.skillsRepository.save(skill);

    await this.auditService.log({
      userId: userId,
      action: AuditAction.UPDATE,
      tableName: 'habilidades',
      recordId: skill.id,
      previousData: previousData,
      newData: this.skillData(skill),
      ip: ip,
    });
    return skill;
  }

  // Solo los municipios tienen padre, y su padre debe ser un departamento
  private async checkParent(
    type: CatalogType,
    parentId: number | undefined,
  ): Promise<number | null> {
    if (type !== CatalogType.MUNICIPALITY) {
      return null;
    }
    if (!parentId) {
      throw new BadRequestException('Selecciona el departamento del municipio');
    }
    const parent = await this.catalogsRepository.findOneBy({
      id: parentId,
      type: CatalogType.DEPARTMENT,
    });
    if (!parent) {
      throw new BadRequestException('El departamento no existe');
    }
    return parent.id;
  }

  private async checkDuplicateCatalog(
    type: CatalogType,
    name: string,
    currentId: number | null,
  ): Promise<void> {
    let exists = false;
    if (currentId) {
      exists = await this.catalogsRepository.existsBy({
        type: type,
        name: name,
        id: Not(currentId),
      });
    } else {
      exists = await this.catalogsRepository.existsBy({
        type: type,
        name: name,
      });
    }
    if (exists) {
      throw new ConflictException(`Ya existe "${name}" en este catálogo`);
    }
  }

  private async checkDuplicateSkill(
    name: string,
    currentId: number | null,
  ): Promise<void> {
    let exists = false;
    if (currentId) {
      exists = await this.skillsRepository.existsBy({
        name: name,
        id: Not(currentId),
      });
    } else {
      exists = await this.skillsRepository.existsBy({ name: name });
    }
    if (exists) {
      throw new ConflictException(`Ya existe la habilidad "${name}"`);
    }
  }

  private catalogData(catalog: Catalog) {
    return {
      tipo: catalog.type,
      nombre: catalog.name,
      padre_id: catalog.parentId,
      orden: catalog.order,
      activo: catalog.active,
    };
  }

  private skillData(skill: Skill) {
    return {
      nombre: skill.name,
      categoria: skill.category,
      activo: skill.active,
    };
  }
}
