import {
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { ApplicationsService } from './applications.service.js';

@ApiTags('Postulaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.APPLICANT)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('me')
  findMine(@Req() request: AuthenticatedRequest, @Query() dto: PaginationDto) {
    return this.applicationsService.findMine(request.user.id, dto);
  }

  @Post(':offerId')
  apply(
    @Req() request: AuthenticatedRequest,
    @Param('offerId', ParseIntPipe) offerId: number,
    @Ip() ip: string,
  ) {
    return this.applicationsService.apply(request.user.id, offerId, ip);
  }

  @Patch(':id/withdraw')
  withdraw(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Ip() ip: string,
  ) {
    return this.applicationsService.withdraw(request.user.id, id, ip);
  }
}
