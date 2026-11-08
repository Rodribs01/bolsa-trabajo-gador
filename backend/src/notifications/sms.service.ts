import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { MailService } from './mail.service.js';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async sendOtp(phone: string, email: string, code: string): Promise<void> {
    const message = `Tu código de verificación de la Bolsa de Trabajo GADOR es ${code}. Vence en 10 minutos.`;
    const driver = this.config.get<string>('SMS_DRIVER');

    if (driver === 'consola') {
      this.logger.log(`Código para +591${phone}: ${code}`);
    } else if (driver === 'twilio') {
      await this.sendWithTwilio(phone, message);
    } else if (driver === 'email') {
      await this.mailService.send(
        email,
        'Código de verificación',
        `<p>${message}</p>`,
      );
    } else {
      throw new Error('SMS_DRIVER debe ser consola, twilio o email');
    }
  }

  private async sendWithTwilio(phone: string, message: string): Promise<void> {
    const client = twilio(
      this.config.get<string>('TWILIO_ACCOUNT_SID'),
      this.config.get<string>('TWILIO_AUTH_TOKEN'),
    );
    await client.messages.create({
      body: message,
      from: this.config.get<string>('TWILIO_PHONE_NUMBER'),
      to: `+591${phone}`,
    });
  }
}
