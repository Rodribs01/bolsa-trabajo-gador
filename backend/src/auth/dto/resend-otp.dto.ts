import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ResendOtpDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Escribe un correo válido' })
  email: string;
}
