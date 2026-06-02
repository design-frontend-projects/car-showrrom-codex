import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  CreatePermissionRequest,
  CreateRoleRequest,
  RbacListParams,
  RbacPermission,
  RbacRole,
  toRbacQueryParams,
  UpdatePermissionRequest,
  UpdateRoleRequest,
} from './rbac.models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private readonly api: ApiService) {}

  list(params?: RbacListParams): Observable<readonly RbacRole[]> {
    const queryParams = toRbacQueryParams(params);

    return queryParams
      ? this.api.get<readonly RbacRole[]>('/rbac/roles', queryParams)
      : this.api.get<readonly RbacRole[]>('/rbac/roles');
  }

  initializeDefaults(): Observable<readonly RbacRole[]> {
    return this.api.post<readonly RbacRole[]>('/rbac/roles/defaults', {});
  }

  create(request: CreateRoleRequest): Observable<RbacRole> {
    return this.api.post<RbacRole>('/rbac/roles', request);
  }

  update(roleId: string, request: UpdateRoleRequest): Observable<RbacRole> {
    return this.api.patch<RbacRole>(`/rbac/roles/${roleId}`, request);
  }

  delete(roleId: string): Observable<void> {
    return this.api.delete<void>(`/rbac/roles/${roleId}`);
  }

  listPermissions(params?: RbacListParams): Observable<readonly RbacPermission[]> {
    const queryParams = toRbacQueryParams(params);

    return queryParams
      ? this.api.get<readonly RbacPermission[]>('/rbac/permissions', queryParams)
      : this.api.get<readonly RbacPermission[]>('/rbac/permissions');
  }

  createPermission(request: CreatePermissionRequest): Observable<RbacPermission> {
    return this.api.post<RbacPermission>('/rbac/permissions', request);
  }

  updatePermission(
    permissionId: string,
    request: UpdatePermissionRequest,
  ): Observable<RbacPermission> {
    return this.api.patch<RbacPermission>(`/rbac/permissions/${permissionId}`, request);
  }

  deletePermission(permissionId: string): Observable<void> {
    return this.api.delete<void>(`/rbac/permissions/${permissionId}`);
  }

  assignPermission(roleId: string, permissionId: string): Observable<void> {
    return this.api.post<void>(`/rbac/roles/${roleId}/permissions/${permissionId}`, {});
  }

  removePermission(roleId: string, permissionId: string): Observable<void> {
    return this.api.delete<void>(`/rbac/roles/${roleId}/permissions/${permissionId}`);
  }
}
