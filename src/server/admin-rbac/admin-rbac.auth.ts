import type { NextFunction, Request, Response } from 'express';
import { resolveSessionUserId, verifySessionCsrf } from '../auth/auth.service';
import { readCsrfCookie, readSessionCookie } from '../auth/cookie.service';
import { withRbacDatabaseContext } from '../rbac/db-context';
import { SHOWROOM_PERMISSIONS } from '../rbac/default-roles';
import { HttpError, readTenantId } from '../rbac/request-context';

export interface AdminRbacContext {
  tenantId: string;
  actorUserId: string;
  roles: readonly string[];
  permissions: readonly string[];
  bypassTenantIsolation: boolean;
}

const ADMIN_ROLE_NAMES = new Set(['admin', 'system-owner']);

export async function requireAdminRbacContext(request: Request): Promise<AdminRbacContext> {
  const tenantId = readTenantId(request);
  const actorUserId = await resolveSessionUserId(request);

  if (!actorUserId) {
    throw new HttpError(401, 'An authenticated admin session is required.');
  }

  const access = await withRbacDatabaseContext(
    { tenantId, bypassTenantIsolation: false },
    async (tx) => {
      const user = await tx.user.findUnique({
        where: {
          tenantId_id: {
            tenantId,
            id: actorUserId,
          },
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user?.isActive) {
        return null;
      }

      const roles = user.roles.map(({ role }) => role.name);
      const permissions = Array.from(
        new Set(
          user.roles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.action),
          ),
        ),
      );
      const hasAdminRole = roles.some((role) => ADMIN_ROLE_NAMES.has(role));
      const hasAdminPermission = permissions.includes(SHOWROOM_PERMISSIONS.adminManage);

      return hasAdminRole || hasAdminPermission
        ? {
            roles,
            permissions,
            bypassTenantIsolation: roles.includes('system-owner'),
          }
        : null;
    },
  );

  if (!access) {
    throw new HttpError(403, 'You do not have permission to administer tenant RBAC.');
  }

  return {
    tenantId,
    actorUserId,
    roles: access.roles,
    permissions: access.permissions,
    bypassTenantIsolation: access.bypassTenantIsolation,
  };
}

export async function requireCsrf(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const headerToken = request.header('x-csrf-token');
    const cookieToken = readCsrfCookie(request);
    const csrfToken = headerToken && cookieToken && headerToken === cookieToken ? headerToken : null;
    const valid = await verifySessionCsrf(readSessionCookie(request), csrfToken);

    if (!valid) {
      next(new HttpError(403, 'A valid CSRF token is required.'));
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
