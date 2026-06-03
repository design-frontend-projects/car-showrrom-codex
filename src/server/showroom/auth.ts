import type { Request } from 'express';
import type { Prisma } from '../../generated/prisma/client';
import { SHOWROOM_PERMISSIONS } from '../rbac/default-roles';
import {
  HttpError as RbacHttpError,
  readTenantId,
  requireRbacRequestContext,
  type RbacRequestContext,
} from '../rbac/request-context';
import { ShowroomHttpError } from './errors';

export interface ShowroomContext extends RbacRequestContext {
  permissions: Set<string>;
  roles: Set<string>;
}

const ADMIN_ROLE_KEYS = new Set(['admin', 'system-owner']);

export async function requireShowroomContext(
  request: Request,
  tx: Prisma.TransactionClient,
  requiredPermission?: string,
): Promise<ShowroomContext> {
  try {
    const context = await requireRbacRequestContext(request);
    const access = await readUserAccess(tx, context.tenantId, context.userId);

    if (
      requiredPermission &&
      !access.permissions.has(requiredPermission) &&
      !access.permissions.has(SHOWROOM_PERMISSIONS.adminManage) &&
      !hasAdminRole(access.roles)
    ) {
      throw new ShowroomHttpError(403, 'showroom.error.accessDenied');
    }

    return {
      ...context,
      permissions: access.permissions,
      roles: access.roles,
    };
  } catch (error) {
    if (error instanceof ShowroomHttpError) {
      throw error;
    }

    if (error instanceof RbacHttpError) {
      throw new ShowroomHttpError(error.status, error.status === 401 ? 'showroom.error.unauthorized' : 'showroom.error.accessDenied');
    }

    throw error;
  }
}

export function readPublicTenantId(request: Request): string {
  try {
    return readTenantId(request);
  } catch (error) {
    if (error instanceof RbacHttpError) {
      throw new ShowroomHttpError(400, 'showroom.error.tenantRequired');
    }

    throw error;
  }
}

export function canAdminShowroom(context: ShowroomContext): boolean {
  return context.permissions.has(SHOWROOM_PERMISSIONS.adminManage) || hasAdminRole(context.roles);
}

function hasAdminRole(roles: Set<string>): boolean {
  return Array.from(roles).some((role) => ADMIN_ROLE_KEYS.has(normalizeRoleName(role)));
}

export function normalizeRoleName(role: string): string {
  return role.trim().toLowerCase();
}

async function readUserAccess(
  tx: Prisma.TransactionClient,
  tenantId: string,
  userId: string,
): Promise<{ permissions: Set<string>; roles: Set<string> }> {
  const [rolePermissions, userRoles] = await Promise.all([
    tx.rolePermission.findMany({
      where: {
        tenantId,
        role: {
          users: {
            some: {
              tenantId,
              userId,
            },
          },
        },
      },
      include: {
        permission: true,
      },
    }),
    tx.userRole.findMany({
      where: {
        tenantId,
        userId,
      },
      include: {
        role: true,
      },
    }),
  ]);

  return {
    permissions: new Set(rolePermissions.map(({ permission }) => permission.action)),
    roles: new Set(userRoles.map(({ role }) => normalizeRoleName(role.name))),
  };
}
