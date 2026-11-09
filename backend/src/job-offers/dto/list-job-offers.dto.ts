import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { JobOfferStatus } from '../../common/enums/job-offer-status.enum.js';

export class ListJobOffersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(JobOfferStatus, { message: 'El estado no es válido' })
  status?: JobOfferStatus;
}
