import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { VerificationCodeType } from '../common/enums/verification-code-type.enum.js';
import { SmsService } from '../notifications/sms.service.js';
import { Role } from '../users/entities/role.entity.js';
import { User } from '../users/entities/user.entity.js';
import { RegisterApplicantDto } from './dto/register-applicant.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { VerificationCode } from './entities/verification-code.entity.js';

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 3;
const RESEND_WAIT_SECONDS = 60;
// El primer código más 3 reenvíos por hora
const OTP_MAX_CODES_PER_HOUR = 4;
const INVALID_CODE_MESSAGE = 'El código es incorrecto o ya venció';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(ApplicantProfile)
    private readonly profileRepository: Repository<ApplicantProfile>,
    @InjectRepository(VerificationCode)
    private readonly codeRepository: Repository<VerificationCode>,
    private readonly dataSource: DataSource,
    private readonly auditService: AuditService,
    private readonly smsService: SmsService,
  ) {}

  async registerApplicant(dto: RegisterApplicantDto, ip: string) {
    if (await this.userRepository.existsBy({ email: dto.email })) {
      throw new ConflictException('El correo ya está registrado');
    }
    if (await this.profileRepository.existsBy({ ci: dto.ci })) {
      throw new ConflictException('La cédula de identidad ya está registrada');
    }

    const role = await this.roleRepository.findOneByOrFail({
      name: RoleName.APPLICANT,
    });
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.createApplicant(dto, role.id, passwordHash);

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.CREATE,
      tableName: 'usuarios',
      recordId: user.id,
      newData: { email: user.email, rol: RoleName.APPLICANT },
      ip: ip,
    });

    const sent = await this.createAndSendOtp(user);
    if (!sent) {
      return {
        message:
          'Tu cuenta fue creada, pero no pudimos enviar el código. Solicita uno nuevo.',
        email: user.email,
      };
    }
    return {
      message: 'Te enviamos un código de verificación',
      email: user.email,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, ip: string) {
    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || user.phoneVerified) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const record = await this.codeRepository.findOne({
      where: {
        userId: user.id,
        type: VerificationCodeType.PHONE_OTP,
        used: false,
      },
      order: { id: 'DESC' },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const isValid = await bcrypt.compare(dto.code, record.codeHash);
    if (!isValid) {
      const message = await this.registerFailedAttempt(record);
      throw new BadRequestException(message);
    }

    await this.codeRepository.update(record.id, { used: true });
    await this.userRepository.update(user.id, { phoneVerified: true });
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.UPDATE,
      tableName: 'usuarios',
      recordId: user.id,
      newData: { celular_verificado: true },
      ip: ip,
    });

    return { message: 'Tu celular fue verificado correctamente' };
  }

  async resendOtp(dto: ResendOtpDto) {
    const genericResponse = {
      message:
        'Si la cuenta está pendiente de verificación, enviamos un código',
    };

    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || user.phoneVerified) {
      return genericResponse;
    }

    await this.checkResendLimits(user.id);

    const sent = await this.createAndSendOtp(user);
    if (!sent) {
      throw new ServiceUnavailableException(
        'No pudimos enviar el código. Intenta de nuevo más tarde.',
      );
    }
    return genericResponse;
  }

  private async createApplicant(
    dto: RegisterApplicantDto,
    roleId: number,
    passwordHash: string,
  ): Promise<User> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const user = manager.create(User, {
          roleId: roleId,
          name: `${dto.firstNames} ${dto.lastNames}`,
          email: dto.email,
          phone: dto.phone,
          password: passwordHash,
        });
        await manager.save(user);

        const profile = manager.create(ApplicantProfile, {
          userId: user.id,
          ci: dto.ci,
          ciIssuedIn: dto.ciIssuedIn,
          firstNames: dto.firstNames,
          lastNames: dto.lastNames,
        });
        await manager.save(profile);

        return user;
      });
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException(
          'El correo o la cédula de identidad ya están registrados',
        );
      }
      throw error;
    }
  }

  // Al tercer intento fallido el código deja de servir
  private async registerFailedAttempt(
    record: VerificationCode,
  ): Promise<string> {
    const attempts = record.attempts + 1;
    const remaining = OTP_MAX_ATTEMPTS - attempts;

    await this.codeRepository.update(record.id, {
      attempts: attempts,
      used: remaining === 0,
    });

    if (remaining === 0) {
      return 'Código incorrecto. Agotaste los intentos, solicita un código nuevo.';
    }
    return `Código incorrecto. Intentos restantes: ${remaining}.`;
  }

  private async checkResendLimits(userId: number): Promise<void> {
    const lastCode = await this.codeRepository.findOne({
      where: { userId: userId, type: VerificationCodeType.PHONE_OTP },
      order: { id: 'DESC' },
    });
    if (lastCode) {
      const secondsSinceLast =
        (Date.now() - lastCode.createdAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_WAIT_SECONDS) {
        throw new HttpException(
          'Espera un minuto antes de pedir otro código',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const codesLastHour = await this.codeRepository.countBy({
      userId: userId,
      type: VerificationCodeType.PHONE_OTP,
      createdAt: MoreThan(oneHourAgo),
    });
    if (codesLastHour >= OTP_MAX_CODES_PER_HOUR) {
      throw new HttpException(
        'Alcanzaste el límite de reenvíos. Intenta de nuevo en una hora.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async createAndSendOtp(user: User): Promise<boolean> {
    await this.codeRepository.update(
      {
        userId: user.id,
        type: VerificationCodeType.PHONE_OTP,
        used: false,
      },
      { used: true },
    );

    const code = randomInt(100000, 1000000).toString();
    await this.codeRepository.save(
      this.codeRepository.create({
        userId: user.id,
        type: VerificationCodeType.PHONE_OTP,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000),
      }),
    );

    try {
      await this.smsService.sendOtp(user.phone ?? '', user.email, code);
      return true;
    } catch (error: any) {
      this.logger.error(`No se pudo enviar el código: ${error.message}`);
      return false;
    }
  }
}
