import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module.js';
import { Catalog } from '../catalogs/entities/catalog.entity.js';
import { Skill } from '../catalogs/entities/skill.entity.js';
import { FilesModule } from '../common/files/files.module.js';
import { ApplicantSectionsService } from './applicant-sections.service.js';
import { ApplicantsController } from './applicants.controller.js';
import { ApplicantsService } from './applicants.service.js';
import { ApplicantLanguage } from './entities/applicant-language.entity.js';
import { ApplicantProfile } from './entities/applicant-profile.entity.js';
import { ApplicantSkill } from './entities/applicant-skill.entity.js';
import { Education } from './entities/education.entity.js';
import { Experience } from './entities/experience.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicantProfile,
      Education,
      Experience,
      ApplicantSkill,
      ApplicantLanguage,
      Skill,
      Catalog,
    ]),
    AuditModule,
    FilesModule,
  ],
  controllers: [ApplicantsController],
  providers: [ApplicantsService, ApplicantSectionsService],
})
export class ApplicantsModule {}
