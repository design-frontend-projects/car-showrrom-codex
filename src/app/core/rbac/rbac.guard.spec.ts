import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthFacade } from '../auth/auth.facade';
import { rbacAdminGuard } from './rbac.guard';

describe('rbacAdminGuard', () => {
  it('allows users with the showroom admin permission', async () => {
    const auth = createAuth({
      permissions: ['showroom.admin.manage'],
      roles: ['manager'],
    });

    await expect(runGuard(auth)).resolves.toBe(true);
  });

  it('allows equivalent admin roles', async () => {
    const auth = createAuth({
      permissions: [],
      roles: ['admin'],
    });

    await expect(runGuard(auth)).resolves.toBe(true);
  });

  it('redirects authenticated users without RBAC access', async () => {
    const redirect = {};
    const auth = createAuth({
      permissions: [],
      roles: ['manager'],
    });
    const router = { parseUrl: vi.fn(() => redirect) };

    await expect(runGuard(auth, router)).resolves.toBe(redirect);
    expect(router.parseUrl).toHaveBeenCalledWith('/admin/access-denied');
  });
});

function createAuth(user: { roles: string[]; permissions: string[] }) {
  return {
    isAuthenticated: vi.fn(() => true),
    loadSession: vi.fn(async () => undefined),
    user: vi.fn(() => ({
      id: 'user-id',
      tenantId: 'tenant-id',
      tenantSlug: 'tenant',
      displayName: 'User',
      email: 'user@example.com',
      phone: null,
      avatarUrl: null,
      roles: user.roles,
      permissions: user.permissions,
      twoFactorEnabled: false,
      twoFactorRequired: false,
    })),
  };
}

function runGuard(auth: unknown, router: unknown = { parseUrl: vi.fn() }) {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthFacade, useValue: auth },
      { provide: Router, useValue: router },
    ],
  });

  return TestBed.runInInjectionContext(() => rbacAdminGuard({} as never, {} as never)) as Promise<unknown> | boolean;
}
