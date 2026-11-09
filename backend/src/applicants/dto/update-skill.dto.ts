import { IsEnum } from 'class-validator';
import { SkillLevel } from '../../common/enums/skill-level.enum.js';

export class UpdateSkillDto {
  @IsEnum(SkillLevel, { message: 'El nivel de la habilidad no es válido' })
  level: SkillLevel;
}
