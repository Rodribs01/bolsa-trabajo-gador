import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface.js';
import { CompaniesService } from './companies.service.js';
import { ListCompaniesDto } from './dto/list-companies.dto.js';
import { RegisterCompanyDto } from './dto/register-company.dto.js';
import { RejectCompanyDto } from './dto/reject-company.dto.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

@ApiTags('Empresas')
@Controller()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post('auth/register/company')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'supportDocument', maxCount: 1 },
      ],
      { limits: { fileSize: MAX_FILE_BYTES } },
    ),
  )
  register(
    @Body() dto: RegisterCompanyDto,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      supportDocument?: Express.Multer.File[];
    },
    @Ip() ip: string,
  ) {
    const logo = files?.logo?.[0];
    const document = files?.supportDocument?.[0];
    return this.companiesService.register(dto, logo, document, ip);
  }

  @Get('companies/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.COMPANY)
  @ApiBearerAuth()
  getMyCompany(@Req() request: AuthenticatedRequest) {
    return this.companiesService.findByUser(request.user.id);
  }

  @Get('admin/companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPERADMIN)
  @ApiBearerAuth()
  findAll(@Query() dto: ListCompaniesDto) {
    return this.companiesService.findAll(dto);
  }

  @Get('admin/companies/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPERADMIN)
  @ApiBearerAuth()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Get('admin/companies/:id/document')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPERADMIN)
  @ApiBearerAuth()
  getDocument(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.getDocument(id);
  }

  @Patch('admin/companies/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPERADMIN)
  @ApiBearerAuth()
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.companiesService.approve(id, request.user.id, ip);
  }

  @Patch('admin/companies/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPERADMIN)
  @ApiBearerAuth()
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectCompanyDto,
    @Req() request: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.companiesService.reject(id, dto.reason, request.user.id, ip);
  }

  @Patch('admin/companies/:id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SUPERADMIN)
  @ApiBearerAuth()
  suspend(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
    @Ip() ip: string,
  ) {
    return this.companiesService.suspend(id, request.user.id, ip);
  }
}
