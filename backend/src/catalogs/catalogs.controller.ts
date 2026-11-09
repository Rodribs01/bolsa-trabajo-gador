import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CatalogsService } from './catalogs.service.js';
import { ListCatalogsDto } from './dto/list-catalogs.dto.js';

@ApiTags('Catálogos')
@Controller()
export class CatalogsController {
  constructor(private readonly catalogsService: CatalogsService) {}

  @Get('catalogs')
  findCatalogs(@Query() dto: ListCatalogsDto) {
    return this.catalogsService.findCatalogs(dto);
  }

  @Get('skills')
  findSkills() {
    return this.catalogsService.findSkills();
  }
}
