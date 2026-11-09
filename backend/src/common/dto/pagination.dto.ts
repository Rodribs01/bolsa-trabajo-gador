import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
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
