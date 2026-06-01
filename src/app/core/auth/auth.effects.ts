import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthActions } from './auth.actions';
import { AuthApiService } from './auth-api.service';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AuthApiService);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginRequested),
      exhaustMap(({ request }) =>
        this.api.login(request).pipe(
          map((session) => AuthActions.authenticated({ session })),
          catchError((error: unknown) => of(AuthActions.authFailed({ error: describeAuthError(error) })))
        )
      )
    )
  );

  readonly register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.registerRequested),
      exhaustMap(({ request }) =>
        this.api.register(request).pipe(
          map((session) => AuthActions.authenticated({ session })),
          catchError((error: unknown) => of(AuthActions.authFailed({ error: describeAuthError(error) })))
        )
      )
    )
  );

  readonly persistSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.authenticated),
        tap(({ session }) => {
          if (typeof localStorage === 'undefined') {
            return;
          }

          localStorage.setItem(environment.auth.tokenStorageKey, session.accessToken);
          if (session.refreshToken) {
            localStorage.setItem(environment.auth.refreshTokenStorageKey, session.refreshToken);
          }
        })
      ),
    { dispatch: false }
  );

  readonly clearSession$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.signedOut),
        tap(() => {
          if (typeof localStorage === 'undefined') {
            return;
          }

          localStorage.removeItem(environment.auth.tokenStorageKey);
          localStorage.removeItem(environment.auth.refreshTokenStorageKey);
        })
      ),
    { dispatch: false }
  );
}

function describeAuthError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Authentication request failed.';
}
