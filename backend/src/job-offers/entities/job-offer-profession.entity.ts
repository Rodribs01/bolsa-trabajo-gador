import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Catalog } from '../../catalogs/entities/catalog.entity.js';
import { JobOffer } from './job-offer.entity.js';

@Entity('oferta_profesion')
@Unique(['jobOfferId', 'professionId'])
export class JobOfferProfession {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'oferta_id' })
  jobOfferId: number;

  @ManyToOne(() => JobOffer, (jobOffer) => jobOffer.professions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'oferta_id' })
  jobOffer: JobOffer;

  @Column({ name: 'profesion_id' })
  professionId: number;

  @ManyToOne(() => Catalog)
  @JoinColumn({ name: 'profesion_id' })
  profession: Catalog;
}
