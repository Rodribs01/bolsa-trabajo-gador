import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AuditAction } from '../../common/enums/audit-action.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('auditoria')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  user: User | null;

  @Column({ name: 'accion', type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ name: 'tabla', length: 60 })
  tableName: string;

  @Column({ name: 'registro_id', type: 'int', nullable: true })
  recordId: number | null;

  @Column({ name: 'datos_anteriores', type: 'json', nullable: true })
  previousData: object | null;

  @Column({ name: 'datos_nuevos', type: 'json', nullable: true })
  newData: object | null;

  @Column({ name: 'ip', type: 'varchar', length: 45, nullable: true })
  ip: string | null;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;
}
