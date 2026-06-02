import type { Express, NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { withRbacDatabaseContext } from './db-context';
import {
  assignPermissionToRole,
  assignRoleToUser,
  createPermission,
  createRole,
  createUser,
  deletePermission,
  deleteRole,
  deleteUser,
  getTenant,
  initializeDefaultRoles,
  listPermissions,
  listRoles,
  listUsers,
  removePermissionFromRole,
  removeRoleFromUser,
  updatePermission,
  updateRole,
  updateUser,
} from './rbac.repository';
import { assertUuid, HttpError, requireRbacRequestContext } from './request-context';

type AsyncRoute = (request: Request, response: Response) => Promise<void>;

export function registerRbacRoutes(app: Express): void {
  const router = Router();

  router.get(
    '/tenant',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const tenant = await withRbacDatabaseContext(context, (tx) =>
        getTenant(tx, context.tenantId),
      );

      response.json(tenant);
    }),
  );

  router.get(
    '/users',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const users = await withRbacDatabaseContext(context, (tx) => listUsers(tx, context.tenantId));

      response.json(users);
    }),
  );

  router.post(
    '/users',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const user = await withRbacDatabaseContext(context, (tx) =>
        createUser(tx, context.tenantId, normalizeBody(request)),
      );

      response.status(201).json(user);
    }),
  );

  router.patch(
    '/users/:userId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const userId = readUuidParam(request, 'userId');
      const user = await withRbacDatabaseContext(context, (tx) =>
        updateUser(tx, context.tenantId, userId, normalizeBody(request)),
      );

      response.json(user);
    }),
  );

  router.delete(
    '/users/:userId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const userId = readUuidParam(request, 'userId');
      await withRbacDatabaseContext(context, (tx) => deleteUser(tx, context.tenantId, userId));

      response.status(204).end();
    }),
  );

  router.post(
    '/users/:userId/roles/:roleId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const userId = readUuidParam(request, 'userId');
      const roleId = readUuidParam(request, 'roleId');
      await withRbacDatabaseContext(context, (tx) =>
        assignRoleToUser(tx, context.tenantId, userId, roleId),
      );

      response.status(204).end();
    }),
  );

  router.delete(
    '/users/:userId/roles/:roleId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const userId = readUuidParam(request, 'userId');
      const roleId = readUuidParam(request, 'roleId');
      await withRbacDatabaseContext(context, (tx) =>
        removeRoleFromUser(tx, context.tenantId, userId, roleId),
      );

      response.status(204).end();
    }),
  );

  router.get(
    '/roles',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const roles = await withRbacDatabaseContext(context, (tx) => listRoles(tx, context.tenantId));

      response.json(roles);
    }),
  );

  router.post(
    '/roles/defaults',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const roles = await withRbacDatabaseContext(context, (tx) =>
        initializeDefaultRoles(tx, context.tenantId),
      );

      response.json(roles);
    }),
  );

  router.post(
    '/roles',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const role = await withRbacDatabaseContext(context, (tx) =>
        createRole(tx, context.tenantId, normalizeBody(request)),
      );

      response.status(201).json(role);
    }),
  );

  router.patch(
    '/roles/:roleId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const roleId = readUuidParam(request, 'roleId');
      const role = await withRbacDatabaseContext(context, (tx) =>
        updateRole(tx, context.tenantId, roleId, normalizeBody(request)),
      );

      response.json(role);
    }),
  );

  router.delete(
    '/roles/:roleId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const roleId = readUuidParam(request, 'roleId');
      await withRbacDatabaseContext(context, (tx) => deleteRole(tx, context.tenantId, roleId));

      response.status(204).end();
    }),
  );

  router.post(
    '/roles/:roleId/permissions/:permissionId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const roleId = readUuidParam(request, 'roleId');
      const permissionId = readUuidParam(request, 'permissionId');
      await withRbacDatabaseContext(context, (tx) =>
        assignPermissionToRole(tx, context.tenantId, roleId, permissionId),
      );

      response.status(204).end();
    }),
  );

  router.delete(
    '/roles/:roleId/permissions/:permissionId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const roleId = readUuidParam(request, 'roleId');
      const permissionId = readUuidParam(request, 'permissionId');
      await withRbacDatabaseContext(context, (tx) =>
        removePermissionFromRole(tx, context.tenantId, roleId, permissionId),
      );

      response.status(204).end();
    }),
  );

  router.get(
    '/permissions',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const permissions = await withRbacDatabaseContext(context, (tx) =>
        listPermissions(tx, context.tenantId),
      );

      response.json(permissions);
    }),
  );

  router.post(
    '/permissions',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const permission = await withRbacDatabaseContext(context, (tx) =>
        createPermission(tx, context.tenantId, normalizeBody(request)),
      );

      response.status(201).json(permission);
    }),
  );

  router.patch(
    '/permissions/:permissionId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const permissionId = readUuidParam(request, 'permissionId');
      const permission = await withRbacDatabaseContext(context, (tx) =>
        updatePermission(tx, context.tenantId, permissionId, normalizeBody(request)),
      );

      response.json(permission);
    }),
  );

  router.delete(
    '/permissions/:permissionId',
    handle(async (request, response) => {
      const context = await requireRbacRequestContext(request);
      const permissionId = readUuidParam(request, 'permissionId');
      await withRbacDatabaseContext(context, (tx) =>
        deletePermission(tx, context.tenantId, permissionId),
      );

      response.status(204).end();
    }),
  );

  app.use('/api/rbac', router);
  app.use('/api/rbac', rbacErrorHandler);
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

function normalizeBody(request: Request): Record<string, unknown> {
  return typeof request.body === 'object' && request.body !== null && !Array.isArray(request.body)
    ? (request.body as Record<string, unknown>)
    : {};
}

function rbacErrorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
): void {
  if (!(error instanceof HttpError)) {
    next(error);
    return;
  }

  response.status(error.status).json({
    error: error.message,
  });
}
