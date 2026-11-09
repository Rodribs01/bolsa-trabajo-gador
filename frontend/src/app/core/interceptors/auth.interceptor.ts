import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  if (!token) {
    return next(request);
  }

  const authRequest = request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const isCredentialCheck =
        request.url.endsWith('/auth/login') || request.url.endsWith('/auth/change-email');
      if (error.status === 401 && !isCredentialCheck) {
        authService.clearSession();
        router.navigate(['/login'], {
          state: { message: 'Tu sesión terminó. Vuelve a iniciar sesión.' },
        });
      }
      return throwError(() => error);
    }),
  );
};
