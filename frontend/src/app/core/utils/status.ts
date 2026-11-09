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
