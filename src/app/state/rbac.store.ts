import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { AuditService } from '../core/rbac/audit.service';
import {
  AuditQueryParams,
  CreateInvitationRequest,
  CreatePermissionRequest,
  CreateRoleRequest,
  CreateUserRequest,
  RbacAuditEvent,
  RbacInvitation,
  RbacPage,
  RbacPermission,
  RbacPermissionGroup,
  RbacRole,
  RbacRoleDetail,
  RbacUser,
  Tenant,
  UpdatePermissionRequest,
  UpdateRoleRequest,
  UpdateUserRequest,
} from '../core/rbac/rbac.models';
import { RoleService } from '../core/rbac/role.service';
import { TenantService } from '../core/rbac/tenant.service';
import { UserService } from '../core/rbac/user.service';

type RbacStatus = 'idle' | 'loading' | 'loaded' | 'failed';
type MutationStatus = 'idle' | 'saving' | 'failed';

export interface RbacState {
  tenant: Tenant | null;
  users: readonly RbacUser[];
  invitations: readonly RbacInvitation[];
  roles: readonly RbacRole[];
  selectedRole: RbacRoleDetail | null;
  permissions: readonly RbacPermission[];
  permissionGroups: readonly RbacPermissionGroup[];
  auditPage: RbacPage<RbacAuditEvent>;
  usersFilter: 'active' | 'disabled' | 'all';
  auditFilter: AuditQueryParams;
  tenantStatus: RbacStatus;
  usersStatus: RbacStatus;
  invitationsStatus: RbacStatus;
  rolesStatus: RbacStatus;
  permissionsStatus: RbacStatus;
  auditStatus: RbacStatus;
  mutationStatus: MutationStatus;
  error: string | null;
}

const emptyAuditPage: RbacPage<RbacAuditEvent> = {
  items: [],
  page: 1,
  pageSize: 25,
  total: 0,
};

const initialRbacState: RbacState = {
  tenant: null,
  users: [],
  invitations: [],
  roles: [],
  selectedRole: null,
  permissions: [],
  permissionGroups: [],
  auditPage: emptyAuditPage,
  usersFilter: 'all',
  auditFilter: { page: 1, pageSize: 25 },
  tenantStatus: 'idle',
  usersStatus: 'idle',
  invitationsStatus: 'idle',
  rolesStatus: 'idle',
  permissionsStatus: 'idle',
  auditStatus: 'idle',
  mutationStatus: 'idle',
  error: null,
};

