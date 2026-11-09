import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListCatalogsDto } from './dto/list-catalogs.dto.js';
import { Catalog } from './entities/catalog.entity.js';
import { Skill } from './entities/skill.entity.js';

@Injectable()
export class CatalogsService {
  constructor(
    @InjectRepository(Catalog)
    private readonly catalogsRepository: Repository<Catalog>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
  ) {}

  findCatalogs(dto: ListCatalogsDto) {
    return this.catalogsRepository.find({
      select: { id: true, type: true, name: true, parentId: true, order: true },
      where: { type: dto.type, active: true },
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  findSkills() {
    return this.skillsRepository.find({
      select: { id: true, name: true, category: true },
      where: { active: true },
      order: { category: 'ASC', name: 'ASC' },
    });
  }
}
