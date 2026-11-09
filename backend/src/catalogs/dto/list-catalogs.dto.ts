import { IsEnum } from 'class-validator';
import { CatalogType } from '../../common/enums/catalog-type.enum.js';

export class ListCatalogsDto {
  @IsEnum(CatalogType, { message: 'El tipo de catálogo no es válido' })
  type: CatalogType;
}
