import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { AuditModule } from '../audit/audit.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { Role } from '../users/entities/role.entity.js';
import { User } from '../users/entities/user.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { VerificationCode } from './entities/verification-code.entity.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, ApplicantProfile, VerificationCode]),
    AuditModule,
    NotificationsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          algorithm: 'HS256',
          expiresIn: config.getOrThrow<any>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
