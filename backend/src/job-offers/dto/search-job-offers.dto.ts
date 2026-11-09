import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export class SearchJobOffersDto extends PaginationDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La palabra clave debe ser texto' })
  @MaxLength(100, {
    message: 'La palabra clave debe tener hasta 100 caracteres',
  })
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La profesión no es válida' })
  professionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El municipio no es válido' })
  municipalityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La modalidad no es válida' })
  modalityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El salario mínimo debe ser un número' })
  @Min(0, { message: 'El salario mínimo no puede ser negativo' })
  minSalary?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean({ message: 'El filtro de ofertas a tratar no es válido' })
  includeNegotiable?: boolean;

  @IsOptional()
  @IsIn(['recent', 'closing', 'salary'], {
    message: 'El orden no es válido',
  })
  sort?: string;
}
