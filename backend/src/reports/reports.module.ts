import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ReportFilesService } from './report-files.service.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      ApplicantProfile,
      JobOffer,
      Application,
      Catalog,
      User,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportFilesService],
})
export class ReportsModule {}
