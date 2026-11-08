import { IsString, Matches } from 'class-validator';
import { PASSWORD_MESSAGE, PASSWORD_PATTERN } from './password.rule.js';

export class ResetPasswordDto {
  @Matches(/^[a-f0-9]{64}$/, { message: 'El enlace no es válido' })
  token: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
