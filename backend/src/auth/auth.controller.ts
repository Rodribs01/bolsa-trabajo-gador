import { Body, Controller, HttpCode, Ip, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { RegisterApplicantDto } from './dto/register-applicant.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
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
}
