import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthSignalStore } from './auth.store';

describe('AuthSignalStore', () => {
  const session = {
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
      twoFactorEnabled: false,
      twoFactorRequired: false,
    },
  };

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
