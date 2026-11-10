export const APPLICATION_STEPS = [
  'POSTULADO',
  'VISTO',
  'PRESELECCIONADO',
  'ENTREVISTA',
  'FINALISTA',
  'CONTRATADO',
];

export const ALL_APPLICATION_STATUSES = [...APPLICATION_STEPS, 'RECHAZADO', 'RETIRADO'];

const FINISHED_STATUSES = ['CONTRATADO', 'RECHAZADO', 'RETIRADO'];

export function applicationStatusClass(status: string): string {
  return 'st-' + status.toLowerCase();
}

export function statusLabel(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

// Cada estado solo avanza al siguiente paso o a RECHAZADO, igual que en el backend
export function nextApplicationStatus(status: string): string | null {
  if (status === 'VISTO') {
    return 'PRESELECCIONADO';
  }
  if (status === 'PRESELECCIONADO') {
    return 'ENTREVISTA';
  }
  if (status === 'ENTREVISTA') {
    return 'FINALISTA';
  }
  if (status === 'FINALISTA') {
    return 'CONTRATADO';
  }
  return null;
}

export function offerStatusClass(status: string): string {
  if (status === 'BORRADOR') {
    return 'st-borrador';
  }
  if (status === 'EN_REVISION_GADOR') {
    return 'st-revision';
  }
  if (status === 'PUBLICADA') {
    return 'st-publicada';
  }
  if (status === 'EN_PROCESO_SELECCION') {
    return 'st-seleccion';
  }
  if (status === 'CERRADA') {
    return 'st-cerrada';
  }
  return 'st-anulada';
}

export function offerStatusLabel(status: string): string {
  if (status === 'EN_REVISION_GADOR') {
    return 'En revisión';
  }
  if (status === 'EN_PROCESO_SELECCION') {
    return 'En selección';
  }
  return statusLabel(status);
}

export function companyStatusClass(status: string): string {
  if (status === 'PENDIENTE_VALIDACION') {
    return 'st-pendiente';
  }
  if (status === 'APROBADA') {
    return 'st-aprobada';
  }
  if (status === 'RECHAZADA') {
    return 'st-rechazada';
  }
  return 'st-suspendida';
}

export function companyStatusLabel(status: string): string {
  if (status === 'PENDIENTE_VALIDACION') {
    return 'Pendiente de validación';
  }
  return statusLabel(status);
}

export function matchTextColor(match: number): string {
  if (match >= 75) {
    return 'text-success';
  }
  if (match >= 50) {
    return 'text-warning-emphasis';
  }
  return 'text-secondary';
}

export function isFinished(status: string): boolean {
  return FINISHED_STATUSES.includes(status);
}

export function levelLabel(level: string): string {
  if (level === 'BASICO') {
    return 'Básico';
  }
  if (level === 'INTERMEDIO') {
    return 'Intermedio';
  }
  if (level === 'AVANZADO') {
    return 'Avanzado';
  }
  if (level === 'NATIVO') {
    return 'Nativo';
  }
  return level;
}
