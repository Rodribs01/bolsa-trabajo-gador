import {
  Body,
  Controller,
  Get,
  HttpCode,
  Ip,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface.js';
import { AuthService } from './auth.service.js';
import { ChangeEmailDto } from './dto/change-email.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterApplicantDto } from './dto/register-applicant.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register/applicant')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  registerApplicant(@Body() dto: RegisterApplicantDto, @Ip() ip: string) {
    return this.authService.registerApplicant(dto, ip);
  }

  @Post('verify-otp')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  verifyOtp(@Body() dto: VerifyOtpDto, @Ip() ip: string) {
    return this.authService.verifyOtp(dto, ip);
  }

  @Post('resend-otp')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Patch('change-email')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  changeEmail(@Body() dto: ChangeEmailDto, @Ip() ip: string) {
    return this.authService.changeEmail(dto, ip);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.authService.login(dto, ip);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto, @Ip() ip: string) {
    return this.authService.resetPassword(dto, ip);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.authService.changePassword(request.user.id, dto, ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getCurrentUser(@Req() request: AuthenticatedRequest) {
    return this.authService.getCurrentUser(request.user.id);
  }
}
