import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { Application } from '../applications/entities/application.entity.js';
import { AuditLog } from '../audit/entities/audit-log.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { CompanyStatus } from '../common/enums/company-status.enum.js';
import { JobOfferStatus } from '../common/enums/job-offer-status.enum.js';
import { NotificationType } from '../common/enums/notification-type.enum.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { Favorite } from '../job-offers/entities/favorite.entity.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Notification } from './entities/notification.entity.js';
import { NotificationsService } from './notifications.service.js';

const UNVERIFIED_DAYS = 7;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

@Injectable()
export class ScheduledTasksService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    @InjectRepository(JobOffer)
    private readonly offerRepository: Repository<JobOffer>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onApplicationBootstrap(): void {
    this.runAll().catch((error) => {
      this.logger.error('Falló la ejecución inicial de las tareas', error);
    });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async runAll(): Promise<void> {
    try {
      await this.closeExpiredOffers();
    } catch (error) {
      this.logger.error('Falló el cierre de ofertas vencidas', error);
    }
    try {
      await this.notifyExpiringFavorites();
    } catch (error) {
      this.logger.error('Falló el aviso de favoritos por vencer', error);
    }
    try {
      await this.deleteUnverifiedApplicants();
    } catch (error) {
      this.logger.error('Falló la limpieza de cuentas sin verificar', error);
    }
  }

  // Al pasar la fecha de cierre la oferta deja de recibir postulaciones y entra en selección
  async closeExpiredOffers(): Promise<number> {
    const offers = await this.offerRepository.find({
      where: {
        status: JobOfferStatus.PUBLISHED,
        closingDate: LessThan(this.dateInBolivia(0)),
      },
    });

    let total = 0;
    for (const offer of offers) {
      const result = await this.offerRepository.update(
        { id: offer.id, status: JobOfferStatus.PUBLISHED },
        { status: JobOfferStatus.IN_SELECTION },
      );
      if (result.affected !== 1) {
        continue;
      }
      total++;
      await this.auditService.log({
        userId: null,
        action: AuditAction.CHANGE_STATUS,
        tableName: 'ofertas',
        recordId: offer.id,
        previousData: { estado: JobOfferStatus.PUBLISHED },
        newData: {
          estado: JobOfferStatus.IN_SELECTION,
          motivo: 'Fecha de cierre vencida',
        },
      });
    }
    if (total > 0) {
      this.logger.log(`${total} ofertas pasaron a selección`);
    }
    return total;
  }

  // Se avisa una sola vez por oferta, el día antes del cierre, y solo a quien aún no postuló
  async notifyExpiringFavorites(): Promise<number> {
    const favorites = await this.favoriteRepository.find({
      where: {
        jobOffer: {
          status: JobOfferStatus.PUBLISHED,
          closingDate: this.dateInBolivia(1),
          company: { status: CompanyStatus.APPROVED },
        },
      },
      relations: { profile: true, jobOffer: { company: true } },
    });

    let total = 0;
    for (const favorite of favorites) {
      const link = `/job-offers/${favorite.jobOfferId}`;
      const alreadyNotified = await this.notificationRepository.existsBy({
        userId: favorite.profile.userId,
        type: NotificationType.OFFER_EXPIRING,
        link: link,
      });
      const alreadyApplied = await this.applicationRepository.existsBy({
        jobOfferId: favorite.jobOfferId,
        profileId: favorite.profileId,
      });
      if (alreadyNotified || alreadyApplied) {
        continue;
      }

      await this.notificationsService.notify({
        userId: favorite.profile.userId,
        type: NotificationType.OFFER_EXPIRING,
        title: 'Una oferta que guardaste cierra mañana',
        message: `La oferta "${favorite.jobOffer.title}" de ${favorite.jobOffer.company.businessName} recibe postulaciones hasta mañana. Postula antes de que cierre.`,
        link: link,
      });
      total++;
    }
    return total;
  }

  // Una cuenta sin verificar por 7 días se elimina para que no ocupe un CI o un correo ajeno
  async deleteUnverifiedApplicants(): Promise<number> {
    const limit = new Date(Date.now() - UNVERIFIED_DAYS * DAY_MILLISECONDS);
    const users = await this.userRepository.find({
      where: {
        emailVerified: false,
        createdAt: LessThan(limit),
        role: { name: RoleName.APPLICANT },
      },
    });

    let total = 0;
    for (const user of users) {
      try {
        await this.dataSource.transaction(async (manager) => {
          await manager.update(AuditLog, { userId: user.id }, { userId: null });
          await manager.delete(ApplicantProfile, { userId: user.id });
          const result = await manager.delete(User, {
            id: user.id,
            emailVerified: false,
          });
          // Si la cuenta se verificó mientras corría la tarea, se deshace todo y se conserva
          if (result.affected !== 1) {
            throw new Error('La cuenta ya fue verificada');
          }
        });
      } catch (error) {
        this.logger.warn(`No se eliminó la cuenta ${user.id}`, error);
        continue;
      }
      await this.auditService.log({
        userId: null,
        action: AuditAction.DELETE,
        tableName: 'usuarios',
        recordId: user.id,
        previousData: { motivo: 'Cuenta sin verificar por más de 7 días' },
      });
      total++;
    }
    if (total > 0) {
      this.logger.log(`${total} cuentas sin verificar eliminadas`);
    }
    return total;
  }

  private dateInBolivia(daysFromToday: number): string {
    return new Date(
      Date.now() + daysFromToday * DAY_MILLISECONDS,
    ).toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
  }
}
