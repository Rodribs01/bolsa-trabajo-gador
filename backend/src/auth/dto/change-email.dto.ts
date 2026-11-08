import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

function trimLowercase(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class ChangeEmailDto {
  @Transform(({ value }) => trimLowercase(value))
  @IsEmail({}, { message: 'Escribe un correo válido' })
  @MaxLength(150, { message: 'El correo debe tener hasta 150 caracteres' })
  email: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(72, { message: 'La contraseña debe tener hasta 72 caracteres' })
  password: string;

  @Transform(({ value }) => trimLowercase(value))
  @IsEmail({}, { message: 'Escribe un correo nuevo válido' })
  @MaxLength(150, { message: 'El correo debe tener hasta 150 caracteres' })
  newEmail: string;
}
