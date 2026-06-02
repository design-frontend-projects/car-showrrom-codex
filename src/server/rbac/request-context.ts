import type { Request } from 'express';
import { withRbacDatabaseContext } from './db-context';

export const TENANT_CONTEXT_HEADER = 'x-tenant-id';

export interface RbacRequestContext {
  tenantId: string;
  userId: string;
  bypassTenantIsolation: boolean;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function requireRbacRequestContext(request: Request): Promise<RbacRequestContext> {
  const tenantId = readTenantId(request);
  const userId = readAuthenticatedUserId(request);

  if (!userId) {
    throw new HttpError(401, 'An authenticated RBAC user is required.');
  }

  const access = await withRbacDatabaseContext(
    { tenantId, bypassTenantIsolation: false },
    async (tx) => {
      const membership = await tx.userRole.findFirst({
        where: {
          tenantId,
          userId,
        },
        include: {
          role: true,
        },
      });

      return {
        canAccessTenant: Boolean(membership),
        isSystemOwner: membership?.role.name === 'system-owner',
      };
    },
  );

  if (!access.canAccessTenant) {
    throw new HttpError(403, 'The authenticated user cannot access this tenant.');
  }

  return {
    tenantId,
    userId,
    bypassTenantIsolation: access.isSystemOwner,
  };
}

export function readTenantId(request: Request): string {
  const tenantId = request.header(TENANT_CONTEXT_HEADER);

  if (!tenantId || !isUuid(tenantId)) {
    throw new HttpError(400, 'A valid tenant context header is required.');
  }

  return tenantId;
}

export function assertUuid(value: string, label: string): void {
  if (!isUuid(value)) {
    throw new HttpError(400, `${label} must be a valid UUID.`);
  }
}

function readAuthenticatedUserId(request: Request): string | null {
  const authorization = request.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  const token = authorization.slice('Bearer '.length).trim();
  const payload = decodeTokenPayload(token);
  const userId =
    getStringClaim(payload, 'sub') ??
    getStringClaim(payload, 'userId') ??
    getStringClaim(payload, 'id');

  return userId && isUuid(userId) ? userId : null;
}

function decodeTokenPayload(token: string): Record<string, unknown> | null {
  const tokenPart = token.includes('.') ? token.split('.')[1] : token;

  if (!tokenPart) {
    return null;
  }

  try {
    const decoded = Buffer.from(toBase64(tokenPart), 'base64').toString('utf8');
    const payload: unknown = JSON.parse(decoded);

    return isRecord(payload) ? payload : null;
  } catch {
    return null;
  }
}

function toBase64(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;

  return padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`;
}

function getStringClaim(payload: Record<string, unknown> | null, key: string): string | null {
  const value = payload?.[key];

  return typeof value === 'string' ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}
