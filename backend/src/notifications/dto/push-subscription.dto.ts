import { IsString, IsUrl, Length, Matches, MaxLength } from 'class-validator';

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
  @Matches(/^[A-Za-z0-9_-]+=*$/, {
    message: 'La clave de la suscripción no es válida',
  })
  @Length(80, 100, { message: 'La clave de la suscripción no es válida' })
  p256dh: string;

  @IsString({ message: 'La clave de la suscripción no es válida' })
  @Matches(/^[A-Za-z0-9_-]+=*$/, {
    message: 'La clave de la suscripción no es válida',
  })
  @Length(16, 30, { message: 'La clave de la suscripción no es válida' })
  auth: string;
}
