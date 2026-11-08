import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const CI_ISSUED_IN = ['LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BE', 'PD'];

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function trimLowercase(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export class RegisterApplicantDto {
  @Transform(({ value }) => trim(value))
  @Matches(/^\d{5,10}(-?[0-9A-Z]{1,2})?$/, {
    message: 'La cédula de identidad no es válida',
  })
  ci: string;

  @IsIn(CI_ISSUED_IN, { message: 'Selecciona dónde se expidió tu cédula' })
  ciIssuedIn: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Los nombres son obligatorios' })
  @Length(2, 80, { message: 'Los nombres deben tener entre 2 y 80 caracteres' })
  firstNames: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Los apellidos son obligatorios' })
  @Length(2, 80, {
    message: 'Los apellidos deben tener entre 2 y 80 caracteres',
  })
  lastNames: string;

  @Transform(({ value }) => trim(value))
  @Matches(/^[67]\d{7}$/, {
    message: 'El celular debe tener 8 dígitos y empezar con 6 o 7',
  })
  phone: string;

  @Transform(({ value }) => trimLowercase(value))
  @IsEmail({}, { message: 'Escribe un correo válido' })
  @MaxLength(150, { message: 'El correo debe tener hasta 150 caracteres' })
  email: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/, {
    message:
      'La contraseña debe tener de 8 a 72 caracteres, con una mayúscula, una minúscula y un número',
  })
  password: string;
}
