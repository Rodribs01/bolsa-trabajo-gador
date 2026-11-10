import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';
import { AdminCatalogsController } from './admin-catalogs.controller.js';
import { AdminCatalogsService } from './admin-catalogs.service.js';
import { CatalogsController } from './catalogs.controller.js';
import { CatalogsService } from './catalogs.service.js';
import { Catalog } from './entities/catalog.entity.js';
import { Setting } from './entities/setting.entity.js';
import { Skill } from './entities/skill.entity.js';
import { SettingsService } from './settings.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Catalog, Skill, Setting, JobOffer]),
    AuditModule,
  ],
  controllers: [CatalogsController, AdminCatalogsController],
  providers: [CatalogsService, AdminCatalogsService, SettingsService],
})
export class CatalogsModule {}
