import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class SaveSkillDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El nombre es obligatorio' })
  @Length(2, 80, { message: 'El nombre debe tener entre 2 y 80 caracteres' })
  name: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La categoría debe ser texto' })
  @Length(0, 60, { message: 'La categoría debe tener hasta 60 caracteres' })
  category?: string;

  @IsOptional()
  @IsBoolean({ message: 'Indica si la habilidad está activa' })
  active?: boolean;
}
