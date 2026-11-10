import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { ListAuditDto } from './dto/list-audit.dto.js';
import { AuditLog } from './entities/audit-log.entity.js';

export interface AuditEntry {
  userId?: number | null;
  action: AuditAction;
  tableName: string;
  recordId?: number | null;
  previousData?: object | null;
  newData?: object | null;
  ip?: string | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(entry: AuditEntry): Promise<void> {
    const auditLog = this.auditRepository.create({
      userId: entry.userId ?? null,
      action: entry.action,
      tableName: entry.tableName,
      recordId: entry.recordId ?? null,
      previousData: entry.previousData ?? null,
      newData: entry.newData ?? null,
      ip: entry.ip ?? null,
    });
    await this.auditRepository.save(auditLog);
  }

  async findAll(dto: ListAuditDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const query = this.auditRepository
      .createQueryBuilder('audit')
      .leftJoin('audit.user', 'user')
      .addSelect(['user.id', 'user.name', 'user.email'])
      .orderBy('audit.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (dto.from) {
      query.andWhere('audit.createdAt >= :from', {
        from: new Date(`${dto.from}T00:00:00-04:00`),
      });
    }
    if (dto.to) {
      const end = new Date(`${dto.to}T00:00:00-04:00`);
      end.setUTCDate(end.getUTCDate() + 1);
      query.andWhere('audit.createdAt < :to', { to: end });
    }
    if (dto.action) {
      query.andWhere('audit.action = :action', { action: dto.action });
    }
    if (dto.tableName) {
      query.andWhere('audit.tableName = :tableName', {
        tableName: dto.tableName,
      });
    }
    if (dto.user) {
      const safeUser = dto.user
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query.andWhere('(user.email LIKE :user OR user.name LIKE :user)', {
        user: `%${safeUser}%`,
      });
    }

    const [items, total] = await query.getManyAndCount();
    return { items: items, total: total, page: page, limit: limit };
  }

  async findTableNames(): Promise<string[]> {
    const rows: { tableName: string }[] = await this.auditRepository
      .createQueryBuilder('audit')
      .select('DISTINCT audit.tableName', 'tableName')
      .orderBy('tableName', 'ASC')
      .getRawMany();
    const names: string[] = [];
    for (const row of rows) {
      names.push(row.tableName);
    }
    return names;
  }

  findLastUpdate(tableName: string, recordId: number) {
    return this.auditRepository.findOne({
      where: {
        tableName: tableName,
        recordId: recordId,
        action: AuditAction.UPDATE,
      },
      relations: { user: true },
      order: { id: 'DESC' },
    });
  }
}
