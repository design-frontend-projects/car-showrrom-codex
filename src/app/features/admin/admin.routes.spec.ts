import { authGuard } from '../../core/auth/auth.guard';
import { rbacAdminGuard } from '../../core/rbac/rbac.guard';
import { adminRoutes } from './admin.routes';

describe('admin routes', () => {
  it('guards admin definition and users-with-roles flows', () => {
    for (const path of ['definitions', 'definitions/:entity', 'users-roles']) {
      const route = adminRoutes.find((item) => item.path === path);

      expect(route?.canActivate).toEqual([authGuard, rbacAdminGuard]);
      expect(route?.data?.['permission']).toBe('showroom.admin.manage');
    }
  });

  it('exposes the route surface needed by admin access and definition E2E flows', () => {
    expect(adminRoutes.map((route) => route.path)).toEqual(
      expect.arrayContaining(['', 'vehicles', 'vehicles/create', 'definitions', 'definitions/:entity', 'users-roles', 'access-denied']),
    );
  });
});
