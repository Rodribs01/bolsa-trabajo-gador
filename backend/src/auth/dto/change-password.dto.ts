import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from './password.rule.js';

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual es obligatoria' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  @MaxLength(72, { message: 'La contraseña debe tener hasta 72 caracteres' })
  currentPassword: string;

  @IsString({ message: 'La contraseña nueva es obligatoria' })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
