import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from './auth.facade';
import { environment } from '../../../environments/environment';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  return auth.isAuthenticated() ? true : router.parseUrl(environment.auth.unauthorizedRedirect);
};
