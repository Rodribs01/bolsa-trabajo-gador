import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
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
import { AdminCatalogsService } from './admin-catalogs.service.js';
import { CreateCatalogDto } from './dto/create-catalog.dto.js';
import { ListCatalogsDto } from './dto/list-catalogs.dto.js';
import { SaveSkillDto } from './dto/save-skill.dto.js';
import { UpdateCatalogDto } from './dto/update-catalog.dto.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { SettingsService } from './settings.service.js';

@ApiTags('Administración de catálogos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SUPERADMIN)
@Controller('admin')
export class AdminCatalogsController {
  constructor(
    private readonly adminCatalogsService: AdminCatalogsService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('catalogs')
  findCatalogs(@Query() dto: ListCatalogsDto) {
    return this.adminCatalogsService.findCatalogs(dto.type);
  }

  @Post('catalogs')
  createCatalog(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateCatalogDto,
    @Ip() ip: string,
  ) {
    return this.adminCatalogsService.createCatalog(request.user.id, dto, ip);
  }

  @Put('catalogs/:id')
  updateCatalog(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCatalogDto,
    @Ip() ip: string,
  ) {
    return this.adminCatalogsService.updateCatalog(
      request.user.id,
      id,
      dto,
      ip,
    );
  }

  @Get('skills')
  findSkills() {
    return this.adminCatalogsService.findSkills();
  }

  @Post('skills')
  createSkill(
    @Req() request: AuthenticatedRequest,
    @Body() dto: SaveSkillDto,
    @Ip() ip: string,
  ) {
    return this.adminCatalogsService.createSkill(request.user.id, dto, ip);
  }

  @Put('skills/:id')
  updateSkill(
    @Req() request: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveSkillDto,
    @Ip() ip: string,
  ) {
    return this.adminCatalogsService.updateSkill(request.user.id, id, dto, ip);
  }

  @Get('settings')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put('settings')
  updateSettings(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateSettingsDto,
    @Ip() ip: string,
  ) {
    return this.settingsService.updateSettings(request.user.id, dto, ip);
  }
}
