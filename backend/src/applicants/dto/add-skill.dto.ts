import { IsEnum, IsInt } from 'class-validator';
import { SkillLevel } from '../../common/enums/skill-level.enum.js';

export class AddSkillDto {
  @IsInt({ message: 'Selecciona una habilidad' })
  skillId: number;

  @IsEnum(SkillLevel, { message: 'El nivel de la habilidad no es válido' })
  level: SkillLevel;
}
