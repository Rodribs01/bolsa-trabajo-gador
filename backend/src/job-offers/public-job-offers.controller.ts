import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchJobOffersDto } from './dto/search-job-offers.dto.js';
import { PublicJobOffersService } from './public-job-offers.service.js';

@ApiTags('Ofertas públicas')
@Controller('job-offers')
export class PublicJobOffersController {
  constructor(
    private readonly publicJobOffersService: PublicJobOffersService,
  ) {}

  @Get()
  search(@Query() dto: SearchJobOffersDto) {
    return this.publicJobOffersService.search(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.publicJobOffersService.findOne(id);
  }
}
