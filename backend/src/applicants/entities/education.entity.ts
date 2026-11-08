import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApplicantProfile } from './applicant-profile.entity.js';

@Entity('formaciones')
export class Education {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'perfil_postulante_id' })
  profileId: number;

  @ManyToOne(() => ApplicantProfile, (profile) => profile.educations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'perfil_postulante_id' })
  profile: ApplicantProfile;

  @Column({ name: 'titulo', length: 150 })
  title: string;

  @Column({ name: 'institucion', length: 150 })
  institution: string;

  @Column({ name: 'anio_titulacion', type: 'smallint' })
  graduationYear: number;

  @Column({ name: 'nro_titulo_nacional', type: 'varchar', length: 30, nullable: true })
  nationalTitleNumber: string | null;
}
