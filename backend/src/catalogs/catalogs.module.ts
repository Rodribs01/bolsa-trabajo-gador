import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogsController } from './catalogs.controller.js';
import { CatalogsService } from './catalogs.service.js';
import { Catalog } from './entities/catalog.entity.js';
import { Skill } from './entities/skill.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Catalog, Skill])],
  controllers: [CatalogsController],
  providers: [CatalogsService],
})
export class CatalogsModule {}
