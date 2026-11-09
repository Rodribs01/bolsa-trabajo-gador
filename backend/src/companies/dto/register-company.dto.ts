import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  PASSWORD_MESSAGE,
  PASSWORD_PATTERN,
} from '../../auth/dto/password.rule.js';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class RegisterCompanyDto {
  @Transform(({ value }) => trim(value))
  @Matches(/^\d{5,20}$/, { message: 'El NIT debe tener de 5 a 20 dígitos' })
  nit: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'La razón social es obligatoria' })
  @Length(2, 150, {
    message: 'La razón social debe tener entre 2 y 150 caracteres',
  })
  businessName: string;

  @Type(() => Number)
  @IsInt({ message: 'Selecciona un rubro' })
  sectorId: number;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'El representante legal es obligatorio' })
  @Length(2, 150, {
    message: 'El representante legal debe tener entre 2 y 150 caracteres',
  })
  legalRepresentative: string;

  @Transform(({ value }) => trim(value))
  @Matches(/^\d{5,10}(-?[0-9A-Z]{1,2})?$/, {
    message: 'La cédula del representante no es válida',
  })
  representativeCi: string;

  @Transform(({ value }) => trim(value))
  @Matches(/^[67]\d{7}$/, {
    message: 'El celular debe tener 8 dígitos y empezar con 6 o 7',
  })
  phone: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Escribe un correo válido' })
  @MaxLength(150, { message: 'El correo debe tener hasta 150 caracteres' })
  email: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'La dirección es obligatoria' })
  @Length(5, 200, {
    message: 'La dirección debe tener entre 5 y 200 caracteres',
  })
  address: string;

  @Type(() => Number)
  @IsInt({ message: 'Selecciona un municipio' })
  municipalityId: number;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'La descripción es obligatoria' })
  @Length(10, 500, {
    message: 'La descripción debe tener entre 10 y 500 caracteres',
  })
  description: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password: string;
}
