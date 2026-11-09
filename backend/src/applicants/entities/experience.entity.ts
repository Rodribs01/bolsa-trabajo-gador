import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApplicantProfile } from './applicant-profile.entity.js';

@Entity('experiencias')
export class Experience {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'perfil_postulante_id' })
  profileId: number;

  @ManyToOne(() => ApplicantProfile, (profile) => profile.experiences, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'perfil_postulante_id' })
  profile: ApplicantProfile;

  @Column({ name: 'empresa', length: 150 })
  company: string;

  @Column({ name: 'cargo', length: 100 })
  position: string;

  @Column({ name: 'lugar', type: 'varchar', length: 100, nullable: true })
  location: string | null;

  @Column({ name: 'fecha_inicio', type: 'date', utc: true })
  startDate: string;

  // Si es nula, el postulante sigue trabajando ahí
  @Column({ name: 'fecha_fin', type: 'date', nullable: true, utc: true })
  endDate: string | null;

  // Se calcula a partir de las fechas al guardar
  @Column({
    name: 'anios',
    type: 'decimal',
    precision: 4,
    scale: 1,
    default: 0,
  })
  years: number;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  description: string | null;
}
