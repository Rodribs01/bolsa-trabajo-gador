import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { Skill } from '../catalogs/entities/skill.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { AdminJobOffersController } from './admin-job-offers.controller.js';
import { CompanyJobOffersController } from './company-job-offers.controller.js';
import { JobOffer } from './entities/job-offer.entity.js';
import { JobOffersService } from './job-offers.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobOffer, Company, Catalog, Skill]),
    AuditModule,
  ],
  controllers: [CompanyJobOffersController, AdminJobOffersController],
  providers: [JobOffersService],
})
export class JobOffersModule {}
