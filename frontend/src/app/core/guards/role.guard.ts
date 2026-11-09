import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const roles: string[] = route.data['roles'];
  if (roles.includes(user.role)) {
    return true;
  }
  return router.createUrlTree([authService.homeForRole(user.role)]);
};
