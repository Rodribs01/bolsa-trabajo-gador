import { IsInt, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsInt({ message: 'El límite de ofertas activas debe ser un número entero' })
  @Min(1, { message: 'El límite de ofertas activas debe ser al menos 1' })
  @Max(50, { message: 'El límite de ofertas activas debe ser como máximo 50' })
  activeOffersLimit: number;
}
