import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class SaveExperienceDto {
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'La empresa es obligatoria' })
  @Length(2, 150, { message: 'La empresa debe tener entre 2 y 150 caracteres' })
  company: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'El cargo es obligatorio' })
  @Length(2, 100, { message: 'El cargo debe tener entre 2 y 100 caracteres' })
  position: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'El lugar debe ser texto' })
  @MaxLength(100, { message: 'El lugar debe tener hasta 100 caracteres' })
  location?: string | null;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de inicio no es válida',
  })
  @IsDateString(
    { strict: true },
    { message: 'La fecha de inicio no es válida' },
  )
  startDate: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de fin no es válida' })
  @IsDateString({ strict: true }, { message: 'La fecha de fin no es válida' })
  endDate?: string | null;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'La descripción debe ser texto' })
  @MaxLength(2000, {
    message: 'La descripción debe tener hasta 2000 caracteres',
  })
  description?: string | null;
}
