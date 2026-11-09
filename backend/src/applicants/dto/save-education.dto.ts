import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class SaveEducationDto {
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'El título es obligatorio' })
  @Length(3, 150, { message: 'El título debe tener entre 3 y 150 caracteres' })
  title: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'La institución es obligatoria' })
  @Length(3, 150, {
    message: 'La institución debe tener entre 3 y 150 caracteres',
  })
  institution: string;

  @IsInt({ message: 'El año de titulación debe ser un número entero' })
  @Min(1950, { message: 'El año de titulación no es válido' })
  graduationYear: number;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'El número de título debe ser texto' })
  @MaxLength(30, {
    message: 'El número de título debe tener hasta 30 caracteres',
  })
  nationalTitleNumber?: string | null;
}
