import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('suscripciones_push')
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ name: 'endpoint', length: 500, unique: true })
  endpoint: string;

  @Column({ name: 'p256dh', length: 255 })
  p256dh: string;

  @Column({ name: 'auth', length: 255 })
  auth: string;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;
}
