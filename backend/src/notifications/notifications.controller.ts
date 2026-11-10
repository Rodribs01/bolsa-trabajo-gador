import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface.js';
import { NotificationsService } from './notifications.service.js';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(@Req() request: AuthenticatedRequest, @Query() dto: PaginationDto) {
    return this.notificationsService.findMine(request.user.id, dto);
  }

  @Patch('read-all')
  markAllAsRead(@Req() request: AuthenticatedRequest) {
    return this.notificationsService.markAllAsRead(request.user.id);
  }

  @Patch(':id/read')
  markAsRead(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.notificationsService.markAsRead(request.user.id, id);
  }
}
