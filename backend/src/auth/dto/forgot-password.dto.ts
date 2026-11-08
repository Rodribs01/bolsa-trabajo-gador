import { Transform } from 'class-transformer';
import { IsEmail, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Escribe un correo válido' })
  @MaxLength(150, { message: 'El correo debe tener hasta 150 caracteres' })
  email: string;
}
