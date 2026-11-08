import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Skill } from '../../catalogs/entities/skill.entity.js';
import { SkillLevel } from '../../common/enums/skill-level.enum.js';
import { ApplicantProfile } from './applicant-profile.entity.js';

@Entity('postulante_habilidad')
@Unique(['profileId', 'skillId'])
export class ApplicantSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'perfil_postulante_id' })
  profileId: number;

  @ManyToOne(() => ApplicantProfile, (profile) => profile.skills, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'perfil_postulante_id' })
  profile: ApplicantProfile;

  @Column({ name: 'habilidad_id' })
  skillId: number;

  @ManyToOne(() => Skill)
  @JoinColumn({ name: 'habilidad_id' })
  skill: Skill;

  @Column({ name: 'nivel', type: 'enum', enum: SkillLevel })
  level: SkillLevel;
}
