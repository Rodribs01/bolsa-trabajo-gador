import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction } from '../common/enums/audit-action.enum.js';
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
}
