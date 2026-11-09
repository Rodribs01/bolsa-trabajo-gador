import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class ReturnJobOfferDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La observación es obligatoria' })
  @Length(5, 1000, {
    message: 'La observación debe tener entre 5 y 1000 caracteres',
  })
  observation: string;
}
