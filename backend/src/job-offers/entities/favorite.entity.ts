import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ApplicantProfile } from '../../applicants/entities/applicant-profile.entity.js';
import { JobOffer } from './job-offer.entity.js';

@Entity('favoritos')
@Unique(['profileId', 'jobOfferId'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'perfil_postulante_id' })
  profileId: number;

  @ManyToOne(() => ApplicantProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'perfil_postulante_id' })
  profile: ApplicantProfile;

  @Column({ name: 'oferta_id' })
  jobOfferId: number;

  @ManyToOne(() => JobOffer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'oferta_id' })
  jobOffer: JobOffer;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;
}
