export interface Tenant {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface RbacRoleSummary {
  id: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
}

export interface RbacPermissionSummary {
  id: string;
  action: string;
  description?: string | null;
}

export interface RbacUser {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
  roles: readonly RbacRoleSummary[];
}

export interface RbacRole {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: readonly RbacPermissionSummary[];
}

export interface RbacPermission {
  id: string;
  tenantId: string;
  action: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  passwordHash: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  displayName?: string;
  passwordHash?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
}

export interface CreateRoleRequest {
  name: string;
  description?: string | null;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string | null;
}

export interface CreatePermissionRequest {
  action: string;
  description?: string | null;
}

export interface UpdatePermissionRequest {
  action?: string;
  description?: string | null;
}

export interface RbacListParams {
  search?: string;
  includeInactive?: boolean;
}

export type RbacQueryParams = Record<string, string | number | boolean>;

export function toRbacQueryParams(params?: RbacListParams): RbacQueryParams | undefined {
  if (!params) {
    return undefined;
  }

  const queryParams: RbacQueryParams = {};

  if (params.search) {
    queryParams['search'] = params.search;
  }

  if (params.includeInactive !== undefined) {
    queryParams['includeInactive'] = params.includeInactive;
  }

  return queryParams;
}
