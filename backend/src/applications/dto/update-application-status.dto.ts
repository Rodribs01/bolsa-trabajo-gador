import { IsIn } from 'class-validator';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';

// VISTO se asigna solo al abrir el perfil o el CV y RETIRADO solo lo decide el postulante
const COMPANY_STATUSES = [
  ApplicationStatus.SHORTLISTED,
  ApplicationStatus.INTERVIEW,
  ApplicationStatus.FINALIST,
  ApplicationStatus.HIRED,
  ApplicationStatus.REJECTED,
];

export class UpdateApplicationStatusDto {
  @IsIn(COMPANY_STATUSES, { message: 'El estado no es válido' })
  status: ApplicationStatus;
}
