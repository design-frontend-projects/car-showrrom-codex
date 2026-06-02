import type { Permission, Role, Tenant, User } from '../../generated/prisma/client';
import type { RbacTransactionClient } from './db-context';
import { ensureDefaultRbacRoles } from './default-roles';
import { HttpError } from './request-context';

export interface CreateUserInput {
  email?: unknown;
  displayName?: unknown;
  passwordHash?: unknown;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateUserInput {
  email?: string;
  displayName?: string;
  passwordHash?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface CreateRoleInput {
  name?: unknown;
  description?: string | null;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}

export interface CreatePermissionInput {
  action?: unknown;
  description?: string | null;
}

export interface UpdatePermissionInput {
  action?: string;
  description?: string | null;
}

export async function getTenant(tx: RbacTransactionClient, tenantId: string): Promise<Tenant> {
  const tenant = await tx.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    throw new HttpError(404, 'Tenant was not found.');
  }

  return tenant;
}

export async function listUsers(tx: RbacTransactionClient, tenantId: string): Promise<unknown[]> {
  const users = await tx.user.findMany({
    where: { tenantId },
    orderBy: { email: 'asc' },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return users.map(mapUser);
}

export async function createUser(
  tx: RbacTransactionClient,
  tenantId: string,
  input: CreateUserInput,
): Promise<unknown> {
  const user = await tx.user.create({
    data: {
      tenantId,
      email: requireText(input.email, 'email'),
      displayName: requireText(input.displayName, 'displayName'),
      passwordHash: requireText(input.passwordHash, 'passwordHash'),
      phone: input.phone ?? null,
      avatarUrl: input.avatarUrl ?? null,
      isActive: input.isActive ?? true,
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return mapUser(user);
}

export async function updateUser(
  tx: RbacTransactionClient,
  tenantId: string,
  userId: string,
  input: UpdateUserInput,
): Promise<unknown> {
  const user = await tx.user.update({
    where: {
      tenantId_id: {
        tenantId,
        id: userId,
      },
    },
    data: removeUndefined({
      email: optionalText(input.email, 'email'),
      displayName: optionalText(input.displayName, 'displayName'),
      passwordHash: optionalText(input.passwordHash, 'passwordHash'),
      phone: input.phone,
      avatarUrl: input.avatarUrl,
      isActive: input.isActive,
    }),
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return mapUser(user);
}

export async function deleteUser(
  tx: RbacTransactionClient,
  tenantId: string,
  userId: string,
): Promise<void> {
  await tx.user.delete({
    where: {
      tenantId_id: {
        tenantId,
        id: userId,
      },
    },
  });
}

export async function initializeDefaultRoles(
  tx: RbacTransactionClient,
  tenantId: string,
): Promise<unknown[]> {
  await ensureDefaultRbacRoles(tx, tenantId);

  return listRoles(tx, tenantId);
}

export async function listRoles(tx: RbacTransactionClient, tenantId: string): Promise<unknown[]> {
  const roles = await tx.role.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  return roles.map(mapRole);
}

export async function createRole(
  tx: RbacTransactionClient,
  tenantId: string,
  input: CreateRoleInput,
): Promise<unknown> {
  const role = await tx.role.create({
    data: {
      tenantId,
      name: requireText(input.name, 'name'),
      description: input.description ?? null,
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  return mapRole(role);
}

export async function updateRole(
  tx: RbacTransactionClient,
  tenantId: string,
  roleId: string,
  input: UpdateRoleInput,
): Promise<unknown> {
  const role = await tx.role.update({
    where: {
      tenantId_id: {
        tenantId,
        id: roleId,
      },
    },
    data: removeUndefined({
      name: optionalText(input.name, 'name'),
      description: input.description,
    }),
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  return mapRole(role);
}

export async function deleteRole(
  tx: RbacTransactionClient,
  tenantId: string,
  roleId: string,
): Promise<void> {
  await tx.role.delete({
    where: {
      tenantId_id: {
        tenantId,
        id: roleId,
      },
    },
  });
}

export async function listPermissions(
  tx: RbacTransactionClient,
  tenantId: string,
): Promise<Permission[]> {
  return tx.permission.findMany({
    where: { tenantId },
    orderBy: { action: 'asc' },
  });
}

export async function createPermission(
  tx: RbacTransactionClient,
  tenantId: string,
  input: CreatePermissionInput,
): Promise<Permission> {
  return tx.permission.create({
    data: {
      tenantId,
      action: requireText(input.action, 'action'),
      description: input.description ?? null,
    },
  });
}

export async function updatePermission(
  tx: RbacTransactionClient,
  tenantId: string,
  permissionId: string,
  input: UpdatePermissionInput,
): Promise<Permission> {
  return tx.permission.update({
    where: {
      tenantId_id: {
        tenantId,
        id: permissionId,
      },
    },
    data: removeUndefined({
      action: optionalText(input.action, 'action'),
      description: input.description,
    }),
  });
}

export async function deletePermission(
  tx: RbacTransactionClient,
  tenantId: string,
  permissionId: string,
): Promise<void> {
  await tx.permission.delete({
    where: {
      tenantId_id: {
        tenantId,
        id: permissionId,
      },
    },
  });
}

export async function assignRoleToUser(
  tx: RbacTransactionClient,
  tenantId: string,
  userId: string,
  roleId: string,
): Promise<void> {
  await tx.userRole.upsert({
    where: {
      tenantId_userId_roleId: {
        tenantId,
        userId,
        roleId,
      },
    },
    update: {},
    create: {
      tenantId,
      userId,
      roleId,
    },
  });
}

export async function removeRoleFromUser(
  tx: RbacTransactionClient,
  tenantId: string,
  userId: string,
  roleId: string,
): Promise<void> {
  await tx.userRole.delete({
    where: {
      tenantId_userId_roleId: {
        tenantId,
        userId,
        roleId,
      },
    },
  });
}

export async function assignPermissionToRole(
  tx: RbacTransactionClient,
  tenantId: string,
  roleId: string,
  permissionId: string,
): Promise<void> {
  await tx.rolePermission.upsert({
    where: {
      tenantId_roleId_permissionId: {
        tenantId,
        roleId,
        permissionId,
      },
    },
    update: {},
    create: {
      tenantId,
      roleId,
      permissionId,
    },
  });
}

export async function removePermissionFromRole(
  tx: RbacTransactionClient,
  tenantId: string,
  roleId: string,
  permissionId: string,
): Promise<void> {
  await tx.rolePermission.delete({
    where: {
      tenantId_roleId_permissionId: {
        tenantId,
        roleId,
        permissionId,
      },
    },
  });
}

type UserWithRoles = User & {
  roles: {
    role: Role;
  }[];
};

type RoleWithPermissions = Role & {
  permissions: {
    permission: Permission;
  }[];
};

function mapUser(user: UserWithRoles): unknown {
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    roles: user.roles.map(({ role }) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    })),
  };
}

function mapRole(role: RoleWithPermissions): unknown {
  return {
    id: role.id,
    tenantId: role.tenantId,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
    permissions: role.permissions.map(({ permission }) => ({
      id: permission.id,
      action: permission.action,
      description: permission.description,
    })),
  };
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new HttpError(400, `${label} is required.`);
  }

  return value.trim();
}

function optionalText(value: unknown, label: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return requireText(value, label);
}

function removeUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, unknown] => entry[1] !== undefined),
  ) as T;
}