export const RbacSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialRbacState),
  withComputed(({ users, invitations, roles, permissions, permissionGroups, auditPage, tenantStatus, usersStatus, invitationsStatus, rolesStatus, permissionsStatus, auditStatus }) => ({
    activeUsers: computed(() => users().filter((user) => user.isActive)),
    disabledUsers: computed(() => users().filter((user) => !user.isActive)),
    pendingInvitations: computed(() => invitations().filter((invitation) => invitation.onboardingEligible)),
    pendingInvitationCount: computed(() => invitations().filter((invitation) => invitation.onboardingEligible).length),
    roleOptions: computed(() => roles().map((role) => ({ label: role.name, value: role.id }))),
    permissionMatrix: computed(() =>
      roles().map((role) => ({
        role,
        permissionIds: new Set(role.permissions.map((permission) => permission.id)),
      })),
    ),
    auditEvents: computed(() => auditPage().items),
    hasPermissions: computed(() => permissions().length > 0 || permissionGroups().length > 0),
    isLoading: computed(
      () =>
        tenantStatus() === 'loading' ||
        usersStatus() === 'loading' ||
        invitationsStatus() === 'loading' ||
        rolesStatus() === 'loading' ||
        permissionsStatus() === 'loading' ||
        auditStatus() === 'loading',
    ),
  })),
  withMethods(
    (
      store,
      tenantService = inject(TenantService),
      userService = inject(UserService),
      roleService = inject(RoleService),
      auditService = inject(AuditService),
    ) => ({
      async loadTenant(): Promise<void> {
        patchState(store, { tenantStatus: 'loading', error: null });

        try {
          patchState(store, {
            tenant: await firstValueFrom(tenantService.current()),
            tenantStatus: 'loaded',
          });
        } catch (error) {
          patchFailure(store, { tenantStatus: 'failed' }, error);
        }
      },

      async loadUsers(state: 'active' | 'disabled' | 'all' = store.usersFilter()): Promise<void> {
        patchState(store, { usersStatus: 'loading', usersFilter: state, error: null });

        try {
          patchState(store, {
            users: await firstValueFrom(userService.list({ state })),
            usersStatus: 'loaded',
          });
        } catch (error) {
          patchFailure(store, { usersStatus: 'failed' }, error);
        }
      },

      async loadInvitations(): Promise<void> {
        patchState(store, { invitationsStatus: 'loading', error: null });

        try {
          patchState(store, {
            invitations: await firstValueFrom(userService.listInvitations()),
            invitationsStatus: 'loaded',
          });
        } catch (error) {
          patchFailure(store, { invitationsStatus: 'failed' }, error);
        }
      },

      async loadRoles(): Promise<void> {
        patchState(store, { rolesStatus: 'loading', error: null });

        try {
          patchState(store, { roles: await firstValueFrom(roleService.list()), rolesStatus: 'loaded' });
        } catch (error) {
          patchFailure(store, { rolesStatus: 'failed' }, error);
        }
      },

      async loadRoleDetail(roleId: string): Promise<void> {
        patchState(store, { rolesStatus: 'loading', error: null });

        try {
          patchState(store, {
            selectedRole: await firstValueFrom(roleService.detail(roleId)),
            rolesStatus: 'loaded',
          });
        } catch (error) {
          patchFailure(store, { rolesStatus: 'failed' }, error);
        }
      },

      async loadPermissions(): Promise<void> {
        patchState(store, { permissionsStatus: 'loading', error: null });

        try {
          const catalog = await firstValueFrom(roleService.listPermissions());
          patchState(store, {
            permissions: catalog.permissions,
            permissionGroups: catalog.groups,
            permissionsStatus: 'loaded',
          });
        } catch (error) {
          patchFailure(store, { permissionsStatus: 'failed' }, error);
        }
      },

      async loadAudit(filter: AuditQueryParams = store.auditFilter()): Promise<void> {
        patchState(store, { auditStatus: 'loading', auditFilter: filter, error: null });

        try {
          patchState(store, {
            auditPage: await firstValueFrom(auditService.list(filter)),
            auditStatus: 'loaded',
          });
        } catch (error) {
          patchFailure(store, { auditStatus: 'failed' }, error);
        }
      },

      async loadWorkspace(): Promise<void> {
        await Promise.all([
          this.loadTenant(),
          this.loadUsers(),
          this.loadInvitations(),
          this.loadRoles(),
          this.loadPermissions(),
          this.loadAudit(),
        ]);
      },

      async createUser(request: CreateUserRequest): Promise<void> {
        await runMutation(store, async () => {
          const user = await firstValueFrom(userService.create(request));
          patchState(store, { users: upsertById(store.users(), user) });
        });
      },

      async updateUser(userId: string, request: UpdateUserRequest): Promise<void> {
        await runMutation(store, async () => {
          const user = await firstValueFrom(userService.update(userId, request));
          patchState(store, { users: upsertById(store.users(), user) });
        });
      },

      async disableUser(userId: string): Promise<void> {
        await runMutation(store, async () => {
          const user = await firstValueFrom(userService.disable(userId));
          patchState(store, { users: upsertById(store.users(), user) });
        });
      },

      async enableUser(userId: string): Promise<void> {
        await runMutation(store, async () => {
          const user = await firstValueFrom(userService.enable(userId));
          patchState(store, { users: upsertById(store.users(), user) });
        });
      },

      async initiateReset(userId: string): Promise<void> {
        await runMutation(store, () => firstValueFrom(userService.initiateReset(userId)));
      },

      async inviteUser(request: CreateInvitationRequest): Promise<void> {
        await runMutation(store, async () => {
          const invitation = await firstValueFrom(userService.invite(request));
          patchState(store, { invitations: upsertById(store.invitations(), invitation) });
        });
      },

      async revokeInvitation(invitationId: string): Promise<void> {
        await runMutation(store, async () => {
          const invitation = await firstValueFrom(userService.revokeInvitation(invitationId));
          patchState(store, { invitations: upsertById(store.invitations(), invitation) });
        });
      },

      async resendInvitation(invitationId: string): Promise<void> {
        await runMutation(store, async () => {
          const invitation = await firstValueFrom(userService.resendInvitation(invitationId));
          patchState(store, { invitations: upsertById(store.invitations(), invitation) });
        });
      },

      async createRole(request: CreateRoleRequest): Promise<void> {
        await runMutation(store, async () => {
          const role = await firstValueFrom(roleService.create(request));
          patchState(store, { roles: upsertById(store.roles(), role) });
        });
      },

      async updateRole(roleId: string, request: UpdateRoleRequest): Promise<void> {
        await runMutation(store, async () => {
          const role = await firstValueFrom(roleService.update(roleId, request));
          patchState(store, { roles: upsertById(store.roles(), role) });
        });
      },

      async deleteRole(roleId: string): Promise<void> {
        await runMutation(store, async () => {
          await firstValueFrom(roleService.delete(roleId));
          patchState(store, { roles: store.roles().filter((role) => role.id !== roleId) });
        });
      },

      async createPermission(request: CreatePermissionRequest): Promise<void> {
        await runMutation(store, async () => {
          await firstValueFrom(roleService.createPermission(request));
          await this.loadPermissions();
        });
      },

      async updatePermission(permissionId: string, request: UpdatePermissionRequest): Promise<void> {
        await runMutation(store, async () => {
          await firstValueFrom(roleService.updatePermission(permissionId, request));
          await this.loadPermissions();
        });
      },

      async deletePermission(permissionId: string): Promise<void> {
        await runMutation(store, async () => {
          await firstValueFrom(roleService.deletePermission(permissionId));
          await this.loadPermissions();
        });
      },

      async assignPermission(roleId: string, permissionId: string): Promise<void> {
        await runMutation(store, async () => {
          await firstValueFrom(roleService.assignPermission(roleId, permissionId));
          await this.loadRoles();
        });
      },

      async removePermission(roleId: string, permissionId: string): Promise<void> {
        await runMutation(store, async () => {
          await firstValueFrom(roleService.removePermission(roleId, permissionId));
          await this.loadRoles();
        });
      },
    }),
  ),
);

function upsertById<T extends { id: string }>(items: readonly T[], item: T): readonly T[] {
  return items.some((existing) => existing.id === item.id)
    ? items.map((existing) => (existing.id === item.id ? item : existing))
    : [...items, item];
}

async function runMutation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: any,
  work: () => Promise<unknown>,
): Promise<void> {
  patchState(store, { mutationStatus: 'saving', error: null });

  try {
    await work();
    patchState(store, { mutationStatus: 'idle' });
  } catch (error) {
    patchState(store, { mutationStatus: 'failed', error: describeRbacError(error) });
  }
}

function patchFailure(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  store: any,
  state: Partial<RbacState>,
  error: unknown,
): void {
  patchState(store, { ...state, error: describeRbacError(error) });
}

function describeRbacError(error: unknown): string {
  if (isHttpErrorLike(error) && error.status === 401) {
    return 'rbac.errors.unauthorized';
  }

  if (isHttpErrorLike(error) && error.status === 403) {
    return 'rbac.errors.forbidden';
  }

  if (isHttpErrorLike(error) && error.status === 400) {
    return 'rbac.errors.validation';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'rbac.errors.requestFailed';
}

function isHttpErrorLike(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  );
}
