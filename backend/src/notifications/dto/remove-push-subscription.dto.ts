import { IsString, MaxLength } from 'class-validator';

export class RemovePushSubscriptionDto {
  @IsString({ message: 'La dirección de la suscripción no es válida' })
  @MaxLength(500, {
    message: 'La dirección de la suscripción es demasiado larga',
  })
  endpoint: string;
}
