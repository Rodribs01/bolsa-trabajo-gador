import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class RejectCompanyDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El motivo de rechazo es obligatorio' })
  @Length(5, 1000, {
    message: 'El motivo de rechazo debe tener entre 5 y 1000 caracteres',
  })
  reason: string;
}
