import { IsEnum, IsInt } from 'class-validator';
import { LanguageLevel } from '../../common/enums/language-level.enum.js';

export class AddLanguageDto {
  @IsInt({ message: 'Selecciona un idioma' })
  languageId: number;

  @IsEnum(LanguageLevel, { message: 'El nivel del idioma no es válido' })
  level: LanguageLevel;
}
