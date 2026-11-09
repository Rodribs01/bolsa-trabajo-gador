import { IsEnum } from 'class-validator';
import { LanguageLevel } from '../../common/enums/language-level.enum.js';

export class UpdateLanguageDto {
  @IsEnum(LanguageLevel, { message: 'El nivel del idioma no es válido' })
  level: LanguageLevel;
}
