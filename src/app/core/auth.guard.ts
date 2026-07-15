import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PermissionSection } from './models/auth.models';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isAdmin() ? true : router.createUrlTree(['/dashboard']);
};

/**
 * Blocks a non-admin without the given section permission, redirecting to the dashboard.
 * Admins always pass.
 */
export const permissionGuard = (
  section: PermissionSection,
  action: 'view' | 'upload',
): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const allowed = action === 'upload' ? auth.canUpload(section) : auth.canView(section);
    return allowed ? true : router.createUrlTree(['/dashboard']);
  };
};
