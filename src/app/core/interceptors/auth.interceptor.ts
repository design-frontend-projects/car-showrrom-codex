import { HttpInterceptorFn } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const token = isPlatformBrowser(platformId) ? localStorage.getItem(environment.auth.tokenStorageKey) : null;
  const authorizedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: { status?: number }) => {
      if (error.status === 401 && isPlatformBrowser(platformId)) {
        void router.navigateByUrl(environment.auth.unauthorizedRedirect);
      }

      return throwError(() => error);
    })
  );
};
