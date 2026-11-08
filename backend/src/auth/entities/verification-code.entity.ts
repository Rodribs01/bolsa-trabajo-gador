import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VerificationCodeType } from '../../common/enums/verification-code-type.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('codigos_verificacion')
export class VerificationCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ name: 'tipo', type: 'enum', enum: VerificationCodeType })
  type: VerificationCodeType;

  @Column({ name: 'codigo_hash', length: 255 })
  codeHash: string;

  @Column({ name: 'expira_en', type: 'datetime' })
  expiresAt: Date;

  @Column({ name: 'usado', default: false })
  used: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;
}
