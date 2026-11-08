import { Module } from '@nestjs/common';
import { MailService } from './mail.service.js';
import { SmsService } from './sms.service.js';

@Module({
  providers: [MailService, SmsService],
  exports: [MailService, SmsService],
})
export class NotificationsModule {}
