import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../rbac/tenant-context.service';
import { AuthApiService } from './auth-api.service';
import { AuthPersistenceService } from './auth-persistence.service';
import { AuthSession } from './auth.models';
import { AuthSignalStore, normalizeRoles } from './auth.store';

describe('AuthSignalStore', () => {
  const session: AuthSession = {
    status: 'authenticated' as const,
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    csrfToken: 'csrf-token',
    user: {
      id: '11111111-1111-4111-8111-111111111111',
      tenantId: '22222222-2222-4222-8222-222222222222',
      tenantSlug: 'public-showroom',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: null,
      avatarUrl: null,
      roles: ['guest'],
      permissions: [],
      twoFactorEnabled: false,
      twoFactorRequired: false,
    },
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    vi.stubGlobal('sessionStorage', createMemoryStorage());
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes role names and derives admin flags from the hydrated session', async () => {
    const api = {
      session: vi.fn(() =>
        of({
          ...session,
          user: {
            ...session.user,
            roles: [' Admin ', 'admin', 'SYSTEM-OWNER'],
          },
        }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: api }],
    });

    const store = TestBed.inject(AuthSignalStore);
    await store.loadSession();

    expect(store.normalizedRoles()).toEqual(['admin', 'system-owner']);
    expect(store.isAdmin()).toBe(true);
    expect(store.isSystemOwner()).toBe(true);
    expect(store.canAccessAdmin()).toBe(true);
    expect(normalizeRoles([' Admin ', '', 'admin'])).toEqual(['admin']);
  });

  it('hydrates authenticated session state without storing browser tokens', async () => {
    const api = {
      session: vi.fn(() => of(session)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: api }],
    });

    const store = TestBed.inject(AuthSignalStore);
    await store.loadSession();

    expect(store.isAuthenticated()).toBe(true);
    expect(store.user()?.email).toBe('ada@example.com');
    expect(store.csrfToken()).toBe('csrf-token');
  });

  it('excludes sensitive fields from persisted browser auth state', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });

    const persistence = TestBed.inject(AuthPersistenceService);
    persistence.write({
      ...session,
      csrfToken: 'csrf-token',
      user: {
        ...session.user,
        roles: ['admin'],
        passwordHash: 'hash',
        sessionToken: 'session-token',
        csrfTokenHash: 'csrf-hash',
        totpSecret: 'totp-secret',
        backupCodes: ['backup-code'],
      } as AuthSession['user'] & Record<string, unknown>,
    });

    const raw = sessionStorage.getItem(environment.auth.stateStorageKey) ?? '';

    expect(raw).toContain('ada@example.com');
    expect(raw).toContain('admin');
    expect(raw).not.toContain('csrf-token');
    expect(raw).not.toContain('session-token');
    expect(raw).not.toContain('csrf-hash');
    expect(raw).not.toContain('totp-secret');
    expect(raw).not.toContain('backup-code');
    expect(raw).not.toContain('passwordHash');
  });

  it('rehydrates storage first, reconciles with the server session, and clears state on logout', async () => {
    const persistedSession: AuthSession = {
      ...session,
      user: {
        ...session.user,
        roles: ['guest'],
      },
    };
    const serverSession: AuthSession = {
      ...session,
      user: {
        ...session.user,
        roles: ['system-owner'],
      },
    };
    const api = {
      session: vi.fn(() => of(serverSession)),
      logout: vi.fn(() => of({ ok: true as const })),
    };
    const persistence = {
      read: vi.fn(() => ({
        status: 'authenticated' as const,
        session: persistedSession,
        roles: persistedSession.user.roles,
        persistedAt: new Date().toISOString(),
      })),
      write: vi.fn(),
      clear: vi.fn(),
    };
    const tenantContext = {
      setSelectedTenantId: vi.fn(),
      clearSelectedTenantId: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: api },
        { provide: AuthPersistenceService, useValue: persistence },
        { provide: TenantContextService, useValue: tenantContext },
      ],
    });

    const store = TestBed.inject(AuthSignalStore);
    await store.loadSession();

    expect(persistence.read).toHaveBeenCalled();
    expect(persistence.write).toHaveBeenCalledTimes(2);
    expect(store.normalizedRoles()).toEqual(['system-owner']);
    expect(store.canAccessAdmin()).toBe(true);
    expect(store.hydratedFromStorage()).toBe(false);
    expect(tenantContext.setSelectedTenantId).toHaveBeenCalledWith(session.user.tenantId);

    await store.logoutLocal();

    expect(api.logout).toHaveBeenCalled();
    expect(persistence.clear).toHaveBeenCalled();
    expect(tenantContext.clearSelectedTenantId).toHaveBeenCalled();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('updates roles and derived flags during explicit role refresh', async () => {
    const api = {
      session: vi.fn(() =>
        of({
          ...session,
          user: {
            ...session.user,
            roles: ['manager', 'ADMIN'],
          },
        }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: api }],
    });

    const store = TestBed.inject(AuthSignalStore);
    await store.refreshRoles();

    expect(store.normalizedRoles()).toEqual(['manager', 'admin']);
    expect(store.isAdmin()).toBe(true);
    expect(store.canAccessAdmin()).toBe(true);
    expect(store.lastRoleRefreshAt()).toBeTruthy();
  });

  it('exposes two-factor challenge state after password login', async () => {
    const challenge = {
      status: 'twoFactorRequired' as const,
      challengeToken: 'challenge',
      setupRequired: false,
      user: {
        email: 'ada@example.com',
        displayName: 'Ada Lovelace',
        twoFactorRequired: false,
      },
    };
    const api = {
      login: vi.fn(() => of(challenge)),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: api }],
    });

    const store = TestBed.inject(AuthSignalStore);
    await store.login({ email: 'ada@example.com', password: 'Password1!' });

    expect(store.requiresTwoFactor()).toBe(true);
    expect(store.challenge()?.challengeToken).toBe('challenge');
  });

  it('routes onboarding-required login responses without authenticating the store', async () => {
    const onboarding = {
      status: 'onboardingRequired' as const,
      challengeToken: 'challenge-token',
      invitation: {
        email: 'invitee@example.com',
        displayName: 'Invitee User',
        expiresAt: '2026-06-04T08:00:00.000Z',
      },
    };
    const api = {
      login: vi.fn(() => of(onboarding)),
    };
    const persistence = {
      clear: vi.fn(),
      read: vi.fn(() => null),
      write: vi.fn(),
    };
    const tenantContext = {
      setSelectedTenantId: vi.fn(),
      clearSelectedTenantId: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApiService, useValue: api },
        { provide: AuthPersistenceService, useValue: persistence },
        { provide: TenantContextService, useValue: tenantContext },
      ],
    });

    const store = TestBed.inject(AuthSignalStore);
    await store.login({ email: 'invitee@example.com', password: 'Password1!' });

    expect(store.requiresOnboarding()).toBe(true);
    expect(store.isAuthenticated()).toBe(false);
    expect(store.onboarding()?.invitation.email).toBe('invitee@example.com');
    expect(persistence.clear).toHaveBeenCalled();
    expect(tenantContext.clearSelectedTenantId).toHaveBeenCalled();
  });

  it('clears onboarding state after successful invitation acceptance', async () => {
    const api = {
      lookupInvitationOnboarding: vi.fn(() =>
        of({
          status: 'onboardingRequired' as const,
          challengeToken: 'challenge-token',
          invitation: {
            email: 'invitee@example.com',
            displayName: null,
            expiresAt: '2026-06-04T08:00:00.000Z',
          },
        }),
      ),
      acceptInvitationOnboarding: vi.fn(() => of({ ok: true as const })),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: api }],
    });

    const store = TestBed.inject(AuthSignalStore);
    await store.lookupInvitationOnboarding({ token: 'invitation-token-with-enough-entropy' });
    expect(store.requiresOnboarding()).toBe(true);

    await store.acceptInvitationOnboarding({
      challengeToken: 'challenge-token',
      displayName: 'Invitee User',
      password: 'Password1!',
    });

    expect(store.onboarding()).toBeNull();
    expect(store.isAuthenticated()).toBe(false);
  });

  it('records translated error keys from failed auth requests', async () => {
    const api = {
      login: vi.fn(() => throwError(() => ({ error: { code: 'auth.error.invalidCredentials' } }))),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthApiService, useValue: api }],
    });

    const store = TestBed.inject(AuthSignalStore);
    await store.login({ email: 'ada@example.com', password: 'wrong' });

    expect(store.status()).toBe('failed');
    expect(store.error()).toBe('auth.error.invalidCredentials');
  });
});

function createMemoryStorage(): Storage {
  const storage = new Map<string, string>();

  return {
    get length() {
      return storage.size;
    },
    clear: vi.fn(() => storage.clear()),
    getItem: vi.fn((key: string) => storage.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(storage.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
    }),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
    }),
  };
}
