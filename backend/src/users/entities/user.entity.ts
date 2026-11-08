import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity.js';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'rol_id' })
  roleId: number;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'rol_id' })
  role: Role;

  @Column({ name: 'nombre', length: 150 })
  name: string;

  @Column({ name: 'email', length: 150, unique: true })
  email: string;

  @Column({ name: 'celular', length: 20, nullable: true })
  phone: string;

  @Column({ name: 'password', length: 255, select: false })
  password: string;

  @Column({ name: 'celular_verificado', default: false })
  phoneVerified: boolean;

  @Column({ name: 'activo', default: true })
  active: boolean;

  @Column({ name: 'intentos_fallidos', default: 0 })
  failedAttempts: number;

  @Column({ name: 'bloqueado_hasta', type: 'datetime', nullable: true })
  lockedUntil: Date | null;

  @Column({ name: 'ultimo_acceso', type: 'datetime', nullable: true })
  lastLogin: Date | null;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  updatedAt: Date;
}
