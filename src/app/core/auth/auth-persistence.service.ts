import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthSession, PersistedAuthState } from './auth.models';

type AuthStorageMode = 'sessionStorage' | 'localStorage';

const SECRET_KEY_PATTERN = /(password|hash|token|otp|secret|backup|csrf|sessionToken|failedLogin|lockedUntil)/i;

@Injectable({ providedIn: 'root' })
export class AuthPersistenceService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly storageMode = readStorageMode();
  private readonly storageKey = environment.auth.stateStorageKey;

  read(): PersistedAuthState | null {
    const storage = this.storage();

    if (!storage) {
      return null;
    }

    try {
      const raw = storage.getItem(this.storageKey);
      const parsed: unknown = raw ? JSON.parse(raw) : null;

      return isPersistedAuthState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  write(session: AuthSession): void {
    const storage = this.storage();

    if (!storage) {
      return;
    }

    try {
      const sanitized = sanitizeSession(session);
      const persisted: PersistedAuthState = {
        status: 'authenticated',
        session: sanitized,
        roles: sanitized.user.roles,
        persistedAt: new Date().toISOString(),
      };
      storage.setItem(this.storageKey, JSON.stringify(persisted));
    } catch {
      // Storage may be unavailable in locked-down browser contexts.
    }
  }

  clear(): void {
    for (const storage of [this.storage('sessionStorage'), this.storage('localStorage')]) {
      try {
        storage?.removeItem(this.storageKey);
      } catch {
        // Storage may be unavailable in locked-down browser contexts.
      }
    }
  }

  private storage(mode: AuthStorageMode = this.storageMode): Storage | null {
    if (!this.isBrowser) {
      return null;
    }

    return mode === 'localStorage' ? localStorage : sessionStorage;
  }
}

function readStorageMode(): AuthStorageMode {
  return (environment.auth.stateStorage as string) === 'localStorage' ? 'localStorage' : 'sessionStorage';
}

function sanitizeSession(session: AuthSession): AuthSession {
  const sanitized = stripSecrets(session) as AuthSession;
  delete sanitized.csrfToken;

  return sanitized;
}

function stripSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripSecrets);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !SECRET_KEY_PATTERN.test(key))
        .map(([key, item]) => [key, stripSecrets(item)]),
    );
  }

  return value;
}

function isPersistedAuthState(value: unknown): value is PersistedAuthState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const session = record['session'] as Record<string, unknown> | undefined;
  const user = session?.['user'] as Record<string, unknown> | undefined;

  return (
    record['status'] === 'authenticated' &&
    session?.['status'] === 'authenticated' &&
    typeof session['expiresAt'] === 'string' &&
    typeof user?.['id'] === 'string' &&
    typeof user['tenantId'] === 'string' &&
    Array.isArray(user['roles'])
  );
}
