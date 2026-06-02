import type { RbacTransactionClient } from './db-context';

export const REQUIRED_RBAC_ROLES = [
  'guest',
  'manager',
  'admin',
  'showroom-manager',
  'system-owner',
] as const;

const ROLE_DESCRIPTIONS: Record<(typeof REQUIRED_RBAC_ROLES)[number], string> = {
  guest: 'Read-only baseline showroom access.',
  manager: 'Operational access for day-to-day showroom management.',
  admin: 'Tenant administrator access for users, roles, and permissions.',
  'showroom-manager': 'Showroom-specific management access for listings and staff workflows.',
  'system-owner':
    'Platform owner role used by trusted server code for cross-tenant administration.',
};

export async function ensureDefaultRbacRoles(
  tx: RbacTransactionClient,
  tenantId: string,
): Promise<void> {
  for (const roleName of REQUIRED_RBAC_ROLES) {
    await tx.role.upsert({
      where: {
        tenantId_name: {
          tenantId,
          name: roleName,
        },
      },
      update: {
        description: ROLE_DESCRIPTIONS[roleName],
        isSystem: true,
      },
      create: {
        tenantId,
        name: roleName,
        description: ROLE_DESCRIPTIONS[roleName],
        isSystem: true,
      },
    });
  }
}
