import type { Express, NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { withRbacDatabaseContext } from '../rbac/db-context';
import { assertUuid, HttpError } from '../rbac/request-context';
import { requireAdminRbacContext, requireCsrf } from './admin-rbac.auth';
import {
  acceptInvitation,
  assignPermissionToRole,
  assignRoleToUser,
  createInvitation,
  createPermission,
  createRole,
  createUser,
  deletePermission,
  deleteRole,
  getRoleDetail,
  initiatePasswordReset,
  listAuditEvents,
  listInvitations,
  listPermissions,
  listRoles,
  listUsers,
  removePermissionFromRole,
  removeRoleFromUser,
  resendInvitation,
  revokeInvitation,
  setUserActive,
  updatePermission,
  updateRole,
  updateUser,
} from './admin-rbac.repository';
import {
  acceptInvitationSchema,
  auditQuerySchema,
  createUserSchema,
  inviteUserSchema,
  listUsersQuerySchema,
  parseBody,
  parseQuery,
  permissionSchema,
  roleSchema,
  updatePermissionSchema,
  updateRoleSchema,
  updateUserSchema,
} from './admin-rbac.validation';

type AsyncRoute = (request: Request, response: Response) => Promise<void>;

const PUBLIC_BYPASS_TENANT_ID = '00000000-0000-4000-8000-000000000000';

export function registerAdminRbacRoutes(app: Express): void {
  const router = Router();

  router.post(
    '/invitations/accept',
    handle(async (request, response) => {
      const body = parseBody(acceptInvitationSchema, request.body);
      const result = await withRbacDatabaseContext(
        { tenantId: PUBLIC_BYPASS_TENANT_ID, bypassTenantIsolation: true },
        (tx) => acceptInvitation(tx, body),
      );

      response.status(200).json(result);
    }),
  );

  router.get(
    '/users',
    adminRoute(async (context, request, response) => {
      const query = parseQuery(listUsersQuerySchema, request.query);
      const users = await withRbacDatabaseContext(context, (tx) =>
        listUsers(tx, context.tenantId, query),
      );

      response.status(200).json(users);
    }),
  );

  router.post(
    '/users',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const body = parseBody(createUserSchema, request.body);
      const user = await withRbacDatabaseContext(context, (tx) => createUser(tx, context, body));

      response.status(201).json(user);
    }),
  );

  router.patch(
    '/users/:userId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const userId = readUuidParam(request, 'userId');
      const body = parseBody(updateUserSchema, request.body);
      const user = await withRbacDatabaseContext(context, (tx) =>
        updateUser(tx, context, userId, body),
      );

      response.status(200).json(user);
    }),
  );

  router.post(
    '/users/:userId/disable',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const userId = readUuidParam(request, 'userId');
      const user = await withRbacDatabaseContext(context, (tx) =>
        setUserActive(tx, context, userId, false),
      );

      response.status(200).json(user);
    }),
  );

  router.post(
    '/users/:userId/enable',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const userId = readUuidParam(request, 'userId');
      const user = await withRbacDatabaseContext(context, (tx) =>
        setUserActive(tx, context, userId, true),
      );

      response.status(200).json(user);
    }),
  );

  router.post(
    '/users/:userId/reset',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const userId = readUuidParam(request, 'userId');
      const result = await withRbacDatabaseContext(context, (tx) =>
        initiatePasswordReset(tx, context, userId),
      );

      response.status(200).json(result);
    }),
  );

  router.post(
    '/users/:userId/roles/:roleId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      await withRbacDatabaseContext(context, (tx) =>
        assignRoleToUser(tx, context, readUuidParam(request, 'userId'), readUuidParam(request, 'roleId')),
      );

      response.status(204).end();
    }),
  );

  router.delete(
    '/users/:userId/roles/:roleId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      await withRbacDatabaseContext(context, (tx) =>
        removeRoleFromUser(tx, context, readUuidParam(request, 'userId'), readUuidParam(request, 'roleId')),
      );

      response.status(204).end();
    }),
  );

  router.get(
    '/invitations',
    adminRoute(async (context, _request, response) => {
      const invitations = await withRbacDatabaseContext(context, (tx) =>
        listInvitations(tx, context.tenantId),
      );

      response.status(200).json(invitations);
    }),
  );

  router.post(
    '/invitations',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const body = parseBody(inviteUserSchema, request.body);
      const invitation = await withRbacDatabaseContext(context, (tx) =>
        createInvitation(tx, context, body),
      );

      response.status(201).json(invitation);
    }),
  );

  router.post(
    '/invitations/:invitationId/revoke',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const invitation = await withRbacDatabaseContext(context, (tx) =>
        revokeInvitation(tx, context, readUuidParam(request, 'invitationId')),
      );

      response.status(200).json(invitation);
    }),
  );

  router.post(
    '/invitations/:invitationId/resend',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const invitation = await withRbacDatabaseContext(context, (tx) =>
        resendInvitation(tx, context, readUuidParam(request, 'invitationId')),
      );

      response.status(200).json(invitation);
    }),
  );

  router.get(
    '/roles',
    adminRoute(async (context, _request, response) => {
      const roles = await withRbacDatabaseContext(context, (tx) =>
        listRoles(tx, context.tenantId),
      );

      response.status(200).json(roles);
    }),
  );

  router.get(
    '/roles/:roleId',
    adminRoute(async (context, request, response) => {
      const role = await withRbacDatabaseContext(context, (tx) =>
        getRoleDetail(tx, context.tenantId, readUuidParam(request, 'roleId')),
      );

      response.status(200).json(role);
    }),
  );

  router.post(
    '/roles',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const body = parseBody(roleSchema, request.body);
      const role = await withRbacDatabaseContext(context, (tx) => createRole(tx, context, body));

      response.status(201).json(role);
    }),
  );

  router.patch(
    '/roles/:roleId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const body = parseBody(updateRoleSchema, request.body);
      const role = await withRbacDatabaseContext(context, (tx) =>
        updateRole(tx, context, readUuidParam(request, 'roleId'), body),
      );

      response.status(200).json(role);
    }),
  );

  router.delete(
    '/roles/:roleId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      await withRbacDatabaseContext(context, (tx) =>
        deleteRole(tx, context, readUuidParam(request, 'roleId')),
      );

      response.status(204).end();
    }),
  );

  router.get(
    '/permissions',
    adminRoute(async (context, _request, response) => {
      const permissions = await withRbacDatabaseContext(context, (tx) =>
        listPermissions(tx, context.tenantId),
      );

      response.status(200).json(permissions);
    }),
  );

  router.post(
    '/permissions',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const body = parseBody(permissionSchema, request.body);
      const permission = await withRbacDatabaseContext(context, (tx) =>
        createPermission(tx, context, body),
      );

      response.status(201).json(permission);
    }),
  );

  router.patch(
    '/permissions/:permissionId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      const body = parseBody(updatePermissionSchema, request.body);
      const permission = await withRbacDatabaseContext(context, (tx) =>
        updatePermission(tx, context, readUuidParam(request, 'permissionId'), body),
      );

      response.status(200).json(permission);
    }),
  );

  router.delete(
    '/permissions/:permissionId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      await withRbacDatabaseContext(context, (tx) =>
        deletePermission(tx, context, readUuidParam(request, 'permissionId')),
      );

      response.status(204).end();
    }),
  );

  router.post(
    '/roles/:roleId/permissions/:permissionId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      await withRbacDatabaseContext(context, (tx) =>
        assignPermissionToRole(
          tx,
          context,
          readUuidParam(request, 'roleId'),
          readUuidParam(request, 'permissionId'),
        ),
      );

      response.status(204).end();
    }),
  );

  router.delete(
    '/roles/:roleId/permissions/:permissionId',
    requireCsrf,
    adminRoute(async (context, request, response) => {
      await withRbacDatabaseContext(context, (tx) =>
        removePermissionFromRole(
          tx,
          context,
          readUuidParam(request, 'roleId'),
          readUuidParam(request, 'permissionId'),
        ),
      );

      response.status(204).end();
    }),
  );

  router.get(
    '/audit',
    adminRoute(async (context, request, response) => {
      const query = parseQuery(auditQuerySchema, request.query);
      const result = await withRbacDatabaseContext(context, (tx) =>
        listAuditEvents(tx, context.tenantId, query),
      );

      response.status(200).json(result);
    }),
  );

  app.use('/api/admin/rbac', router);
  app.use('/api/admin/rbac', adminRbacErrorHandler);
}

function adminRoute(
  route: (
    context: Awaited<ReturnType<typeof requireAdminRbacContext>>,
    request: Request,
    response: Response,
  ) => Promise<void>,
) {
  return handle(async (request, response) => {
    const context = await requireAdminRbacContext(request);
    await route(context, request, response);
  });
}

function handle(route: AsyncRoute) {
  return (request: Request, response: Response, next: NextFunction): void => {
    route(request, response).catch(next);
  };
}

function readUuidParam(request: Request, name: string): string {
  const value = request.params[name];

  if (!value || Array.isArray(value)) {
    throw new HttpError(400, `${name} is required.`);
  }

  assertUuid(value, name);

  return value;
}

function adminRbacErrorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!(error instanceof HttpError)) {
    next(error);
    return;
  }

  const parsed = parseJsonMessage(error.message);

  response.status(error.status).json(parsed ?? { error: error.message });
}

function parseJsonMessage(message: string): unknown | null {
  try {
    return JSON.parse(message) as unknown;
  } catch {
    return null;
  }
}
