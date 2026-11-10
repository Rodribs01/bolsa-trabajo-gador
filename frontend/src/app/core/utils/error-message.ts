import { HttpErrorResponse } from '@angular/common/http';

export function getErrorMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.';
  }
  if (error.status === 413) {
    return 'El archivo es demasiado grande.';
  }
  if (error.error instanceof Blob) {
    if (error.status === 404) {
      return 'El archivo no está disponible.';
    }
    if (error.status === 403) {
      return 'No tienes permiso para ver este archivo.';
    }
  }

  const message = error.error?.message;
  if (Array.isArray(message)) {
    return message.join('. ');
  }
  if (typeof message === 'string') {
    return message;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
