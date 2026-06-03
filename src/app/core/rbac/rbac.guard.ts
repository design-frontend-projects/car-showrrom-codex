import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../auth/auth.facade';

const ADMIN_ROLES = new Set(['admin', 'system-owner']);

export function roleGuard(requiredRoles: readonly string[]): CanActivateFn {
  return () => resolveGuard((auth) => requiredRoles.some((role) => auth.user()?.roles.includes(role)));
}

export function permissionGuard(requiredPermission: string): CanActivateFn {
  return () =>
    resolveGuard((auth) => {
      const user = auth.user();

      return Boolean(
        user?.permissions.includes(requiredPermission) ||
          user?.roles.some((role) => ADMIN_ROLES.has(role)),
      );
    });
}

export const rbacAdminGuard = permissionGuard('showroom.admin.manage');

async function resolveGuard(allows: (auth: AuthFacade) => boolean) {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (allows(auth)) {
    return true;
  }

  if (isPlatformServer(platformId)) {
    return true;
  }

  await auth.loadSession();

  if (auth.isAuthenticated() && allows(auth)) {
    return true;
  }

  if (!auth.isAuthenticated()) {
    return router.parseUrl('/client/sign-in');
  }

  return router.parseUrl('/admin/access-denied');
}
