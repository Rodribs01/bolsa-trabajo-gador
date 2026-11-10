import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { AuditAction } from '../../common/enums/audit-action.enum.js';

export class ListAuditDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha desde no es válida' })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha hasta no es válida' })
  to?: string;

  @IsOptional()
  @IsEnum(AuditAction, { message: 'La acción no es válida' })
  action?: AuditAction;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La tabla debe ser texto' })
  @MaxLength(60, { message: 'La tabla debe tener hasta 60 caracteres' })
  tableName?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El usuario debe ser texto' })
  @MaxLength(100, { message: 'El usuario debe tener hasta 100 caracteres' })
  user?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número' })
  @Min(1, { message: 'La página debe ser mayor que 0' })
  @Max(100000, { message: 'La página es demasiado alta' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número' })
  @Min(1, { message: 'El límite debe ser mayor que 0' })
  @Max(100, { message: 'El límite debe ser como máximo 100' })
  limit?: number;
}
