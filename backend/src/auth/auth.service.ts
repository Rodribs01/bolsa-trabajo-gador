import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt } from 'crypto';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { ApplicantProfile } from '../applicants/entities/applicant-profile.entity.js';
import { AuditService } from '../audit/audit.service.js';
import { AuditAction } from '../common/enums/audit-action.enum.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { VerificationCodeType } from '../common/enums/verification-code-type.enum.js';
import { MailService } from '../notifications/mail.service.js';
import { Role } from '../users/entities/role.entity.js';
import { User } from '../users/entities/user.entity.js';
import { ChangeEmailDto } from './dto/change-email.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterApplicantDto } from './dto/register-applicant.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { VerificationCode } from './entities/verification-code.entity.js';

const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 3;
const RESEND_WAIT_SECONDS = 60;
// El primer código más 3 reenvíos por hora
const OTP_MAX_CODES_PER_HOUR = 4;
const INVALID_CODE_MESSAGE = 'El código es incorrecto o ya venció';
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const INVALID_CREDENTIALS_MESSAGE = 'Correo o contraseña incorrectos';
const RESET_MINUTES = 30;
const RESET_MAX_PER_HOUR = 3;
const INVALID_RESET_MESSAGE = 'El enlace no es válido o ya venció';

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
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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
    if (!user || user.emailVerified) {
      throw new BadRequestException(INVALID_CODE_MESSAGE);
    }

    const record = await this.codeRepository.findOne({
      where: {
        userId: user.id,
        type: VerificationCodeType.EMAIL_OTP,
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
    await this.userRepository.update(user.id, { emailVerified: true });
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.UPDATE,
      tableName: 'usuarios',
      recordId: user.id,
      newData: { correo_verificado: true },
      ip: ip,
    });

    return { message: 'Tu correo fue verificado correctamente' };
  }

  async resendOtp(dto: ResendOtpDto) {
    const genericResponse = {
      message:
        'Si la cuenta está pendiente de verificación, enviamos un código',
    };

    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || user.emailVerified) {
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

  async login(dto: LoginDto, ip: string) {
    const user = await this.verifyCredentials(dto.email, dto.password, ip);

    // El postulante debe verificar su correo antes de entrar por primera vez
    if (user.role.name === RoleName.APPLICANT && !user.emailVerified) {
      throw new ForbiddenException({
        message: 'Debes verificar tu correo antes de ingresar',
        code: 'CORREO_SIN_VERIFICAR',
        email: user.email,
      });
    }

    await this.userRepository.update(user.id, { lastLogin: new Date() });
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.LOGIN,
      tableName: 'usuarios',
      recordId: user.id,
      newData: { resultado: 'EXITOSO' },
      ip: ip,
    });

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    return {
      accessToken: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
      },
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
      relations: { role: true },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role.name,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
    };
  }

  // Permite corregir un correo mal escrito, solo si la cuenta aún no está verificada
  async changeEmail(dto: ChangeEmailDto, ip: string) {
    const user = await this.verifyCredentials(dto.email, dto.password, ip);

    if (user.emailVerified) {
      throw new BadRequestException('Tu correo ya fue verificado');
    }

    await this.checkResendLimits(user.id);

    if (await this.userRepository.existsBy({ email: dto.newEmail })) {
      throw new ConflictException('El correo ya está registrado');
    }

    const previousEmail = user.email;
    await this.userRepository.update(user.id, { email: dto.newEmail });
    user.email = dto.newEmail;

    await this.auditService.log({
      userId: user.id,
      action: AuditAction.UPDATE,
      tableName: 'usuarios',
      recordId: user.id,
      previousData: { email: previousEmail },
      newData: { email: dto.newEmail },
      ip: ip,
    });

    const sent = await this.createAndSendOtp(user);
    if (!sent) {
      throw new ServiceUnavailableException(
        'Actualizamos tu correo, pero no pudimos enviar el código. Solicita uno nuevo.',
      );
    }
    return { message: 'Actualizamos tu correo y enviamos un código nuevo' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const genericResponse = {
      message:
        'Si el correo está registrado, enviamos un enlace para restablecer la contraseña',
    };

    const user = await this.userRepository.findOneBy({ email: dto.email });
    if (!user || !user.active) {
      return genericResponse;
    }
    if (!(await this.canRequestPasswordReset(user.id))) {
      return genericResponse;
    }

    await this.codeRepository.update(
      {
        userId: user.id,
        type: VerificationCodeType.PASSWORD_RESET,
        used: false,
      },
      { used: true },
    );

    const token = randomBytes(32).toString('hex');
    await this.codeRepository.save(
      this.codeRepository.create({
        userId: user.id,
        type: VerificationCodeType.PASSWORD_RESET,
        codeHash: this.hashToken(token),
        expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
      }),
    );

    const frontendUrl = this.config.get<string>('FRONTEND_URL');
    const link = `${frontendUrl}/reset-password?token=${token}`;
    try {
      await this.mailService.send(
        user.email,
        'Restablecer contraseña',
        `<p>Para restablecer tu contraseña de la Bolsa de Trabajo GADOR, abre este enlace:</p><p><a href="${link}">${link}</a></p><p>Vence en ${RESET_MINUTES} minutos y solo se puede usar una vez. Si no lo pediste, ignora este correo.</p>`,
      );
    } catch (error: any) {
      this.logger.error(`No se pudo enviar el enlace: ${error.message}`);
    }

    return genericResponse;
  }

  async resetPassword(dto: ResetPasswordDto, ip: string) {
    const record = await this.codeRepository.findOne({
      where: {
        codeHash: this.hashToken(dto.token),
        type: VerificationCodeType.PASSWORD_RESET,
        used: false,
      },
    });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException(INVALID_RESET_MESSAGE);
    }

    // El enlace es de un solo uso
    const result = await this.codeRepository.update(
      { id: record.id, used: false },
      { used: true },
    );
    if (result.affected !== 1) {
      throw new BadRequestException(INVALID_RESET_MESSAGE);
    }

    // Restablecer la contraseña también quita el bloqueo de la cuenta
    await this.userRepository.update(record.userId, {
      password: await bcrypt.hash(dto.newPassword, 10),
      failedAttempts: 0,
      lockedUntil: null,
    });
    await this.auditService.log({
      userId: record.userId,
      action: AuditAction.UPDATE,
      tableName: 'usuarios',
      recordId: record.userId,
      newData: { contrasena: 'RESTABLECIDA' },
      ip: ip,
    });

    return {
      message: 'Tu contraseña fue restablecida. Ya puedes iniciar sesión.',
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto, ip: string) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: userId },
      select: { id: true, password: true },
    });

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }
    if (dto.newPassword === dto.currentPassword) {
      throw new BadRequestException(
        'La contraseña nueva debe ser distinta de la actual',
      );
    }

    await this.userRepository.update(user.id, {
      password: await bcrypt.hash(dto.newPassword, 10),
    });
    await this.auditService.log({
      userId: user.id,
      action: AuditAction.UPDATE,
      tableName: 'usuarios',
      recordId: user.id,
      newData: { contrasena: 'CAMBIADA' },
      ip: ip,
    });

    return { message: 'Tu contraseña fue cambiada correctamente' };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async canRequestPasswordReset(userId: number): Promise<boolean> {
    const lastCode = await this.codeRepository.findOne({
      where: { userId: userId, type: VerificationCodeType.PASSWORD_RESET },
      order: { id: 'DESC' },
    });
    if (lastCode) {
      const secondsSinceLast =
        (Date.now() - lastCode.createdAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_WAIT_SECONDS) {
        return false;
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const requestsLastHour = await this.codeRepository.countBy({
      userId: userId,
      type: VerificationCodeType.PASSWORD_RESET,
      createdAt: MoreThan(oneHourAgo),
    });
    return requestsLastHour < RESET_MAX_PER_HOUR;
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

  private async verifyCredentials(
    email: string,
    password: string,
    ip: string,
  ): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email: email })
      .getOne();

    if (!user) {
      await this.auditFailedLogin(null, email, ip);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw this.accountLockedError(user.lockedUntil);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      await this.auditFailedLogin(user.id, email, ip);
      await this.increaseFailedAttempts(user);
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!user.active) {
      throw new ForbiddenException('Tu cuenta está desactivada');
    }

    await this.userRepository.update(user.id, {
      failedAttempts: 0,
      lockedUntil: null,
    });
    return user;
  }

  // Al quinto intento fallido la cuenta se bloquea por 15 minutos
  private async increaseFailedAttempts(user: User): Promise<void> {
    const attempts = user.failedAttempts + 1;

    if (attempts >= MAX_FAILED_LOGINS) {
      const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      await this.userRepository.update(user.id, {
        failedAttempts: 0,
        lockedUntil: lockedUntil,
      });
      throw this.accountLockedError(lockedUntil);
    }

    await this.userRepository.update(user.id, { failedAttempts: attempts });
  }

  private accountLockedError(lockedUntil: Date): HttpException {
    return new HttpException(
      {
        message:
          'Tu cuenta está bloqueada temporalmente debido a varios intentos fallidos. Intenta de nuevo más tarde.',
        code: 'CUENTA_BLOQUEADA',
        lockedUntil: lockedUntil,
      },
      HttpStatus.LOCKED,
    );
  }

  private async auditFailedLogin(
    userId: number | null,
    email: string,
    ip: string,
  ): Promise<void> {
    await this.auditService.log({
      userId: userId,
      action: AuditAction.LOGIN,
      tableName: 'usuarios',
      recordId: userId,
      newData: { resultado: 'FALLIDO', email: email },
      ip: ip,
    });
  }

  private async checkResendLimits(userId: number): Promise<void> {
    const lastCode = await this.codeRepository.findOne({
      where: { userId: userId, type: VerificationCodeType.EMAIL_OTP },
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
      type: VerificationCodeType.EMAIL_OTP,
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
        type: VerificationCodeType.EMAIL_OTP,
        used: false,
      },
      { used: true },
    );

    const code = randomInt(100000, 1000000).toString();
    await this.codeRepository.save(
      this.codeRepository.create({
        userId: user.id,
        type: VerificationCodeType.EMAIL_OTP,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + OTP_MINUTES * 60 * 1000),
      }),
    );

    try {
      await this.mailService.send(
        user.email,
        'Código de verificación',
        `<p>Tu código de verificación de la Bolsa de Trabajo GADOR es <strong>${code}</strong>. Vence en ${OTP_MINUTES} minutos.</p>`,
      );
      return true;
    } catch (error: any) {
      this.logger.error(`No se pudo enviar el código: ${error.message}`);
      return false;
    }
  }
}
