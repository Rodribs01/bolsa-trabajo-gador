import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Catalog } from '../../catalogs/entities/catalog.entity.js';
import { LanguageLevel } from '../../common/enums/language-level.enum.js';
import { ApplicantProfile } from './applicant-profile.entity.js';

@Entity('postulante_idioma')
@Unique(['profileId', 'languageId'])
export class ApplicantLanguage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'perfil_postulante_id' })
  profileId: number;

  @ManyToOne(() => ApplicantProfile, (profile) => profile.languages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'perfil_postulante_id' })
  profile: ApplicantProfile;

  @Column({ name: 'idioma_id' })
  languageId: number;

  @ManyToOne(() => Catalog)
  @JoinColumn({ name: 'idioma_id' })
  language: Catalog;

  @Column({ name: 'nivel', type: 'enum', enum: LanguageLevel })
  level: LanguageLevel;
}
