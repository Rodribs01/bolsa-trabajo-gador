import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ReportQueryDto {
  @IsIn(['xlsx', 'pdf'], { message: 'El formato debe ser xlsx o pdf' })
  format: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha desde no es válida' })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha hasta no es válida' })
  to?: string;

  @IsOptional()
  @IsString({ message: 'El estado no es válido' })
  @MaxLength(40, { message: 'El estado no es válido' })
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El municipio no es válido' })
  municipalityId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El rubro no es válido' })
  sectorId?: number;
}
