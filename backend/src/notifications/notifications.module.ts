import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity.js';
import { Notification } from './entities/notification.entity.js';
import { MailService } from './mail.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  controllers: [NotificationsController],
  providers: [MailService, NotificationsService],
  exports: [MailService, NotificationsService],
})
export class NotificationsModule {}
