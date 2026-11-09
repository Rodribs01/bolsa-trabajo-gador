import { IsIn, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';

// Una postulación retirada ya no es visible para la empresa
const VISIBLE_STATUSES = [
  ApplicationStatus.APPLIED,
  ApplicationStatus.SEEN,
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.FINALIST,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

export class ListOfferApplicationsDto extends PaginationDto {
  @IsOptional()
  @IsIn(VISIBLE_STATUSES, { message: 'El estado no es válido' })
  status?: ApplicationStatus;
}
