import type { Prisma } from '../../generated/prisma/client';
import { authConfig } from '../auth/auth.config';
import { hashSecret, randomToken, signChallenge, verifyChallenge } from '../auth/auth.crypto';
import { hashPassword } from '../auth/password.service';
import type { RbacTransactionClient } from '../rbac/db-context';
import { HttpError } from '../rbac/request-context';
import type {
  AuditQuery,
  CreateUserInput,
  InviteUserInput,
  ListUsersQuery,
  PermissionInput,
  RoleInput,
  UpdatePermissionInput,
  UpdateRoleInput,
  UpdateUserInput,
} from './admin-rbac.validation';

export interface AuditActor {
  tenantId: string;
  actorUserId: string;
}

export interface PageResult<T> {
  items: readonly T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface InvitationAcceptanceInput {
  token?: string;
  challengeToken?: string;
  displayName: string;
  password: string;
  phone?: string | null;
}

const SECRET_KEY_PATTERN = /(password|hash|token|otp|secret|backup|csrf|session)/i;
const INVITATION_CHALLENGE_PURPOSE = 'invitation-onboarding';
const INVITATION_CHALLENGE_TTL_MINUTES = 15;

export async function listUsers(
  tx: RbacTransactionClient,
  tenantId: string,
  query: ListUsersQuery,
) {
  return (
    await tx.user.findMany({
      where: {
        tenantId,
        ...(query.state === 'active' ? { isActive: true } : {}),
        ...(query.state === 'disabled' ? { isActive: false } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { displayName: 'asc' }],
      include: userInclude,
    })
  ).map(mapUser);
}

export async function createUser(
  tx: RbacTransactionClient,
  actor: AuditActor,
  input: CreateUserInput,
) {
  await assertRoleIdsBelongToTenant(tx, actor.tenantId, input.roleIds);
  const password = input.initialPassword ?? `${randomToken(18)}Aa1!`;
  const user = await tx.user.create({
    data: {
      tenantId: actor.tenantId,
      email: input.email,
      displayName: input.displayName,
      phone: input.phone ?? null,
      avatarUrl: input.avatarUrl ?? null,
      isActive: input.isActive ?? true,
      passwordHash: await hashPassword(password),
      passwordChangedAt: input.initialPassword ? new Date() : null,
      roles: {
        create: input.roleIds.map((roleId) => ({
          tenantId: actor.tenantId,
          roleId,
        })),
      },
    },
    include: userInclude,
  });

  await recordAuditEvent(tx, actor, {
    action: 'user.created',
    targetType: 'user',
    targetId: user.id,
    metadata: {
      email: user.email,
      roleIds: input.roleIds,
      generatedPassword: !input.initialPassword,
      isActive: user.isActive,
    },
  });

  return mapUser(user);
}

export async function updateUser(
  tx: RbacTransactionClient,
  actor: AuditActor,
  userId: string,
  input: UpdateUserInput,
) {
  await assertUserBelongsToTenant(tx, actor.tenantId, userId);

  if (input.roleIds) {
    await assertRoleIdsBelongToTenant(tx, actor.tenantId, input.roleIds);
    await tx.userRole.deleteMany({
      where: {
        tenantId: actor.tenantId,
        userId,
        roleId: { notIn: input.roleIds },
      },
    });

    for (const roleId of input.roleIds) {
      await tx.userRole.upsert({
        where: {
          tenantId_userId_roleId: {
            tenantId: actor.tenantId,
            userId,
            roleId,
          },
        },
        update: {},
        create: {
          tenantId: actor.tenantId,
          userId,
          roleId,
        },
      });
    }
  }

  const user = await tx.user.update({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: userId,
      },
    },
    data: removeUndefined({
      email: input.email,
      displayName: input.displayName,
      phone: input.phone,
      avatarUrl: input.avatarUrl,
      isActive: input.isActive,
    }),
    include: userInclude,
  });

