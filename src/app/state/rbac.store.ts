import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import {
  CreatePermissionRequest,
  CreateRoleRequest,
  CreateUserRequest,
  RbacPermission,
  RbacRole,
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

export interface RbacState {
  tenant: Tenant | null;
  tenantStatus: RbacStatus;
  tenantError: string | null;
  users: readonly RbacUser[];
  usersStatus: RbacStatus;
  usersError: string | null;
  roles: readonly RbacRole[];
  rolesStatus: RbacStatus;
  rolesError: string | null;
  permissions: readonly RbacPermission[];
  permissionsStatus: RbacStatus;
  permissionsError: string | null;
}

const initialRbacState: RbacState = {
  tenant: null,
  tenantStatus: 'idle',
  tenantError: null,
  users: [],
  usersStatus: 'idle',
  usersError: null,
  roles: [],
  rolesStatus: 'idle',
  rolesError: null,
  permissions: [],
  permissionsStatus: 'idle',
  permissionsError: null,
};

export const RbacSignalStore = signalStore(
  { providedIn: 'root' },
  withState(initialRbacState),
  withComputed(({ tenantStatus, usersStatus, rolesStatus, permissionsStatus }) => ({
    isLoading: computed(
      () =>
        tenantStatus() === 'loading' ||
        usersStatus() === 'loading' ||
        rolesStatus() === 'loading' ||
        permissionsStatus() === 'loading',
    ),
  })),
  withMethods(
    (
      store,
      tenantService = inject(TenantService),
      userService = inject(UserService),
      roleService = inject(RoleService),
    ) => ({
      async loadTenant(): Promise<void> {
        patchState(store, { tenantStatus: 'loading', tenantError: null });

        try {
          const tenant = await firstValueFrom(tenantService.current());
          patchState(store, { tenant, tenantStatus: 'loaded', tenantError: null });
        } catch (error) {
          patchState(store, { tenantStatus: 'failed', tenantError: describeRbacError(error) });
        }
      },

      async loadUsers(): Promise<void> {
        patchState(store, { usersStatus: 'loading', usersError: null });

        try {
          const users = await firstValueFrom(userService.list());
          patchState(store, { users, usersStatus: 'loaded', usersError: null });
        } catch (error) {
          patchState(store, { usersStatus: 'failed', usersError: describeRbacError(error) });
        }
      },

      async createUser(request: CreateUserRequest): Promise<void> {
        patchState(store, { usersStatus: 'loading', usersError: null });

        try {
          const user = await firstValueFrom(userService.create(request));
          patchState(store, {
            users: [...store.users(), user],
            usersStatus: 'loaded',
            usersError: null,
          });
        } catch (error) {
          patchState(store, { usersStatus: 'failed', usersError: describeRbacError(error) });
        }
      },

      async updateUser(userId: string, request: UpdateUserRequest): Promise<void> {
        patchState(store, { usersStatus: 'loading', usersError: null });

        try {
          const user = await firstValueFrom(userService.update(userId, request));
          patchState(store, {
            users: store.users().map((existing) => (existing.id === user.id ? user : existing)),
            usersStatus: 'loaded',
            usersError: null,
          });
        } catch (error) {
          patchState(store, { usersStatus: 'failed', usersError: describeRbacError(error) });
        }
      },

      async deleteUser(userId: string): Promise<void> {
        patchState(store, { usersStatus: 'loading', usersError: null });

        try {
          await firstValueFrom(userService.delete(userId));
          patchState(store, {
            users: store.users().filter((user) => user.id !== userId),
            usersStatus: 'loaded',
            usersError: null,
          });
        } catch (error) {
          patchState(store, { usersStatus: 'failed', usersError: describeRbacError(error) });
        }
      },

      async loadRoles(): Promise<void> {
        patchState(store, { rolesStatus: 'loading', rolesError: null });

        try {
          const roles = await firstValueFrom(roleService.list());
          patchState(store, { roles, rolesStatus: 'loaded', rolesError: null });
        } catch (error) {
          patchState(store, { rolesStatus: 'failed', rolesError: describeRbacError(error) });
        }
      },

      async initializeDefaultRoles(): Promise<void> {
        patchState(store, { rolesStatus: 'loading', rolesError: null });

        try {
          const roles = await firstValueFrom(roleService.initializeDefaults());
          patchState(store, { roles, rolesStatus: 'loaded', rolesError: null });
        } catch (error) {
          patchState(store, { rolesStatus: 'failed', rolesError: describeRbacError(error) });
        }
      },

      async createRole(request: CreateRoleRequest): Promise<void> {
        patchState(store, { rolesStatus: 'loading', rolesError: null });

        try {
          const role = await firstValueFrom(roleService.create(request));
          patchState(store, {
            roles: [...store.roles(), role],
            rolesStatus: 'loaded',
            rolesError: null,
          });
        } catch (error) {
          patchState(store, { rolesStatus: 'failed', rolesError: describeRbacError(error) });
        }
      },

      async updateRole(roleId: string, request: UpdateRoleRequest): Promise<void> {
        patchState(store, { rolesStatus: 'loading', rolesError: null });

        try {
          const role = await firstValueFrom(roleService.update(roleId, request));
          patchState(store, {
            roles: store.roles().map((existing) => (existing.id === role.id ? role : existing)),
            rolesStatus: 'loaded',
            rolesError: null,
          });
        } catch (error) {
          patchState(store, { rolesStatus: 'failed', rolesError: describeRbacError(error) });
        }
      },

      async deleteRole(roleId: string): Promise<void> {
        patchState(store, { rolesStatus: 'loading', rolesError: null });

        try {
          await firstValueFrom(roleService.delete(roleId));
          patchState(store, {
            roles: store.roles().filter((role) => role.id !== roleId),
            rolesStatus: 'loaded',
            rolesError: null,
          });
        } catch (error) {
          patchState(store, { rolesStatus: 'failed', rolesError: describeRbacError(error) });
        }
      },

      async assignPermission(roleId: string, permissionId: string): Promise<void> {
        patchState(store, { rolesStatus: 'loading', rolesError: null });

        try {
          await firstValueFrom(roleService.assignPermission(roleId, permissionId));
          const roles = await firstValueFrom(roleService.list());
          patchState(store, { roles, rolesStatus: 'loaded', rolesError: null });
        } catch (error) {
          patchState(store, { rolesStatus: 'failed', rolesError: describeRbacError(error) });
        }
      },

      async removePermission(roleId: string, permissionId: string): Promise<void> {
        patchState(store, { rolesStatus: 'loading', rolesError: null });

        try {
          await firstValueFrom(roleService.removePermission(roleId, permissionId));
          const roles = await firstValueFrom(roleService.list());
          patchState(store, { roles, rolesStatus: 'loaded', rolesError: null });
        } catch (error) {
          patchState(store, { rolesStatus: 'failed', rolesError: describeRbacError(error) });
        }
      },

      async loadPermissions(): Promise<void> {
        patchState(store, { permissionsStatus: 'loading', permissionsError: null });

        try {
          const permissions = await firstValueFrom(roleService.listPermissions());
          patchState(store, { permissions, permissionsStatus: 'loaded', permissionsError: null });
        } catch (error) {
          patchState(store, {
            permissionsStatus: 'failed',
            permissionsError: describeRbacError(error),
          });
        }
      },

      async createPermission(request: CreatePermissionRequest): Promise<void> {
        patchState(store, { permissionsStatus: 'loading', permissionsError: null });

        try {
          const permission = await firstValueFrom(roleService.createPermission(request));
          patchState(store, {
            permissions: [...store.permissions(), permission],
            permissionsStatus: 'loaded',
            permissionsError: null,
          });
        } catch (error) {
          patchState(store, {
            permissionsStatus: 'failed',
            permissionsError: describeRbacError(error),
          });
        }
      },

      async updatePermission(
        permissionId: string,
        request: UpdatePermissionRequest,
      ): Promise<void> {
        patchState(store, { permissionsStatus: 'loading', permissionsError: null });

        try {
          const permission = await firstValueFrom(
            roleService.updatePermission(permissionId, request),
          );
          patchState(store, {
            permissions: store
              .permissions()
              .map((existing) => (existing.id === permission.id ? permission : existing)),
            permissionsStatus: 'loaded',
            permissionsError: null,
          });
        } catch (error) {
          patchState(store, {
            permissionsStatus: 'failed',
            permissionsError: describeRbacError(error),
          });
        }
      },

      async deletePermission(permissionId: string): Promise<void> {
        patchState(store, { permissionsStatus: 'loading', permissionsError: null });

        try {
          await firstValueFrom(roleService.deletePermission(permissionId));
          patchState(store, {
            permissions: store.permissions().filter((permission) => permission.id !== permissionId),
            permissionsStatus: 'loaded',
            permissionsError: null,
          });
        } catch (error) {
          patchState(store, {
            permissionsStatus: 'failed',
            permissionsError: describeRbacError(error),
          });
        }
      },
    }),
  ),
);

function describeRbacError(error: unknown): string {
  if (isHttpErrorLike(error) && error.status === 403) {
    return 'You do not have permission to manage this tenant RBAC data.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'RBAC request failed.';
}

function isHttpErrorLike(error: unknown): error is { status: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
  );
}
