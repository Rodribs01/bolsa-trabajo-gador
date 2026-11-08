import { Transform } from 'class-transformer';
import { IsEmail, Matches } from 'class-validator';

export class VerifyOtpDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Escribe un correo válido' })
  email: string;

  @Matches(/^\d{6}$/, { message: 'El código debe tener 6 dígitos' })
  code: string;
}
