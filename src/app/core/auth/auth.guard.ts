import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from './auth.facade';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  return resolveAuthGuard(auth, router, platformId);
};

async function resolveAuthGuard(auth: AuthFacade, router: Router, platformId: object) {
  if (auth.isAuthenticated()) {
    return true;
  }

  if (isPlatformServer(platformId)) {
    return true;
  }

  await auth.loadSession();

  if (auth.isAuthenticated()) {
    return true;
  }

  if (auth.requiresTwoFactor()) {
    return router.parseUrl('/client/sign-in?step=2fa');
  }

  return router.parseUrl(environment.auth.unauthorizedRedirect);
}