  if (input.isActive === false) {
    await tx.authSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  await recordAuditEvent(tx, actor, {
    action: 'user.updated',
    targetType: 'user',
    targetId: user.id,
    metadata: {
      fields: Object.keys(input).filter((key) => key !== 'roleIds'),
      roleIds: input.roleIds,
      isActive: user.isActive,
    },
  });

  return mapUser(user);
}

export async function setUserActive(
  tx: RbacTransactionClient,
  actor: AuditActor,
  userId: string,
  isActive: boolean,
) {
  return updateUser(tx, actor, userId, { isActive });
}

export async function assignRoleToUser(
  tx: RbacTransactionClient,
  actor: AuditActor,
  userId: string,
  roleId: string,
) {
  await assertUserBelongsToTenant(tx, actor.tenantId, userId);
  await assertRoleIdsBelongToTenant(tx, actor.tenantId, [roleId]);

  await tx.userRole.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId: actor.tenantId,
        userId,
        roleId,
      },
    },
    update: {},
    create: {
      tenantId: actor.tenantId,
      userId,
      roleId,
    },
  });

  await recordAuditEvent(tx, actor, {
    action: 'user-role.assigned',
    targetType: 'user',
    targetId: userId,
    metadata: { roleId },
  });
}

export async function removeRoleFromUser(
  tx: RbacTransactionClient,
  actor: AuditActor,
  userId: string,
  roleId: string,
) {
  await assertUserBelongsToTenant(tx, actor.tenantId, userId);
  await assertRoleIdsBelongToTenant(tx, actor.tenantId, [roleId]);

  await tx.userRole.deleteMany({
    where: {
      tenantId: actor.tenantId,
      userId,
      roleId,
    },
  });

  await recordAuditEvent(tx, actor, {
    action: 'user-role.removed',
    targetType: 'user',
    targetId: userId,
    metadata: { roleId },
  });
}

export async function listInvitations(tx: RbacTransactionClient, tenantId: string) {
  const invitations = await tx.userInvitation.findMany({
      where: { tenantId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: invitationInclude,
  });
  const roleMap = await loadInvitationRoleMap(tx, tenantId, invitations);

  return invitations.map((invitation) => mapInvitation(invitation, roleMap));
}

export async function createInvitation(
  tx: RbacTransactionClient,
  actor: AuditActor,
  input: InviteUserInput,
) {
  await assertRoleIdsBelongToTenant(tx, actor.tenantId, input.roleIds);
  const token = randomToken();
  const invitation = await tx.userInvitation.create({
    data: {
      tenantId: actor.tenantId,
      email: input.email,
      normalizedEmail: input.email.toLowerCase(),
      displayName: input.displayName ?? null,
      tokenHash: hashSecret(token, 'invitation'),
      targetRoles: input.roleIds,
      status: 'pending',
      expiresAt: daysFromNow(input.expiresInDays),
      inviterUserId: actor.actorUserId,
    },
    include: invitationInclude,
  });

  await recordAuditEvent(tx, actor, {
    action: 'invitation.created',
    targetType: 'invitation',
    targetId: invitation.id,
    metadata: {
      email: invitation.email,
      roleIds: input.roleIds,
      expiresAt: invitation.expiresAt.toISOString(),
    },
  });

  return mapInvitation(invitation, await loadInvitationRoleMap(tx, actor.tenantId, [invitation]));
}

export async function revokeInvitation(
  tx: RbacTransactionClient,
  actor: AuditActor,
  invitationId: string,
) {
  const existing = await tx.userInvitation.findUnique({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: invitationId,
      },
    },
  });

  if (!existing) {
    throw new HttpError(404, 'Invitation was not found.');
  }

  if (existing.status !== 'pending' || existing.acceptedAt || existing.revokedAt) {
    throw new HttpError(409, 'Only pending invitations can be revoked.');
  }

  const invitation = await tx.userInvitation.update({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: invitationId,
      },
    },
    data: {
      status: 'revoked',
      revokedAt: new Date(),
    },
    include: invitationInclude,
  });

  await recordAuditEvent(tx, actor, {
    action: 'invitation.revoked',
    targetType: 'invitation',
    targetId: invitation.id,
    metadata: { email: invitation.email },
  });

  return mapInvitation(invitation, await loadInvitationRoleMap(tx, actor.tenantId, [invitation]));
}

