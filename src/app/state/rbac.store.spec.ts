import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RoleService } from '../core/rbac/role.service';
import { TenantService } from '../core/rbac/tenant.service';
import { UserService } from '../core/rbac/user.service';
import { RbacSignalStore } from './rbac.store';

describe('RbacSignalStore', () => {
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    tenantId: '22222222-2222-4222-8222-222222222222',
    email: 'admin@example.com',
    displayName: 'Admin User',
    phone: null,
    avatarUrl: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: '2026-06-02T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
    roles: [],
  };

  let userService: { list: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userService = {
      list: vi.fn(() => of([user])),
    };

    TestBed.configureTestingModule({
      providers: [
        RbacSignalStore,
        {
          provide: TenantService,
          useValue: {
            current: vi.fn(() => of(null)),
          },
        },
        {
          provide: UserService,
          useValue: {
            ...userService,
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            list: vi.fn(() => of([])),
            initializeDefaults: vi.fn(() => of([])),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            assignPermission: vi.fn(),
            removePermission: vi.fn(),
            listPermissions: vi.fn(() => of([])),
            createPermission: vi.fn(),
            updatePermission: vi.fn(),
            deletePermission: vi.fn(),
          },
        },
      ],
    });
  });

  it('keeps loaded users when a forbidden reload fails', async () => {
    const store = TestBed.inject(RbacSignalStore);

    await store.loadUsers();
    expect(store.users()).toEqual([user]);

    userService.list.mockReturnValueOnce(throwError(() => ({ status: 403 })));

    await store.loadUsers();

    expect(store.users()).toEqual([user]);
    expect(store.usersStatus()).toBe('failed');
    expect(store.usersError()).toBe('You do not have permission to manage this tenant RBAC data.');
  });
});
