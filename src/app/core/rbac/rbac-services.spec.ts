import { of } from 'rxjs';
import { ApiService } from '../http/api.service';
import { RoleService } from './role.service';
import { UserService } from './user.service';

describe('RBAC services', () => {
  function createApiMock(): ApiService {
    return {
      get: vi.fn(() => of([])),
      post: vi.fn(() => of({})),
      patch: vi.fn(() => of({})),
      put: vi.fn(() => of({})),
      delete: vi.fn(() => of(undefined)),
    } as unknown as ApiService;
  }

  it('uses URL-only and URL-with-params overloads for users', () => {
    const api = createApiMock();
    const service = new UserService(api);

    service.list().subscribe();
    service.list({ state: 'disabled' }).subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/admin/rbac/users');
    expect(api.get).toHaveBeenNthCalledWith(2, '/admin/rbac/users', {
      state: 'disabled',
    });
  });

  it('uses role endpoints for role and permission operations', () => {
    const api = createApiMock();
    const service = new RoleService(api);

    service.list().subscribe();
    service.listPermissions().subscribe();
    service.assignPermission('role-id', 'permission-id').subscribe();

    expect(api.get).toHaveBeenNthCalledWith(1, '/admin/rbac/roles');
    expect(api.get).toHaveBeenNthCalledWith(2, '/admin/rbac/permissions');
    expect(api.post).toHaveBeenCalledWith('/admin/rbac/roles/role-id/permissions/permission-id', {});
  });
});
