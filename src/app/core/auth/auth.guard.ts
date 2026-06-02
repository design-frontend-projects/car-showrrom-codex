import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from './auth.facade';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  if (auth.requiresTwoFactor()) {
    return router.parseUrl('/client/sign-in?step=2fa');
  }

  return router.parseUrl(environment.auth.unauthorizedRedirect);
};
