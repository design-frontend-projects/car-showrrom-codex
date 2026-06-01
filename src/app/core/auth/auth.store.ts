import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthApiService } from './auth-api.service';
import { AuthSession, AuthState, LoginRequest, RegisterRequest } from './auth.models';

const initialAuthState: AuthState = {
  status: 'anonymous',
  session: null,
  error: null
};

export const AuthSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialAuthState),
  withComputed(({ session, status }) => ({
    user: computed(() => session()?.user ?? null),
    isAuthenticated: computed(() => status() === 'authenticated')
  })),
  withMethods((store, api = inject(AuthApiService)) => ({
    async login(request: LoginRequest): Promise<void> {
      patchState(store, { status: 'pending', error: null });

      try {
        const session = await firstValueFrom(api.login(request));
        persistSession(session);
        patchState(store, { status: 'authenticated', session, error: null });
      } catch (error) {
        patchState(store, { status: 'failed', error: describeAuthError(error) });
      }
    },

    async register(request: RegisterRequest): Promise<void> {
      patchState(store, { status: 'pending', error: null });

      try {
        const session = await firstValueFrom(api.register(request));
        persistSession(session);
        patchState(store, { status: 'authenticated', session, error: null });
      } catch (error) {
        patchState(store, { status: 'failed', error: describeAuthError(error) });
      }
    },

    signOut(): void {
      clearSession();
      patchState(store, initialAuthState);
    }
  }))
);

function persistSession(session: AuthSession): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(environment.auth.tokenStorageKey, session.accessToken);
  if (session.refreshToken) {
    localStorage.setItem(environment.auth.refreshTokenStorageKey, session.refreshToken);
  }
}

function clearSession(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(environment.auth.tokenStorageKey);
  localStorage.removeItem(environment.auth.refreshTokenStorageKey);
}

function describeAuthError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Authentication request failed.';
}
