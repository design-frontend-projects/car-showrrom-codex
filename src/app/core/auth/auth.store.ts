import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { TenantContextService } from '../rbac/tenant-context.service';
import { AuthApiService } from './auth-api.service';
import {
  AuthResponse,
  AuthSession,
  AuthState,
  BackupCodesResponse,
  LoginRequest,
  RegisterRequest,
  ResetCompleteRequest,
  ResetRequest,
  ResetVerifyRequest,
  TwoFactorDisableRequest,
  TwoFactorEnableRequest,
  TwoFactorSetupResponse,
  TwoFactorVerifyRequest,
} from './auth.models';

const initialAuthState: AuthState = {
  status: 'anonymous',
  session: null,
  challenge: null,
  error: null,
  fieldErrors: {},
  csrfToken: null,
};

export const AuthSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialAuthState),
  withComputed(({ session, status, challenge }) => ({
    user: computed(() => session()?.user ?? null),
    isAuthenticated: computed(() => status() === 'authenticated'),
    requiresTwoFactor: computed(() => status() === 'twoFactorRequired' && challenge() !== null),
  })),
  withMethods((store, api = inject(AuthApiService), tenantContext = inject(TenantContextService)) => ({
    async loadSession(): Promise<void> {
      patchState(store, { status: 'pending', error: null, fieldErrors: {} });

      try {
        applyAuthResponse(store, await firstValueFrom(api.session()), tenantContext);
      } catch (error) {
        patchState(store, { ...initialAuthState, error: describeAuthError(error) });
        tenantContext.clearSelectedTenantId();
      }
    },

    async ensureCsrf(): Promise<string | null> {
      if (store.csrfToken()) {
        return store.csrfToken();
      }

      try {
        const response = await firstValueFrom(api.csrf());
        patchState(store, { csrfToken: response.csrfToken });
        return response.csrfToken;
      } catch {
        return null;
      }
    },

    async login(request: LoginRequest): Promise<void> {
      patchState(store, { status: 'pending', error: null, fieldErrors: {} });

      try {
        applyAuthResponse(store, await firstValueFrom(api.login(request)), tenantContext);
      } catch (error) {
        applyAuthError(store, error);
      }
    },

    async register(request: RegisterRequest): Promise<void> {
      patchState(store, { status: 'pending', error: null, fieldErrors: {} });

      try {
        applySession(store, await firstValueFrom(api.register(request)), tenantContext);
      } catch (error) {
        applyAuthError(store, error);
      }
    },

    async refresh(): Promise<void> {
      try {
        applySession(store, await firstValueFrom(api.refresh()), tenantContext);
      } catch (error) {
        patchState(store, { ...initialAuthState, error: describeAuthError(error) });
        tenantContext.clearSelectedTenantId();
      }
    },

    async verifyTwoFactor(request: TwoFactorVerifyRequest): Promise<AuthSession | BackupCodesResponse | null> {
      patchState(store, { status: 'pending', error: null, fieldErrors: {} });

      try {
        const response = await firstValueFrom(api.verifyTwoFactor(request));

        if ('status' in response && response.status === 'authenticated') {
          applySession(store, response, tenantContext);
        } else {
          patchState(store, { status: store.session() ? 'authenticated' : 'anonymous' });
        }

        return response;
      } catch (error) {
        applyAuthError(store, error, 'twoFactorRequired');
        return null;
      }
    },

    async startTwoFactorSetup(request: TwoFactorEnableRequest = {}): Promise<TwoFactorSetupResponse | null> {
      try {
        return await firstValueFrom(api.enableTwoFactor(request));
      } catch (error) {
        applyAuthError(store, error);
        return null;
      }
    },

    async disableTwoFactor(request: TwoFactorDisableRequest): Promise<boolean> {
      try {
        await firstValueFrom(api.disableTwoFactor(request));
        applyAuthResponse(store, await firstValueFrom(api.session()), tenantContext);
        return true;
      } catch (error) {
        applyAuthError(store, error);
        return false;
      }
    },

    async regenerateBackupCodes(request: TwoFactorDisableRequest): Promise<BackupCodesResponse | null> {
      try {
        return await firstValueFrom(api.regenerateBackupCodes(request));
      } catch (error) {
        applyAuthError(store, error);
        return null;
      }
    },

    resetRequest(request: ResetRequest): Promise<{ ok: true; demoOtp?: string }> {
      return firstValueFrom(api.resetRequest(request));
    },

    resetVerify(request: ResetVerifyRequest): Promise<{ resetToken: string; expiresAt: string }> {
      return firstValueFrom(api.resetVerify(request));
    },

    resetComplete(request: ResetCompleteRequest): Promise<{ ok: true }> {
      return firstValueFrom(api.resetComplete(request));
    },

    async logoutLocal(): Promise<void> {
      try {
        await firstValueFrom(api.logout());
      } finally {
        patchState(store, initialAuthState);
        tenantContext.clearSelectedTenantId();
      }
    },

    async logoutGlobal(): Promise<void> {
      try {
        await firstValueFrom(api.logoutAll());
      } finally {
        patchState(store, initialAuthState);
        tenantContext.clearSelectedTenantId();
      }
    },

    signOut(): void {
      patchState(store, initialAuthState);
      tenantContext.clearSelectedTenantId();
    },
  })),
);

function applyAuthResponse(store: WritableAuthStore, response: AuthResponse, tenantContext: TenantContextService): void {
  if (response.status === 'authenticated') {
    applySession(store, response, tenantContext);
    return;
  }

  if (response.status === 'twoFactorRequired') {
    patchState(store, {
      status: 'twoFactorRequired',
      session: null,
      challenge: response,
      error: null,
      fieldErrors: {},
    });
    return;
  }

  patchState(store, initialAuthState);
  tenantContext.clearSelectedTenantId();
}

function applySession(store: WritableAuthStore, session: AuthSession, tenantContext: TenantContextService): void {
  patchState(store, {
    status: 'authenticated',
    session,
    challenge: null,
    csrfToken: session.csrfToken ?? store.csrfToken(),
    error: null,
    fieldErrors: {},
  });
  tenantContext.setSelectedTenantId(session.user.tenantId);
}

function applyAuthError(store: WritableAuthStore, error: unknown, fallbackStatus: AuthState['status'] = 'failed'): void {
  patchState(store, {
    status: fallbackStatus,
    error: describeAuthError(error),
    fieldErrors: readFieldErrors(error),
  });
}

function describeAuthError(error: unknown): string {
  if (isHttpError(error)) {
    return typeof error.error?.code === 'string' ? error.error.code : 'auth.error.requestFailed';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'auth.error.requestFailed';
}

function readFieldErrors(error: unknown): Record<string, string> {
  if (!isHttpError(error) || !isRecord(error.error?.fieldErrors)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(error.error.fieldErrors).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
  );
}

function isHttpError(error: unknown): error is { error?: { code?: unknown; fieldErrors?: unknown } } {
  return isRecord(error);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// NgRx Signal Store produces an intersection type that is intentionally internal.
// Keep this local alias narrow enough for helper functions without exporting it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WritableAuthStore = any;