export async function resendInvitation(
  tx: RbacTransactionClient,
  actor: AuditActor,
  invitationId: string,
) {
  const existing = await tx.userInvitation.findUnique({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: invitationId,
      },
    },
  });

  if (!existing) {
    throw new HttpError(404, 'Invitation was not found.');
  }

  if (existing.status !== 'pending' || existing.acceptedAt || existing.revokedAt) {
    throw new HttpError(409, 'Only pending invitations can be resent.');
  }

  const invitation = await tx.userInvitation.update({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: invitationId,
      },
    },
    data: {
      tokenHash: hashSecret(randomToken(), 'invitation'),
      status: 'pending',
      revokedAt: null,
      resentAt: new Date(),
      expiresAt: daysFromNow(7),
    },
    include: invitationInclude,
  });

  await recordAuditEvent(tx, actor, {
    action: 'invitation.resent',
    targetType: 'invitation',
    targetId: invitation.id,
    metadata: { email: invitation.email },
  });

  return mapInvitation(invitation, await loadInvitationRoleMap(tx, actor.tenantId, [invitation]));
}

export async function acceptInvitation(
  tx: RbacTransactionClient,
  input: InvitationAcceptanceInput,
) {
  const invitation = await resolveAcceptableInvitation(tx, input);

  const roleIds = readRoleIdsFromJson(invitation.targetRoles);
  await assertRoleIdsBelongToTenant(tx, invitation.tenantId, roleIds);
  const existing = await tx.user.findUnique({
    where: {
      tenantId_email: {
        tenantId: invitation.tenantId,
        email: invitation.normalizedEmail,
      },
    },
  });
  const passwordHash = await hashPassword(input.password);
  const user = existing
    ? await tx.user.update({
        where: {
          tenantId_id: {
            tenantId: invitation.tenantId,
            id: existing.id,
          },
        },
        data: {
          displayName: input.displayName,
          phone: input.phone ?? existing.phone,
          isActive: true,
          passwordHash,
          passwordChangedAt: new Date(),
        },
      })
    : await tx.user.create({
        data: {
          tenantId: invitation.tenantId,
          email: invitation.normalizedEmail,
          displayName: input.displayName,
          phone: input.phone ?? null,
          passwordHash,
          passwordChangedAt: new Date(),
        },
      });

  for (const roleId of roleIds) {
    await tx.userRole.upsert({
      where: {
        tenantId_userId_roleId: {
          tenantId: invitation.tenantId,
          userId: user.id,
          roleId,
        },
      },
      update: {},
      create: {
        tenantId: invitation.tenantId,
        userId: user.id,
        roleId,
      },
    });
  }

  await tx.userInvitation.update({
    where: {
      tenantId_id: {
        tenantId: invitation.tenantId,
        id: invitation.id,
      },
    },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
      resultingUserId: user.id,
    },
  });

  await recordAuditEvent(tx, { tenantId: invitation.tenantId, actorUserId: user.id }, {
    action: 'invitation.accepted',
    targetType: 'invitation',
    targetId: invitation.id,
    metadata: { email: invitation.email, resultingUserId: user.id },
  });

  return { ok: true as const };
}

export async function readInvitationOnboarding(
  tx: RbacTransactionClient,
  input: { token?: string; challengeToken?: string },
) {
  const invitation = await resolveAcceptableInvitation(tx, input);

  return mapInvitationOnboarding(invitation);
}

export async function readPendingInvitationOnboardingByEmail(
  tx: RbacTransactionClient,
  email: string,
  tenantId?: string,
) {
  const invitation = await tx.userInvitation.findFirst({
    where: {
      normalizedEmail: email.toLowerCase(),
      status: 'pending',
      acceptedAt: null,
      revokedAt: null,
      expiresAt: { gt: new Date() },
      ...(tenantId ? { tenantId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: invitationInclude,
  });

  return invitation ? mapInvitationOnboarding(invitation) : null;
}

export async function listRoles(tx: RbacTransactionClient, tenantId: string) {
  return (
    await tx.role.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      include: roleInclude,
    })
  ).map(mapRole);
}

export async function getRoleDetail(tx: RbacTransactionClient, tenantId: string, roleId: string) {
  const role = await tx.role.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: roleId,
      },
    },
    include: {
      ...roleInclude,
      users: {
        include: {
          user: {
            include: userInclude,
          },
        },
      },
    },
  });

  if (!role) {
    throw new HttpError(404, 'Role was not found.');
  }

  return {
    ...mapRole(role),
    assignedUsers: role.users.map(({ user }) => mapUser(user)),
  };
}

