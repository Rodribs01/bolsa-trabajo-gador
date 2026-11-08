import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationType } from '../../common/enums/notification-type.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('notificaciones')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ name: 'tipo', type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ name: 'titulo', length: 150 })
  title: string;

  @Column({ name: 'mensaje', length: 500 })
  message: string;

  @Column({ name: 'enlace', type: 'varchar', length: 255, nullable: true })
  link: string | null;

  @Column({ name: 'leida', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;
}
