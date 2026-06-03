import { hashSecret } from '../auth/auth.crypto';
import {
  acceptInvitation,
  assignRoleToUser,
  createUser,
  deleteRole,
  initiatePasswordReset,
  listAuditEvents,
  removePermissionFromRole,
  revokeInvitation,
} from './admin-rbac.repository';

const tenantId = '11111111-1111-4111-8111-111111111111';
const actorUserId = '22222222-2222-4222-8222-222222222222';
const roleId = '33333333-3333-4333-8333-333333333333';
const permissionId = '44444444-4444-4444-8444-444444444444';
const now = new Date('2026-06-03T08:00:00.000Z');
const actor = { tenantId, actorUserId };

describe('admin RBAC repository', () => {
  it('creates users with server-owned password hashes and sanitized DTOs', async () => {
    const tx = {
      role: { findMany: vi.fn().mockResolvedValue([{ id: roleId }]) },
      user: {
        create: vi.fn(async ({ data }) => ({
          ...baseUser(),
          email: data.email,
          displayName: data.displayName,
          passwordHash: data.passwordHash,
          roles: data.roles.create.map((entry: { roleId: string }) => ({
            role: baseRole(entry.roleId),
          })),
        })),
      },
      rbacAuditEvent: { create: vi.fn().mockResolvedValue({}) },
    } as any;

    const result = await createUser(tx, actor, {
      email: 'admin@example.com',
      displayName: 'Admin User',
      initialPassword: 'Password1!',
      roleIds: [roleId],
    });

    const createArg = vi.mocked(tx.user.create).mock.calls[0]?.[0];
    expect(createArg.data.passwordHash).not.toBe('Password1!');
    expect(createArg.data.initialPassword).toBeUndefined();
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.roles).toEqual([
      expect.objectContaining({
        id: roleId,
        name: 'manager',
      }),
    ]);
    expect(tx.rbacAuditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'user.created',
        metadata: expect.objectContaining({
          email: 'admin@example.com',
          roleIds: [roleId],
        }),
      }),
    });
    expect(JSON.stringify(vi.mocked(tx.rbacAuditEvent.create).mock.calls[0]?.[0])).not.toContain(
      'Password1!',
    );
    expect(JSON.stringify(vi.mocked(tx.rbacAuditEvent.create).mock.calls[0]?.[0])).not.toContain(
      'generatedPassword',
    );
  });

  it('rejects role assignments when the target role belongs to another tenant', async () => {
    const tx = {
      user: { findUnique: vi.fn().mockResolvedValue({ id: actorUserId }) },
      role: { findMany: vi.fn().mockResolvedValue([]) },
      userRole: { upsert: vi.fn() },
      rbacAuditEvent: { create: vi.fn() },
    } as any;

    await expect(assignRoleToUser(tx, actor, actorUserId, roleId)).rejects.toMatchObject({
      status: 400,
      message: 'Every role must belong to the selected tenant.',
    });
    expect(tx.userRole.upsert).not.toHaveBeenCalled();
    expect(tx.rbacAuditEvent.create).not.toHaveBeenCalled();
  });

  it('rejects removing role permissions when the permission is outside the tenant', async () => {
    const tx = {
      role: { findUnique: vi.fn().mockResolvedValue(baseRole(roleId)) },
      permission: { findUnique: vi.fn().mockResolvedValue(null) },
      rolePermission: { deleteMany: vi.fn() },
      rbacAuditEvent: { create: vi.fn() },
    } as any;

    await expect(removePermissionFromRole(tx, actor, roleId, permissionId)).rejects.toMatchObject({
      status: 404,
      message: 'Permission was not found.',
    });
    expect(tx.rolePermission.deleteMany).not.toHaveBeenCalled();
    expect(tx.rbacAuditEvent.create).not.toHaveBeenCalled();
  });

  it('protects system roles from deletion', async () => {
    const tx = {
      role: {
        findUnique: vi.fn().mockResolvedValue({ ...baseRole(roleId), isSystem: true }),
        delete: vi.fn(),
      },
      rbacAuditEvent: { create: vi.fn() },
      rolePermission: { deleteMany: vi.fn() },
      userRole: { deleteMany: vi.fn() },
    } as any;

    await expect(deleteRole(tx, actor, roleId)).rejects.toMatchObject({
      status: 409,
      message: 'System roles cannot be deleted.',
    });
    expect(tx.role.delete).not.toHaveBeenCalled();
    expect(tx.rbacAuditEvent.create).not.toHaveBeenCalled();
  });

  it('accepts pending invitations without exposing token hashes', async () => {
    const token = 'invitation-token-with-enough-entropy';
    const tx = {
      userInvitation: {
        findUnique: vi.fn().mockResolvedValue({
          ...baseInvitation(),
          tokenHash: hashSecret(token, 'invitation'),
          status: 'pending',
          expiresAt: new Date('2026-06-04T08:00:00.000Z'),
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      role: { findMany: vi.fn().mockResolvedValue([{ id: roleId }]) },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn(async ({ data }) => ({
          ...baseUser('55555555-5555-4555-8555-555555555555'),
          email: data.email,
          displayName: data.displayName,
          phone: data.phone,
          passwordHash: data.passwordHash,
          roles: [],
        })),
      },
      userRole: { upsert: vi.fn().mockResolvedValue({}) },
      rbacAuditEvent: { create: vi.fn().mockResolvedValue({}) },
    } as any;

    await expect(
      acceptInvitation(tx, {
        token,
        displayName: 'Invitee User',
        password: 'Password1!',
      }),
    ).resolves.toEqual({ ok: true });

    const createdUser = vi.mocked(tx.user.create).mock.calls[0]?.[0].data;
    expect(createdUser.passwordHash).not.toBe('Password1!');
    expect(tx.userRole.upsert).toHaveBeenCalledWith({
      where: {
        tenantId_userId_roleId: {
          tenantId,
          userId: '55555555-5555-4555-8555-555555555555',
          roleId,
        },
      },
      update: {},
      create: {
        tenantId,
        userId: '55555555-5555-4555-8555-555555555555',
        roleId,
      },
    });
    expect(tx.userInvitation.update).toHaveBeenCalledWith({
      where: { id: baseInvitation().id },
      data: expect.objectContaining({
        status: 'accepted',
        resultingUserId: '55555555-5555-4555-8555-555555555555',
      }),
    });
  });

  it('revokes invitations with sanitized responses', async () => {
    const tx = {
      userInvitation: {
        update: vi.fn().mockResolvedValue({
          ...baseInvitation(),
          status: 'revoked',
          revokedAt: now,
          tokenHash: 'stored-hash',
        }),
      },
      rbacAuditEvent: { create: vi.fn().mockResolvedValue({}) },
    } as any;

    const result = await revokeInvitation(tx, actor, baseInvitation().id);

    expect(result).toEqual(
      expect.objectContaining({
        id: baseInvitation().id,
        status: 'revoked',
        revokedAt: now.toISOString(),
      }),
    );
    expect(result).not.toHaveProperty('tokenHash');
  });

  it('blocks reset initiation for disabled users', async () => {
    const tx = {
      user: { findUnique: vi.fn().mockResolvedValue({ ...baseUser(), isActive: false }) },
      passwordResetOtp: { create: vi.fn() },
      rbacAuditEvent: { create: vi.fn() },
    } as any;

    await expect(initiatePasswordReset(tx, actor, actorUserId)).rejects.toMatchObject({
      status: 409,
      message: 'Disabled users cannot receive password reset challenges.',
    });
    expect(tx.passwordResetOtp.create).not.toHaveBeenCalled();
    expect(tx.rbacAuditEvent.create).not.toHaveBeenCalled();
  });

  it('paginates audit events and strips secret-bearing metadata', async () => {
    const tx = {
      rbacAuditEvent: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: '66666666-6666-4666-8666-666666666666',
            tenantId,
            actorUserId,
            actor: { id: actorUserId, displayName: 'Admin User', email: 'admin@example.com' },
            action: 'permission.created',
            targetType: 'permission',
            targetId: permissionId,
            metadata: {
              action: 'showroom.verify',
              password: 'redacted',
              nested: { tokenHash: 'redacted', safe: true },
            },
            createdAt: now,
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    } as any;

    const result = await listAuditEvents(tx, tenantId, {
      page: 2,
      pageSize: 10,
      action: 'permission.created',
    });

    expect(tx.rbacAuditEvent.findMany).toHaveBeenCalledWith({
      where: {
        tenantId,
        action: 'permission.created',
      },
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });
    expect(result.items[0]).toEqual(
      expect.objectContaining({
        metadata: {
          action: 'showroom.verify',
          nested: { safe: true },
        },
      }),
    );
    expect(JSON.stringify(result.items)).not.toContain('redacted');
  });
});

