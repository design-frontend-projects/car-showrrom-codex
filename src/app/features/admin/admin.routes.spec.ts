import { authGuard } from '../../core/auth/auth.guard';
import { rbacAdminGuard } from '../../core/rbac/rbac.guard';
import {
  adminVehicleEditorResolver,
  adminVehicleOverviewResolver,
  definitionEntityResolver,
} from '../../core/showroom/showroom-route.resolvers';
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

  it('wires admin vehicle and definition routes to route resolvers', () => {
    expect(adminRoutes.find((item) => item.path === 'vehicles')?.resolve?.['adminVehicleData']).toBe(
      adminVehicleOverviewResolver,
    );
    expect(adminRoutes.find((item) => item.path === 'vehicles/create')?.resolve?.['adminVehicleEditorData']).toBe(
      adminVehicleEditorResolver,
    );
    expect(adminRoutes.find((item) => item.path === 'vehicles/edit/:id')?.resolve?.['adminVehicleEditorData']).toBe(
      adminVehicleEditorResolver,
    );
    expect(adminRoutes.find((item) => item.path === 'definitions/:entity')?.resolve?.['definitionData']).toBe(
      definitionEntityResolver,
    );
  });
});
