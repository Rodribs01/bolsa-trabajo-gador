import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CompanyStatus } from '../../common/enums/company-status.enum.js';

export class ListCompaniesDto extends PaginationDto {
  @IsOptional()
  @IsEnum(CompanyStatus, { message: 'El estado no es válido' })
  status?: CompanyStatus;
}
