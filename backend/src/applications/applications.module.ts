import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantsModule } from '../applicants/applicants.module.js';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { ApplicantSkill } from '../applicants/entities/applicant-skill.entity.js';
import { AuditModule } from '../audit/audit.module.js';
import { JobOfferSkill } from '../job-offers/entities/job-offer-skill.entity.js';
import { JobOffersModule } from '../job-offers/job-offers.module.js';
import { ApplicationsController } from './applications.controller.js';
import { ApplicationsService } from './applications.service.js';
import { Application } from './entities/application.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      ApplicantProfile,
      ApplicantSkill,
      JobOfferSkill,
    ]),
    ApplicantsModule,
    AuditModule,
    JobOffersModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
})
export class ApplicationsModule {}
