import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { AuditModule } from '../audit/audit.module.js';
import { Favorite } from '../job-offers/entities/favorite.entity.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Notification } from './entities/notification.entity.js';
import { MailService } from './mail.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';
import { ScheduledTasksService } from './scheduled-tasks.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      User,
      JobOffer,
      Favorite,
      Application,
      ApplicantProfile,
    ]),
    AuditModule,
  ],
  controllers: [NotificationsController],
  providers: [MailService, NotificationsService, ScheduledTasksService],
  exports: [MailService, NotificationsService],
})
export class NotificationsModule {}
