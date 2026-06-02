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
}

export async function requireShowroomContext(
  request: Request,
  tx: Prisma.TransactionClient,
  requiredPermission?: string,
): Promise<ShowroomContext> {
  try {
    const context = await requireRbacRequestContext(request);
    const permissions = await readUserPermissions(tx, context.tenantId, context.userId);

    if (requiredPermission && !permissions.has(requiredPermission) && !permissions.has(SHOWROOM_PERMISSIONS.adminManage)) {
      throw new ShowroomHttpError(403, 'showroom.error.accessDenied');
    }

    return {
      ...context,
      permissions,
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
  return context.permissions.has(SHOWROOM_PERMISSIONS.adminManage);
}

async function readUserPermissions(
  tx: Prisma.TransactionClient,
  tenantId: string,
  userId: string,
): Promise<Set<string>> {
  const rolePermissions = await tx.rolePermission.findMany({
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
  });

  return new Set(rolePermissions.map(({ permission }) => permission.action));
}
