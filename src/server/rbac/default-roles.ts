import type { RbacTransactionClient } from './db-context';

export const REQUIRED_RBAC_ROLES = [
  'guest',
  'manager',
  'admin',
  'showroom-manager',
  'system-owner',
] as const;

export const SHOWROOM_PERMISSIONS = {
  catalogRead: 'showroom.catalog.read',
  listingManage: 'showroom.listings.manage',
  imageUpload: 'showroom.images.upload',
  requestSubmit: 'showroom.requests.submit',
  requestReview: 'showroom.requests.review',
  adminManage: 'showroom.admin.manage',
} as const;

const SHOWROOM_PERMISSION_DESCRIPTIONS: Record<string, string> = {
  [SHOWROOM_PERMISSIONS.catalogRead]: 'Read active public showroom listings and taxonomy.',
  [SHOWROOM_PERMISSIONS.listingManage]: 'Create and manage owned showroom listings.',
  [SHOWROOM_PERMISSIONS.imageUpload]: 'Upload and manage listing images.',
  [SHOWROOM_PERMISSIONS.requestSubmit]: 'Submit and view owned vehicle requests.',
  [SHOWROOM_PERMISSIONS.requestReview]: 'Review and approve or reject vehicle requests.',
  [SHOWROOM_PERMISSIONS.adminManage]: 'Administer showroom listings, requests, and media.',
};

const SHOWROOM_ROLE_PERMISSION_MAP: Record<(typeof REQUIRED_RBAC_ROLES)[number], string[]> = {
  guest: [SHOWROOM_PERMISSIONS.catalogRead],
  manager: [
    SHOWROOM_PERMISSIONS.catalogRead,
    SHOWROOM_PERMISSIONS.listingManage,
    SHOWROOM_PERMISSIONS.imageUpload,
    SHOWROOM_PERMISSIONS.requestSubmit,
  ],
  admin: Object.values(SHOWROOM_PERMISSIONS),
  'showroom-manager': Object.values(SHOWROOM_PERMISSIONS),
  'system-owner': Object.values(SHOWROOM_PERMISSIONS),
};

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
  const roleIds = new Map<string, string>();
  const permissionIds = new Map<string, string>();

  for (const roleName of REQUIRED_RBAC_ROLES) {
    const role = await tx.role.upsert({
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

    roleIds.set(roleName, role.id);
  }

  for (const [action, description] of Object.entries(SHOWROOM_PERMISSION_DESCRIPTIONS)) {
    const permission = await tx.permission.upsert({
      where: {
        tenantId_action: {
          tenantId,
          action,
        },
      },
      update: {
        description,
      },
      create: {
        tenantId,
        action,
        description,
      },
    });

    permissionIds.set(action, permission.id);
  }

  for (const [roleName, actions] of Object.entries(SHOWROOM_ROLE_PERMISSION_MAP)) {
    const roleId = roleIds.get(roleName);

    if (!roleId) {
      continue;
    }

    for (const action of actions) {
      const permissionId = permissionIds.get(action);

      if (!permissionId) {
        continue;
      }

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
  }
}
