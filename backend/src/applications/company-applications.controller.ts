import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface.js';
import { CompanyApplicationsService } from './company-applications.service.js';
import { ListOfferApplicationsDto } from './dto/list-offer-applications.dto.js';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto.js';

@ApiTags('Postulantes de la empresa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.COMPANY)
@Controller('company')
export class CompanyApplicationsController {
  constructor(
    private readonly companyApplicationsService: CompanyApplicationsService,
  ) {}

  @Get('job-offers/:id/applications')
  findByOffer(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Query() dto: ListOfferApplicationsDto,
  ) {
    return this.companyApplicationsService.findByOffer(
      request.user.id,
      id,
      dto,
    );
  }

  @Get('applications/:id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.companyApplicationsService.findOne(request.user.id, id, ip);
  }

  @Get('applications/:id/cv')
  getCv(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.companyApplicationsService.getCv(request.user.id, id, ip);
  }

  @Patch('applications/:id/status')
  updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateApplicationStatusDto,
    @Ip() ip: string,
  ) {
    return this.companyApplicationsService.updateStatus(
      request.user.id,
      id,
      dto,
      ip,
    );
  }
}
