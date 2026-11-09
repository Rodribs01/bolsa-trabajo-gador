import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
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
import { ListJobOffersDto } from './dto/list-job-offers.dto.js';
import { SaveJobOfferDto } from './dto/save-job-offer.dto.js';
import { JobOffersService } from './job-offers.service.js';

@ApiTags('Ofertas de la empresa')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.COMPANY)
@Controller('company/job-offers')
export class CompanyJobOffersController {
  constructor(private readonly jobOffersService: JobOffersService) {}

  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() dto: ListJobOffersDto,
  ) {
    return this.jobOffersService.findCompanyOffers(request.user.id, dto);
  }

  @Get(':id')
  findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.jobOffersService.findCompanyOffer(request.user.id, id);
  }

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SaveJobOfferDto,
    @Ip() ip: string,
  ) {
    return this.jobOffersService.create(request.user.id, dto, ip);
  }

  @Put(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveJobOfferDto,
    @Ip() ip: string,
  ) {
    return this.jobOffersService.update(request.user.id, id, dto, ip);
  }

  @Patch(':id/submit')
  submit(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.jobOffersService.submit(request.user.id, id, ip);
  }

  @Post(':id/duplicate')
  duplicate(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.jobOffersService.duplicate(request.user.id, id, ip);
  }

  @Patch(':id/close')
  close(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.jobOffersService.close(request.user.id, id, ip);
  }

  @Patch(':id/cancel')
  cancel(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.jobOffersService.cancel(request.user.id, id, ip);
  }
}
