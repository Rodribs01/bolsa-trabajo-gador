import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { Company } from '../companies/entities/company.entity.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicantProfile,
      Company,
      JobOffer,
      Application,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