export async function createRole(tx: RbacTransactionClient, actor: AuditActor, input: RoleInput) {
  const role = await tx.role.create({
    data: {
      tenantId: actor.tenantId,
      name: input.name,
      description: input.description ?? null,
    },
    include: roleInclude,
  });

  await recordAuditEvent(tx, actor, {
    action: 'role.created',
    targetType: 'role',
    targetId: role.id,
    metadata: { name: role.name },
  });

  return mapRole(role);
}

export async function updateRole(
  tx: RbacTransactionClient,
  actor: AuditActor,
  roleId: string,
  input: UpdateRoleInput,
) {
  const existing = await assertRoleBelongsToTenant(tx, actor.tenantId, roleId);

  if (existing.isSystem && input.name && input.name !== existing.name) {
    throw new HttpError(409, 'System role names cannot be changed.');
  }

  const role = await tx.role.update({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: roleId,
      },
    },
    data: removeUndefined({
      name: input.name,
      description: input.description,
    }),
    include: roleInclude,
  });

  await recordAuditEvent(tx, actor, {
    action: 'role.updated',
    targetType: 'role',
    targetId: role.id,
    metadata: { fields: Object.keys(input), name: role.name },
  });

  return mapRole(role);
}

export async function deleteRole(tx: RbacTransactionClient, actor: AuditActor, roleId: string) {
  const role = await assertRoleBelongsToTenant(tx, actor.tenantId, roleId);

  if (role.isSystem) {
    throw new HttpError(409, 'System roles cannot be deleted.');
  }

  await tx.role.delete({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: roleId,
      },
    },
  });

  await recordAuditEvent(tx, actor, {
    action: 'role.deleted',
    targetType: 'role',
    targetId: roleId,
    metadata: { name: role.name },
  });
}

export async function listPermissions(tx: RbacTransactionClient, tenantId: string) {
  const permissions = await tx.permission.findMany({
    where: { tenantId },
    orderBy: { action: 'asc' },
  });

  return {
    permissions: permissions.map(mapPermission),
    groups: groupPermissions(permissions.map(mapPermission)),
  };
}

export async function createPermission(
  tx: RbacTransactionClient,
  actor: AuditActor,
  input: PermissionInput,
) {
  const permission = await tx.permission.create({
    data: {
      tenantId: actor.tenantId,
      action: input.action,
      description: input.description ?? null,
    },
  });

  await recordAuditEvent(tx, actor, {
    action: 'permission.created',
    targetType: 'permission',
    targetId: permission.id,
    metadata: { action: permission.action },
  });

  return mapPermission(permission);
}

export async function updatePermission(
  tx: RbacTransactionClient,
  actor: AuditActor,
  permissionId: string,
  input: UpdatePermissionInput,
) {
  const permission = await tx.permission.update({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: permissionId,
      },
    },
    data: removeUndefined({
      action: input.action,
      description: input.description,
    }),
  });

  await recordAuditEvent(tx, actor, {
    action: 'permission.updated',
    targetType: 'permission',
    targetId: permission.id,
    metadata: { fields: Object.keys(input), action: permission.action },
  });

  return mapPermission(permission);
}

export async function deletePermission(
  tx: RbacTransactionClient,
  actor: AuditActor,
  permissionId: string,
) {
  const permission = await tx.permission.delete({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: permissionId,
      },
    },
  });

  await recordAuditEvent(tx, actor, {
    action: 'permission.deleted',
    targetType: 'permission',
    targetId: permission.id,
    metadata: { action: permission.action },
  });
}

