import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { JobOfferStatus } from '../common/enums/job-offer-status.enum.js';
import { JobOffer } from '../job-offers/entities/job-offer.entity.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { Setting } from './entities/setting.entity.js';

const ACTIVE_LIMIT_KEY = 'limite_ofertas_activas';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
    @InjectRepository(JobOffer)
    private readonly offerRepository: Repository<JobOffer>,
    private readonly auditService: AuditService,
  ) {}

  async getSettings() {
    const setting = await this.getLimitSetting();
    const limit = Number(setting.value);

    const lastChange = await this.auditService.findLastUpdate(
      'configuraciones',
      setting.id,
    );

    let lastChangeData: {
      date: Date;
      userName: string | null;
      previousValue: string | null;
      newValue: string | null;
    } | null = null;
    if (lastChange) {
      const previousData = lastChange.previousData as { valor?: string };
      const newData = lastChange.newData as { valor?: string };
      lastChangeData = {
        date: lastChange.createdAt,
        userName: lastChange.user ? lastChange.user.name : null,
        previousValue: previousData ? (previousData.valor ?? null) : null,
        newValue: newData ? (newData.valor ?? null) : null,
      };
    }

    return {
      activeOffersLimit: limit,
      companiesAtLimit: await this.countCompaniesAtLimit(limit),
      lastChange: lastChangeData,
    };
  }

  async updateSettings(userId: number, dto: UpdateSettingsDto, ip: string) {
    const setting = await this.getLimitSetting();
    const previousValue = setting.value;
    const newValue = String(dto.activeOffersLimit);

    if (previousValue !== newValue) {
      setting.value = newValue;
      await this.settingRepository.save(setting);
      await this.auditService.log({
        userId: userId,
        action: AuditAction.UPDATE,
        tableName: 'configuraciones',
        recordId: setting.id,
        previousData: { clave: setting.key, valor: previousValue },
        newData: { clave: setting.key, valor: newValue },
        ip: ip,
      });
    }
    return this.getSettings();
  }

  private async getLimitSetting(): Promise<Setting> {
    const setting = await this.settingRepository.findOneBy({
      key: ACTIVE_LIMIT_KEY,
    });
    if (!setting) {
      throw new NotFoundException(
        'La configuración del límite de ofertas no existe. Ejecuta los seeders',
      );
    }
    return setting;
  }

  private async countCompaniesAtLimit(limit: number): Promise<number> {
    const rows = await this.offerRepository
      .createQueryBuilder('offer')
      .select('offer.companyId', 'companyId')
      .where('offer.status IN (:...statuses)', {
        statuses: [
          JobOfferStatus.IN_REVIEW,
          JobOfferStatus.PUBLISHED,
          JobOfferStatus.IN_SELECTION,
        ],
      })
      .groupBy('offer.companyId')
      .having('COUNT(offer.id) >= :limit', { limit: limit })
      .getRawMany();
    return rows.length;
  }
}
