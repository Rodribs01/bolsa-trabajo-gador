import {
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
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
import { FavoritesService } from './favorites.service.js';

@ApiTags('Favoritos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.APPLICANT)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  findMine(@Req() request: AuthenticatedRequest, @Query() dto: PaginationDto) {
    return this.favoritesService.findMine(request.user.id, dto);
  }

  @Post(':offerId')
  add(
    @Req() request: AuthenticatedRequest,
    @Param('offerId', ParseIntPipe) offerId: number,
    @Ip() ip: string,
  ) {
    return this.favoritesService.add(request.user.id, offerId, ip);
  }

  @Delete(':offerId')
  remove(
    @Req() request: AuthenticatedRequest,
    @Param('offerId', ParseIntPipe) offerId: number,
    @Ip() ip: string,
  ) {
    return this.favoritesService.remove(request.user.id, offerId, ip);
  }
}