export async function assignPermissionToRole(
  tx: RbacTransactionClient,
  actor: AuditActor,
  roleId: string,
  permissionId: string,
) {
  await assertRoleBelongsToTenant(tx, actor.tenantId, roleId);
  await assertPermissionBelongsToTenant(tx, actor.tenantId, permissionId);
  await tx.rolePermission.upsert({
    where: {
      tenantId_roleId_permissionId: {
        tenantId: actor.tenantId,
        roleId,
        permissionId,
      },
    },
    update: {},
    create: {
      tenantId: actor.tenantId,
      roleId,
      permissionId,
    },
  });

  await recordAuditEvent(tx, actor, {
    action: 'role-permission.assigned',
    targetType: 'role',
    targetId: roleId,
    metadata: { permissionId },
  });
}

export async function removePermissionFromRole(
  tx: RbacTransactionClient,
  actor: AuditActor,
  roleId: string,
  permissionId: string,
) {
  await assertRoleBelongsToTenant(tx, actor.tenantId, roleId);
  await assertPermissionBelongsToTenant(tx, actor.tenantId, permissionId);

  await tx.rolePermission.deleteMany({
    where: {
      tenantId: actor.tenantId,
      roleId,
      permissionId,
    },
  });

  await recordAuditEvent(tx, actor, {
    action: 'role-permission.removed',
    targetType: 'role',
    targetId: roleId,
    metadata: { permissionId },
  });
}

export async function initiatePasswordReset(
  tx: RbacTransactionClient,
  actor: AuditActor,
  userId: string,
) {
  const user = await tx.user.findUnique({
    where: {
      tenantId_id: {
        tenantId: actor.tenantId,
        id: userId,
      },
    },
  });

  if (!user) {
    throw new HttpError(404, 'User was not found.');
  }

  if (!user.isActive) {
    throw new HttpError(409, 'Disabled users cannot receive password reset challenges.');
  }

  const otp = createNumericOtp(authConfig.resetOtpDigits);
  await tx.passwordResetOtp.create({
    data: {
      userId: user.id,
      email: user.email,
      otpHash: hashResetOtp(user.email, otp),
      maxAttempts: authConfig.resetOtpMaxAttempts,
      expiresAt: minutesFromNow(authConfig.resetOtpTtlMinutes),
    },
  });

  await recordAuditEvent(tx, actor, {
    action: 'reset.initiated',
    targetType: 'user',
    targetId: user.id,
    metadata: { email: user.email, delivery: 'created' },
  });

  return { ok: true, delivery: 'created' as const };
}

export async function listAuditEvents(
  tx: RbacTransactionClient,
  tenantId: string,
  query: AuditQuery,
): Promise<PageResult<unknown>> {
  const where = {
    tenantId,
    ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
    ...(query.action ? { action: query.action } : {}),
    ...(query.targetType ? { targetType: query.targetType } : {}),
  };
  const [items, total] = await Promise.all([
    tx.rbacAuditEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        actor: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    }),
    tx.rbacAuditEvent.count({ where }),
  ]);

  return {
    items: items.map(mapAuditEvent),
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

export async function recordAuditEvent(
  tx: RbacTransactionClient,
  actor: AuditActor,
  event: {
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: unknown;
  },
) {
  await tx.rbacAuditEvent.create({
    data: {
      tenantId: actor.tenantId,
      actorUserId: actor.actorUserId,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId ?? null,
      metadata: sanitizeMetadata(event.metadata ?? {}),
    },
  });
}

const userInclude = {
  roles: {
    include: {
      role: true,
    },
    orderBy: {
      role: {
        name: 'asc',
      },
    },
  },
} satisfies Prisma.UserInclude;

const roleInclude = {
  permissions: {
    include: {
      permission: true,
    },
    orderBy: {
      permission: {
        action: 'asc',
      },
    },
  },
} satisfies Prisma.RoleInclude;

const invitationInclude = {
  inviter: {
    select: {
      id: true,
      displayName: true,
      email: true,
    },
  },
  resultingUser: {
    select: {
      id: true,
      displayName: true,
      email: true,
    },
  },
} satisfies Prisma.UserInvitationInclude;

function mapUser(user: Prisma.UserGetPayload<{ include: typeof userInclude }>) {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    lastLoginAt: toIso(user.lastLoginAt),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    })),
  };
}

