import { IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class PushSubscriptionDto {
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    { message: 'La dirección de la suscripción no es válida' },
  )
  @MaxLength(500, {
    message: 'La dirección de la suscripción es demasiado larga',
  })
  endpoint: string;

  @IsString({ message: 'La clave de la suscripción no es válida' })
  @Length(20, 255, { message: 'La clave de la suscripción no es válida' })
  p256dh: string;

  @IsString({ message: 'La clave de la suscripción no es válida' })
  @Length(8, 255, { message: 'La clave de la suscripción no es válida' })
  auth: string;
}