function baseUser(id = actorUserId) {
  return {
    id,
    tenantId,
    email: 'admin@example.com',
    displayName: 'Admin User',
    passwordHash: '$2b$08$server-owned-hash',
    phone: null,
    avatarUrl: null,
    isActive: true,
    emailVerifiedAt: null,
    passwordChangedAt: now,
    twoFactorEnabled: false,
    twoFactorRequired: false,
    twoFactorSecretEncrypted: null,
    twoFactorPendingSecretEncrypted: null,
    twoFactorVerifiedAt: null,
    failedLoginCount: 0,
    lockedUntil: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    roles: [],
  };
}

function baseRole(id = roleId) {
  return {
    id,
    tenantId,
    name: 'manager',
    description: null,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
    permissions: [],
  };
}

function baseInvitation() {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    tenantId,
    email: 'invitee@example.com',
    normalizedEmail: 'invitee@example.com',
    displayName: 'Invitee User',
    tokenHash: 'stored-hash',
    targetRoles: [roleId],
    status: 'pending',
    expiresAt: new Date('2026-06-04T08:00:00.000Z'),
    acceptedAt: null,
    revokedAt: null,
    resentAt: null,
    createdAt: now,
    updatedAt: now,
    inviterUserId: actorUserId,
    resultingUserId: null,
    inviter: {
      id: actorUserId,
      displayName: 'Admin User',
      email: 'admin@example.com',
    },
    resultingUser: null,
  };
}