function mapRole(role: Prisma.RoleGetPayload<{ include: typeof roleInclude }>) {
  return {
    id: role.id,
    tenantId: role.tenantId,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
    permissions: role.permissions.map(({ permission }) => mapPermission(permission)),
  };
}

function mapPermission(permission: {
  id: string;
  tenantId: string;
  action: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: permission.id,
    tenantId: permission.tenantId,
    action: permission.action,
    description: permission.description,
    group: permission.action.split('.')[0] ?? 'general',
    createdAt: permission.createdAt.toISOString(),
    updatedAt: permission.updatedAt.toISOString(),
  };
}

function mapInvitation(
  invitation: Prisma.UserInvitationGetPayload<{ include: typeof invitationInclude }>,
  roleMap: Map<string, InvitationRoleSummary> = new Map(),
) {
  const now = new Date();
  const expired = invitation.expiresAt <= now;
  const pending = invitation.status === 'pending' && !invitation.acceptedAt && !invitation.revokedAt;
  const targetRoles = readRoleIdsFromJson(invitation.targetRoles).map((roleId) => roleMap.get(roleId) ?? {
    id: roleId,
    name: roleId,
    description: null,
    isSystem: false,
  });

  return {
    id: invitation.id,
    tenantId: invitation.tenantId,
    email: invitation.email,
    displayName: invitation.displayName,
    status: invitation.status,
    targetRoles,
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: toIso(invitation.acceptedAt),
    revokedAt: toIso(invitation.revokedAt),
    resentAt: toIso(invitation.resentAt),
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
    inviter: invitation.inviter,
    resultingUser: invitation.resultingUser,
    isExpired: expired,
    onboardingEligible: pending && !expired,
    canResend: pending,
    canRevoke: pending,
  };
}

function mapAuditEvent(event: {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  actor?: { id: string; displayName: string; email: string } | null;
}) {
  return {
    id: event.id,
    tenantId: event.tenantId,
    actorUserId: event.actorUserId,
    actor: event.actor ?? null,
    action: event.action,
    targetType: event.targetType,
    targetId: event.targetId,
    metadata: sanitizeMetadata(event.metadata),
    createdAt: event.createdAt.toISOString(),
  };
}

function groupPermissions(permissions: readonly ReturnType<typeof mapPermission>[]) {
  const groups = new Map<string, ReturnType<typeof mapPermission>[]>();

  for (const permission of permissions) {
    const group = permission.action.split('.')[0] ?? 'general';
    groups.set(group, [...(groups.get(group) ?? []), permission]);
  }

  return Array.from(groups.entries()).map(([key, items]) => ({
    key,
    label: toTitleCase(key),
    permissions: items,
  }));
}

async function assertRoleIdsBelongToTenant(
  tx: RbacTransactionClient,
  tenantId: string,
  roleIds: readonly string[],
) {
  if (roleIds.length === 0) {
    return;
  }

  const roles = await tx.role.findMany({
    where: {
      tenantId,
      id: { in: [...roleIds] },
    },
    select: { id: true },
  });

  if (roles.length !== new Set(roleIds).size) {
    throw new HttpError(400, 'Every role must belong to the selected tenant.');
  }
}

async function assertUserBelongsToTenant(tx: RbacTransactionClient, tenantId: string, userId: string) {
  const user = await tx.user.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: userId,
      },
    },
    select: { id: true },
  });

  if (!user) {
    throw new HttpError(404, 'User was not found.');
  }
}

async function assertRoleBelongsToTenant(tx: RbacTransactionClient, tenantId: string, roleId: string) {
  const role = await tx.role.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: roleId,
      },
    },
  });

  if (!role) {
    throw new HttpError(404, 'Role was not found.');
  }

  return role;
}

async function assertPermissionBelongsToTenant(
  tx: RbacTransactionClient,
  tenantId: string,
  permissionId: string,
) {
  const permission = await tx.permission.findUnique({
    where: {
      tenantId_id: {
        tenantId,
        id: permissionId,
      },
    },
    select: { id: true },
  });

  if (!permission) {
    throw new HttpError(404, 'Permission was not found.');
  }
}

