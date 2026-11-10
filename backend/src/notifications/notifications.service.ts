import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { NotificationType } from '../common/enums/notification-type.enum.js';
import { User } from '../users/entities/user.entity.js';
import { Notification } from './entities/notification.entity.js';
import { MailService } from './mail.service.js';

export interface NewNotification {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  // Un aviso que falla no debe deshacer la acción que lo originó
  async notify(data: NewNotification): Promise<void> {
    try {
      await this.notificationRepository.save(
        this.notificationRepository.create({
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message.slice(0, 500),
          link: data.link,
        }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo guardar la notificación del usuario ${data.userId}`,
        error,
      );
      return;
    }

    this.sendEmail(data).catch((error) => {
      this.logger.error(
        `No se pudo enviar el correo al usuario ${data.userId}`,
        error,
      );
    });
  }

  async findMine(userId: number, dto: PaginationDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const [items, total] = await this.notificationRepository.findAndCount({
      where: { userId: userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unreadCount = await this.notificationRepository.countBy({
      userId: userId,
      read: false,
    });

    const result = [];
    for (const item of items) {
      result.push({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        link: item.link,
        read: item.read,
        createdAt: item.createdAt,
      });
    }
    return {
      items: result,
      total: total,
      page: page,
      limit: limit,
      unreadCount: unreadCount,
    };
  }

  async markAsRead(userId: number, id: number) {
    const result = await this.notificationRepository.update(
      { id: id, userId: userId },
      { read: true },
    );
    if (result.affected !== 1) {
      throw new NotFoundException('Notificación no encontrada');
    }
    return { id: id, read: true };
  }

  async markAllAsRead(userId: number) {
    await this.notificationRepository.update(
      { userId: userId, read: false },
      { read: true },
    );
    return { message: 'Marcamos todas tus notificaciones como leídas' };
  }

  private async sendEmail(data: NewNotification): Promise<void> {
    const user = await this.userRepository.findOneBy({ id: data.userId });
    if (!user || !user.active) {
      return;
    }

    let linkHtml = '';
    if (data.link) {
      const url = `${this.config.getOrThrow<string>('FRONTEND_URL')}${data.link}`;
      linkHtml = `<p><a href="${escapeHtml(url)}">Ver en la Bolsa de Trabajo</a></p>`;
    }
    const html =
      `<p>Hola, ${escapeHtml(user.name)}:</p>` +
      `<p>${escapeHtml(data.message)}</p>` +
      linkHtml +
      '<p>Bolsa de Trabajo Departamental · G.A.D.OR.</p>';

    await this.mailService.send(user.email, data.title, html);
  }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
