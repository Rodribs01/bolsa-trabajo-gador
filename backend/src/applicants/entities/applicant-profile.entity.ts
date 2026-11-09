import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Catalog } from '../../catalogs/entities/catalog.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { ApplicantLanguage } from './applicant-language.entity.js';
import { ApplicantSkill } from './applicant-skill.entity.js';
import { Education } from './education.entity.js';
import { Experience } from './experience.entity.js';

@Entity('perfiles_postulante')
export class ApplicantProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ name: 'ci', length: 15, unique: true })
  ci: string;

  @Column({ name: 'ci_expedido', length: 3 })
  ciIssuedIn: string;

  @Column({ name: 'nombres', length: 80 })
  firstNames: string;

  @Column({ name: 'apellidos', length: 80 })
  lastNames: string;

  @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true, utc: true })
  birthDate: string | null;

  @Column({ name: 'direccion', type: 'varchar', length: 200, nullable: true })
  address: string | null;

  @Column({ name: 'municipio_id', type: 'int', nullable: true })
  municipalityId: number | null;

  @ManyToOne(() => Catalog, { nullable: true })
  @JoinColumn({ name: 'municipio_id' })
  municipality: Catalog | null;

  @Column({ name: 'profesion_id', type: 'int', nullable: true })
  professionId: number | null;

  @ManyToOne(() => Catalog, { nullable: true })
  @JoinColumn({ name: 'profesion_id' })
  profession: Catalog | null;

  @Column({ name: 'foto', type: 'varchar', length: 255, nullable: true })
  photo: string | null;

  @Column({ name: 'cv', type: 'varchar', length: 255, nullable: true })
  cv: string | null;

  @Column({ name: 'resumen', type: 'text', nullable: true })
  summary: string | null;

  @Column({ name: 'porcentaje_completitud', default: 0 })
  completionPercentage: number;

  @OneToMany(() => Education, (education) => education.profile)
  educations: Education[];

  @OneToMany(() => Experience, (experience) => experience.profile)
  experiences: Experience[];

  @OneToMany(() => ApplicantSkill, (applicantSkill) => applicantSkill.profile)
  skills: ApplicantSkill[];

  @OneToMany(() => ApplicantLanguage, (language) => language.profile)
  languages: ApplicantLanguage[];

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  updatedAt: Date;
}
