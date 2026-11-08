import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Skill } from '../../catalogs/entities/skill.entity.js';
import { JobOffer } from './job-offer.entity.js';

@Entity('oferta_habilidad')
@Unique(['jobOfferId', 'skillId'])
export class JobOfferSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'oferta_id' })
  jobOfferId: number;

  @ManyToOne(() => JobOffer, (jobOffer) => jobOffer.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'oferta_id' })
  jobOffer: JobOffer;

  @Column({ name: 'habilidad_id' })
  skillId: number;

  @ManyToOne(() => Skill)
  @JoinColumn({ name: 'habilidad_id' })
  skill: Skill;

  // Obligatoria pesa 2 y deseable pesa 1 en el cálculo del % de coincidencia
  @Column({ name: 'obligatoria', default: true })
  required: boolean;
}
