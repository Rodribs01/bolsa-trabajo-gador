import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class UpdateProfileDto {
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Los nombres son obligatorios' })
  @Length(2, 74, { message: 'Los nombres deben tener entre 2 y 74 caracteres' })
  firstNames: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Los apellidos son obligatorios' })
  @Length(2, 74, {
    message: 'Los apellidos deben tener entre 2 y 74 caracteres',
  })
  lastNames: string;

  @Transform(({ value }) => trim(value))
  @Matches(/^[67]\d{7}$/, {
    message: 'El celular debe tener 8 dígitos y empezar con 6 o 7',
  })
  phone: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de nacimiento no es válida',
  })
  @IsDateString(
    { strict: true },
    { message: 'La fecha de nacimiento no es válida' },
  )
  birthDate?: string | null;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'La dirección debe ser texto' })
  @MaxLength(200, { message: 'La dirección debe tener hasta 200 caracteres' })
  address?: string | null;

  @IsOptional()
  @IsInt({ message: 'Selecciona un municipio' })
  @Min(1, { message: 'Selecciona un municipio' })
  municipalityId?: number | null;

  @IsOptional()
  @IsInt({ message: 'Selecciona una profesión' })
  @Min(1, { message: 'Selecciona una profesión' })
  professionId?: number | null;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'El resumen debe ser texto' })
  @MaxLength(2000, { message: 'El resumen debe tener hasta 2000 caracteres' })
  summary?: string | null;
}
