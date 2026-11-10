import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { CatalogType } from '../../common/enums/catalog-type.enum.js';

export class CreateCatalogDto {
  @IsEnum(CatalogType, { message: 'El tipo de catálogo no es válido' })
  type: CatalogType;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El nombre es obligatorio' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  name: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El departamento no es válido' })
  @Min(1, { message: 'El departamento no es válido' })
  parentId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El orden debe ser un número entero' })
  @Min(0, { message: 'El orden no puede ser negativo' })
  @Max(1000, { message: 'El orden debe ser como máximo 1000' })
  order?: number;
}
