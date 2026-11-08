import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { RoleName } from '../common/enums/role-name.enum.js';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface.js';
import { User } from '../users/entities/user.entity.js';

interface JwtPayload {
  sub: number;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  // Una cuenta desactivada o con la contraseña cambiada pierde el acceso aunque su token siga vigente
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, active: true },
      relations: { role: true },
    });
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Tu sesión ya no es válida');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role.name as RoleName,
    };
  }
}
