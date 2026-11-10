import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscriptionDto } from './dto/push-subscription.dto.js';
import { PushSubscription } from './entities/push-subscription.entity.js';

const MAX_SUBSCRIPTIONS_PER_USER = 10;
const ALLOWED_PUSH_HOSTS = [
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'notify.windows.com',
  'push.apple.com',
];

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly publicKey: string | null = null;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subscriptionRepository: Repository<PushSubscription>,
    private readonly config: ConfigService,
  ) {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT');
    if (!publicKey || !privateKey || !subject) {
      this.logger.warn(
        'Faltan las claves VAPID: las notificaciones push quedan desactivadas',
      );
      return;
    }
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.publicKey = publicKey;
    } catch (error) {
      this.logger.error(
        'Las claves VAPID no son válidas: las notificaciones push quedan desactivadas',
        error,
      );
    }
  }

  getPublicKey() {
    return { publicKey: this.publicKey };
  }

  async saveSubscription(userId: number, dto: PushSubscriptionDto) {
    if (!this.publicKey) {
      throw new BadRequestException(
        'Las notificaciones push no están disponibles en este momento',
      );
    }
    // Solo se aceptan servicios push de los navegadores, para no enviar datos a cualquier servidor
    if (!this.isAllowedHost(dto.endpoint)) {
      throw new BadRequestException(
        'El servicio de notificaciones del navegador no es compatible',
      );
    }

    const existing = await this.subscriptionRepository.findOneBy({
      endpoint: dto.endpoint,
    });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = dto.p256dh;
      existing.auth = dto.auth;
      await this.subscriptionRepository.save(existing);
      return { message: 'Notificaciones activadas en este dispositivo' };
    }

    const subscriptions = await this.subscriptionRepository.find({
      where: { userId: userId },
      order: { id: 'ASC' },
    });
    if (subscriptions.length >= MAX_SUBSCRIPTIONS_PER_USER) {
      await this.subscriptionRepository.delete({ id: subscriptions[0].id });
    }
    await this.subscriptionRepository.save(
      this.subscriptionRepository.create({
        userId: userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
      }),
    );
    return { message: 'Notificaciones activadas en este dispositivo' };
  }

  async removeSubscription(userId: number, endpoint: string) {
    await this.subscriptionRepository.delete({
      userId: userId,
      endpoint: endpoint,
    });
    return { message: 'Notificaciones desactivadas en este dispositivo' };
  }

  async send(
    userId: number,
    title: string,
    message: string,
    link: string | null,
  ): Promise<void> {
    if (!this.publicKey) {
      return;
    }
    const subscriptions = await this.subscriptionRepository.findBy({
      userId: userId,
    });
    const payload = JSON.stringify({
      notification: {
        title: title,
        body: message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: {
          onActionClick: {
            default: {
              operation: 'navigateLastFocusedOrOpen',
              url: link ?? '/notifications',
            },
          },
        },
      },
    });

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          payload,
          { TTL: 24 * 60 * 60 },
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number }).statusCode;
        if (statusCode === 410) {
          await this.subscriptionRepository.delete({ id: subscription.id });
        } else {
          this.logger.warn(
            `No se pudo enviar el aviso push de la suscripción ${subscription.id} (código ${statusCode})`,
          );
        }
      }
    }
  }

  private isAllowedHost(endpoint: string): boolean {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      return false;
    }
    if (url.port || url.username || url.password) {
      return false;
    }
    const host = url.hostname;
    for (const allowed of ALLOWED_PUSH_HOSTS) {
      if (host === allowed || host.endsWith(`.${allowed}`)) {
        return true;
      }
    }
    return false;
  }
}
