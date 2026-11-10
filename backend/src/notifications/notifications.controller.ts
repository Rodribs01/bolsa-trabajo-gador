import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationDto } from '../common/dto/pagination.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface.js';
import { PushSubscriptionDto } from './dto/push-subscription.dto.js';
import { RemovePushSubscriptionDto } from './dto/remove-push-subscription.dto.js';
import { NotificationsService } from './notifications.service.js';
import { PushService } from './push.service.js';

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushService: PushService,
  ) {}

  @Get()
  findMine(@Req() request: AuthenticatedRequest, @Query() dto: PaginationDto) {
    return this.notificationsService.findMine(request.user.id, dto);
  }

  @Get('push-key')
  getPushKey() {
    return this.pushService.getPublicKey();
  }

  @Post('push-subscription')
  subscribe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: PushSubscriptionDto,
  ) {
    return this.pushService.saveSubscription(request.user.id, dto);
  }

  @Delete('push-subscription')
  unsubscribe(
    @Req() request: AuthenticatedRequest,
    @Body() dto: RemovePushSubscriptionDto,
  ) {
    return this.pushService.removeSubscription(request.user.id, dto.endpoint);
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
