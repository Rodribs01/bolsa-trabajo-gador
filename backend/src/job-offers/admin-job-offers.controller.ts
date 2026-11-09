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
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { RoleName } from '../common/enums/role-name.enum.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface.js';
import { ReturnJobOfferDto } from './dto/return-job-offer.dto.js';
import { JobOffersService } from './job-offers.service.js';

@ApiTags('Revisión de ofertas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPERADMIN)
@Controller('admin/job-offers')
export class AdminJobOffersController {
  constructor(private readonly jobOffersService: JobOffersService) {}

  @Get('pending')
  findPending(@Query() dto: PaginationDto) {
    return this.jobOffersService.findPendingForAdmin(dto);
  }

  @Patch(':id/approve')
  approve(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.jobOffersService.approve(request.user.id, id, ip);
  }

  @Patch(':id/return')
  returnToDraft(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReturnJobOfferDto,
    @Ip() ip: string,
  ) {
    return this.jobOffersService.returnToDraft(
      request.user.id,
      id,
      dto.observation,
      ip,
    );
  }
}
