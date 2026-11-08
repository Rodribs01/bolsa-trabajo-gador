import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicantProfile } from '../../applicants/entities/applicant-profile.entity.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { JobOffer } from '../../job-offers/entities/job-offer.entity.js';

// El índice único impide que un postulante postule dos veces a la misma oferta
@Entity('postulaciones')
@Unique(['jobOfferId', 'profileId'])
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'oferta_id' })
  jobOfferId: number;

  @ManyToOne(() => JobOffer)
  @JoinColumn({ name: 'oferta_id' })
  jobOffer: JobOffer;

  @Column({ name: 'perfil_postulante_id' })
  profileId: number;

  @ManyToOne(() => ApplicantProfile)
  @JoinColumn({ name: 'perfil_postulante_id' })
  profile: ApplicantProfile;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status: ApplicationStatus;

  @Column({ name: 'porcentaje_match', default: 0 })
  matchPercentage: number;

  @Column({ name: 'visto_en', type: 'datetime', nullable: true })
  seenAt: Date | null;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  updatedAt: Date;
}
