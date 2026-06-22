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

export interface RbacPermission {
  id: string;
  tenantId: string;
  action: string;
  description?: string | null;
  group: string;
  createdAt: string;
  updatedAt: string;
}

export interface RbacPermissionGroup {
  key: string;
  label: string;
  permissions: readonly RbacPermission[];
}

export interface RbacPermissionCatalog {
  permissions: readonly RbacPermission[];
  groups: readonly RbacPermissionGroup[];
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
  permissions: readonly RbacPermission[];
}

export interface RbacRoleDetail extends RbacRole {
  assignedUsers: readonly RbacUser[];
}

export interface RbacInvitation {
  id: string;
  tenantId: string;
  email: string;
  displayName?: string | null;
  status: 'pending' | 'accepted' | 'revoked' | string;
  targetRoles: readonly RbacRoleSummary[];
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  resentAt?: string | null;
  createdAt: string;
  updatedAt: string;
  inviter?: SafeUserRef | null;
  resultingUser?: SafeUserRef | null;
  isExpired: boolean;
  onboardingEligible: boolean;
  canResend: boolean;
  canRevoke: boolean;
}

export interface SafeUserRef {
  id: string;
  displayName: string;
  email: string;
}

export interface RbacAuditEvent {
  id: string;
  tenantId: string;
  actorUserId: string | null;
  actor?: SafeUserRef | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RbacPage<T> {
  items: readonly T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateUserRequest {
  email: string;
  displayName: string;
  initialPassword?: string;
  generatePassword?: boolean;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  roleIds?: readonly string[];
}

export interface UpdateUserRequest {
  email?: string;
  displayName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
  roleIds?: readonly string[];
}

export interface CreateInvitationRequest {
  email: string;
  displayName?: string | null;
  roleIds?: readonly string[];
  expiresInDays?: number;
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
  state?: 'active' | 'disabled' | 'all';
}

export interface AuditQueryParams {
  page?: number;
  pageSize?: number;
  actorUserId?: string;
  action?: string;
  targetType?: string;
}

export type RbacQueryParams = Record<string, string | number | boolean>;

export function toQueryParams(params?: object): RbacQueryParams | undefined {
  if (!params) {
    return undefined;
  }

  const queryParams = Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string | number | boolean] =>
        typeof entry[1] === 'string' || typeof entry[1] === 'number' || typeof entry[1] === 'boolean',
    ),
  );

  return Object.keys(queryParams).length > 0 ? queryParams : undefined;
}
