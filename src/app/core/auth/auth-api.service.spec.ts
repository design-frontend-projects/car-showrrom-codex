import { throwError, of } from 'rxjs';
import { ApiService } from '../http/api.service';
import { AuthApiService } from './auth-api.service';

describe('AuthApiService profile', () => {
  it('loads the current profile through the auth profile endpoint', () => {
    const profile = {
      id: '11111111-1111-4111-8111-111111111111',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: null,
      avatarUrl: null,
      isActive: true,
      tenant: {
        id: '22222222-2222-4222-8222-222222222222',
        slug: 'public-showroom',
        name: 'Public Showroom',
      },
      roles: ['guest'],
      twoFactorEnabled: false,
      twoFactorRequired: false,
      lastLoginAt: null,
      createdAt: '2026-06-01T08:00:00.000Z',
      updatedAt: '2026-06-02T08:00:00.000Z',
    };
    const api = { get: vi.fn(() => of(profile)) } as unknown as ApiService;
    const service = new AuthApiService(api);

    service.profile().subscribe((response) => {
      expect(response).toEqual(profile);
    });

    expect(api.get).toHaveBeenCalledWith('/auth/profile');
  });

  it('surfaces profile authorization errors to callers', () => {
    const error = { error: { code: 'auth.error.unauthorized' } };
    const api = { get: vi.fn(() => throwError(() => error)) } as unknown as ApiService;
    const service = new AuthApiService(api);

    service.profile().subscribe({
      error: (response) => {
        expect(response).toBe(error);
      },
    });

    expect(api.get).toHaveBeenCalledWith('/auth/profile');
  });
});
