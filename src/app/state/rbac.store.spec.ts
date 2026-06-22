import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RoleService } from '../core/rbac/role.service';
import { AuditService } from '../core/rbac/audit.service';
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

  const invitation = {
    id: '33333333-3333-4333-8333-333333333333',
    tenantId: user.tenantId,
    email: 'invitee@example.com',
    displayName: 'Invitee User',
    status: 'pending',
    targetRoles: [],
    expiresAt: '2026-06-04T00:00:00.000Z',
    acceptedAt: null,
    revokedAt: null,
    resentAt: null,
    createdAt: '2026-06-02T00:00:00.000Z',
    updatedAt: '2026-06-02T00:00:00.000Z',
    inviter: null,
    resultingUser: null,
    isExpired: false,
    onboardingEligible: true,
    canResend: true,
    canRevoke: true,
  };

  let userService: {
    list: ReturnType<typeof vi.fn>;
    listInvitations: ReturnType<typeof vi.fn>;
    revokeInvitation: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    userService = {
      list: vi.fn(() => of([user])),
      listInvitations: vi.fn(() => of([invitation])),
      revokeInvitation: vi.fn(() =>
        of({
          ...invitation,
          status: 'revoked',
          revokedAt: '2026-06-03T00:00:00.000Z',
          onboardingEligible: false,
          canResend: false,
          canRevoke: false,
        }),
      ),
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
            disable: vi.fn(),
            enable: vi.fn(),
            initiateReset: vi.fn(),
            listInvitations: userService.listInvitations,
            invite: vi.fn(),
            revokeInvitation: userService.revokeInvitation,
            resendInvitation: vi.fn(),
          },
        },
        {
          provide: RoleService,
          useValue: {
            list: vi.fn(() => of([])),
            detail: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            assignPermission: vi.fn(),
            removePermission: vi.fn(),
            listPermissions: vi.fn(() => of({ permissions: [], groups: [] })),
            createPermission: vi.fn(),
            updatePermission: vi.fn(),
            deletePermission: vi.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            list: vi.fn(() => of({ items: [], page: 1, pageSize: 25, total: 0 })),
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
    expect(store.error()).toBe('rbac.errors.forbidden');
  });

  it('updates invitation mutation state without clearing loaded users', async () => {
    const store = TestBed.inject(RbacSignalStore);

    await store.loadUsers();
    await store.loadInvitations();
    await store.revokeInvitation(invitation.id);

    expect(store.users()).toEqual([user]);
    expect(store.invitations()[0]).toEqual(
      expect.objectContaining({
        id: invitation.id,
        status: 'revoked',
        canRevoke: false,
      }),
    );
    expect(store.pendingInvitationCount()).toBe(0);
    expect(store.mutationStatus()).toBe('idle');
  });
});
