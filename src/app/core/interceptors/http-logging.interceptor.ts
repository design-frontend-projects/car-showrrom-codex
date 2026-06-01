import { HttpInterceptorFn } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export const httpLoggingInterceptor: HttpInterceptorFn = (request, next) => {
  if (!environment.logging.http) {
    return next(request);
  }

  const startedAt = performance.now();

  return next(request).pipe(
    tap({
      next: (event) => {
        if ('status' in event) {
          console.info('[http]', request.method, request.urlWithParams, event.status, `${elapsed(startedAt)}ms`);
        }
      },
      error: (error) => {
        console.warn('[http:error]', request.method, request.urlWithParams, error?.status ?? 'unknown', `${elapsed(startedAt)}ms`);
      }
    })
  );
};

function elapsed(startedAt: number): number {
  return Math.round(performance.now() - startedAt);
}