function sanitizeMetadata(value: unknown): Prisma.InputJsonValue {
  if (value === null) {
    return '';
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item));
  }

  if (typeof value !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SECRET_KEY_PATTERN.test(key))
      .map(([key, item]) => [key, sanitizeMetadata(item)]),
  );
}

function readRoleIdsFromJson(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

type InvitationRecord = Prisma.UserInvitationGetPayload<{ include: typeof invitationInclude }>;
type InvitationRoleSummary = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

async function loadInvitationRoleMap(
  tx: RbacTransactionClient,
  tenantId: string,
  invitations: readonly { targetRoles: Prisma.JsonValue }[],
): Promise<Map<string, InvitationRoleSummary>> {
  const roleIds = Array.from(new Set(invitations.flatMap((invitation) => readRoleIdsFromJson(invitation.targetRoles))));

  if (roleIds.length === 0) {
    return new Map();
  }

  const roles = await tx.role.findMany({
    where: {
      tenantId,
      id: { in: roleIds },
    },
    select: {
      id: true,
      name: true,
      description: true,
      isSystem: true,
    },
  });

  return new Map(roles.map((role) => [role.id, role]));
}

async function resolveAcceptableInvitation(
  tx: RbacTransactionClient,
  input: { token?: string; challengeToken?: string },
): Promise<InvitationRecord> {
  const invitation = input.token
    ? await tx.userInvitation.findUnique({
        where: {
          tokenHash: hashSecret(input.token, 'invitation'),
        },
        include: invitationInclude,
      })
    : await findInvitationByChallenge(tx, input.challengeToken);

  if (
    !invitation ||
    invitation.status !== 'pending' ||
    invitation.revokedAt ||
    invitation.acceptedAt ||
    invitation.expiresAt <= new Date()
  ) {
    throw new HttpError(400, 'auth.error.invitationInvalid');
  }

  return invitation;
}

async function findInvitationByChallenge(
  tx: RbacTransactionClient,
  challengeToken: string | undefined,
): Promise<InvitationRecord | null> {
  if (!challengeToken) {
    throw new HttpError(400, 'auth.error.invitationChallengeInvalid');
  }

  try {
    const payload = verifyChallenge<{
      purpose?: unknown;
      invitationId?: unknown;
      tenantId?: unknown;
      email?: unknown;
    }>(challengeToken);

    if (
      payload.purpose !== INVITATION_CHALLENGE_PURPOSE ||
      typeof payload.invitationId !== 'string' ||
      typeof payload.tenantId !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      throw new Error('Invalid invitation challenge.');
    }

    const invitation = await tx.userInvitation.findUnique({
      where: {
        tenantId_id: {
          tenantId: payload.tenantId,
          id: payload.invitationId,
        },
      },
      include: invitationInclude,
    });

    return invitation?.normalizedEmail === payload.email ? invitation : null;
  } catch {
    throw new HttpError(400, 'auth.error.invitationChallengeInvalid');
  }
}

function mapInvitationOnboarding(invitation: InvitationRecord) {
  return {
    status: 'onboardingRequired' as const,
    challengeToken: signChallenge({
      purpose: INVITATION_CHALLENGE_PURPOSE,
      invitationId: invitation.id,
      tenantId: invitation.tenantId,
      email: invitation.normalizedEmail,
      expiresAt: minutesFromNow(INVITATION_CHALLENGE_TTL_MINUTES).toISOString(),
    }),
    invitation: {
      email: invitation.email,
      displayName: invitation.displayName,
      expiresAt: invitation.expiresAt.toISOString(),
    },
  };
}

function createNumericOtp(digits: number): string {
  const max = 10 ** digits;
  const value = Math.floor(Math.random() * max);

  return value.toString().padStart(digits, '0');
}

function hashResetOtp(email: string, otp: string): string {
  return hashSecret(`${email}:${otp}`, 'reset-otp');
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60_000);
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

function toIso(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, unknown] => entry[1] !== undefined),
  ) as T;
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_.]/g)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}
