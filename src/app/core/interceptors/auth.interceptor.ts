import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../rbac/tenant-context.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const tenantContext = inject(TenantContextService);
  const tenantId = tenantContext.selectedTenantId();
  const headers: Record<string, string> = {};

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  if (isPlatformBrowser(platformId) && MUTATING_METHODS.has(request.method.toUpperCase())) {
    const csrfToken = readCookie(environment.auth.csrfCookieName);

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }

  const authRequest =
    Object.keys(headers).length > 0 ? request.clone({ setHeaders: headers, withCredentials: true }) : request.clone({ withCredentials: true });

  return next(authRequest).pipe(
    catchError((error: { status?: number }) => {
      if (error.status === 401 && isPlatformBrowser(platformId)) {
        void router.navigateByUrl(environment.auth.unauthorizedRedirect);
      }

      return throwError(() => error);
    }),
  );
};

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}
