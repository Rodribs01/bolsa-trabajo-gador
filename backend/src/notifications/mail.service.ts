import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, subject: string, html: string): Promise<void> {
    const driver = this.config.get<string>('MAIL_DRIVER');

    if (driver === 'consola') {
      this.logger.log(`Correo para ${to} | ${subject} | ${html}`);
      return;
    }
    if (driver !== 'brevo') {
      throw new Error('MAIL_DRIVER debe ser consola o brevo');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': this.config.get<string>('BREVO_API_KEY') ?? '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          email: this.config.get<string>('MAIL_FROM'),
          name: this.config.get<string>('MAIL_FROM_NAME'),
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Brevo respondió con el estado ${response.status}`);
    }
  }
}
