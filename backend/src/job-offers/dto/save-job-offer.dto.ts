import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

function trim(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export class JobOfferSkillDto {
  @IsInt({ message: 'La habilidad no es válida' })
  skillId: number;

  @IsBoolean({ message: 'Indica si la habilidad es obligatoria o deseable' })
  required: boolean;
}

export class SaveJobOfferDto {
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'El título es obligatorio' })
  @Length(3, 150, { message: 'El título debe tener entre 3 y 150 caracteres' })
  title: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'La descripción es obligatoria' })
  @Length(20, 2000, {
    message: 'La descripción debe tener entre 20 y 2000 caracteres',
  })
  description: string;

  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Indica los requisitos obligatorios' })
  @Length(5, 2000, {
    message:
      'Los requisitos obligatorios deben tener entre 5 y 2000 caracteres',
  })
  requiredRequirements: string;

  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'Los requisitos deseables deben ser texto' })
  @MaxLength(2000, {
    message: 'Los requisitos deseables deben tener hasta 2000 caracteres',
  })
  desiredRequirements?: string;

  @IsArray({ message: 'Selecciona al menos una profesión' })
  @ArrayMinSize(1, { message: 'Selecciona al menos una profesión' })
  @ArrayMaxSize(10, { message: 'Selecciona hasta 10 profesiones' })
  @ArrayUnique({ message: 'No repitas profesiones' })
  @IsInt({ each: true, message: 'La profesión no es válida' })
  professionIds: number[];

  @IsInt({ message: 'Los años de experiencia deben ser un número entero' })
  @Min(0, { message: 'Los años de experiencia no pueden ser negativos' })
  @Max(50, { message: 'Los años de experiencia deben ser como máximo 50' })
  yearsOfExperience: number;

  @IsInt({ message: 'Selecciona un tipo de contrato' })
  contractTypeId: number;

  @IsInt({ message: 'Selecciona una modalidad' })
  modalityId: number;

  @IsInt({ message: 'Selecciona un municipio' })
  municipalityId: number;

  @IsBoolean({ message: 'Indica si el salario es a tratar' })
  salaryToNegotiate: boolean;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El salario mínimo debe ser un número' },
  )
  @Min(0, { message: 'El salario mínimo no puede ser negativo' })
  @Max(99999999, { message: 'El salario mínimo es demasiado alto' })
  minSalary?: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El salario máximo debe ser un número' },
  )
  @Min(0, { message: 'El salario máximo no puede ser negativo' })
  @Max(99999999, { message: 'El salario máximo es demasiado alto' })
  maxSalary?: number;

  @IsOptional()
  @IsArray({ message: 'Los beneficios deben ser una lista' })
  @ArrayMaxSize(20, { message: 'Agrega hasta 20 beneficios' })
  @IsString({ each: true, message: 'Cada beneficio debe ser texto' })
  @MaxLength(100, {
    each: true,
    message: 'Cada beneficio debe tener hasta 100 caracteres',
  })
  benefits?: string[];

  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha de cierre debe tener el formato AAAA-MM-DD',
  })
  @IsDateString(
    { strict: true },
    { message: 'La fecha de cierre no es válida' },
  )
  closingDate: string;

  @IsInt({ message: 'El número de plazas debe ser un número entero' })
  @Min(1, { message: 'Debe haber al menos una plaza' })
  @Max(1000, { message: 'El número de plazas debe ser como máximo 1000' })
  vacancies: number;

  @IsArray({ message: 'Agrega al menos una habilidad' })
  @ArrayMinSize(1, { message: 'Agrega al menos una habilidad' })
  @ArrayMaxSize(30, { message: 'Agrega hasta 30 habilidades' })
  @ValidateNested({ each: true, message: 'La habilidad no es válida' })
  @Type(() => JobOfferSkillDto)
  skills: JobOfferSkillDto[];
}
