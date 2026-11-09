import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { AuditModule } from '../audit/audit.module.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { Setting } from '../catalogs/entities/setting.entity.js';
import { Skill } from '../catalogs/entities/skill.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { AdminJobOffersController } from './admin-job-offers.controller.js';
import { CompanyJobOffersController } from './company-job-offers.controller.js';
import { Favorite } from './entities/favorite.entity.js';
import { JobOffer } from './entities/job-offer.entity.js';
import { FavoritesController } from './favorites.controller.js';
import { FavoritesService } from './favorites.service.js';
import { JobOffersService } from './job-offers.service.js';
import { PublicJobOffersController } from './public-job-offers.controller.js';
import { PublicJobOffersService } from './public-job-offers.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobOffer,
      Company,
      Catalog,
      Skill,
      Setting,
      Favorite,
      ApplicantProfile,
    ]),
    AuditModule,
  ],
  controllers: [
    PublicJobOffersController,
    CompanyJobOffersController,
    AdminJobOffersController,
    FavoritesController,
  ],
  providers: [JobOffersService, PublicJobOffersService, FavoritesService],
  exports: [PublicJobOffersService],
})
export class JobOffersModule {}
