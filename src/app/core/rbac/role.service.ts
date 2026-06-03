import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  CreatePermissionRequest,
  CreateRoleRequest,
  RbacPermissionCatalog,
  RbacPermission,
  RbacRole,
  RbacRoleDetail,
  UpdatePermissionRequest,
  UpdateRoleRequest,
} from './rbac.models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  constructor(private readonly api: ApiService) {}

  list(): Observable<readonly RbacRole[]> {
    return this.api.get<readonly RbacRole[]>('/admin/rbac/roles');
  }

  detail(roleId: string): Observable<RbacRoleDetail> {
    return this.api.get<RbacRoleDetail>(`/admin/rbac/roles/${roleId}`);
  }

  create(request: CreateRoleRequest): Observable<RbacRole> {
    return this.api.post<RbacRole>('/admin/rbac/roles', request);
  }

  update(roleId: string, request: UpdateRoleRequest): Observable<RbacRole> {
    return this.api.patch<RbacRole>(`/admin/rbac/roles/${roleId}`, request);
  }

  delete(roleId: string): Observable<void> {
    return this.api.delete<void>(`/admin/rbac/roles/${roleId}`);
  }

  listPermissions(): Observable<RbacPermissionCatalog> {
    return this.api.get<RbacPermissionCatalog>('/admin/rbac/permissions');
  }

  createPermission(request: CreatePermissionRequest): Observable<RbacPermission> {
    return this.api.post<RbacPermission>('/admin/rbac/permissions', request);
  }

  updatePermission(
    permissionId: string,
    request: UpdatePermissionRequest,
  ): Observable<RbacPermission> {
    return this.api.patch<RbacPermission>(`/admin/rbac/permissions/${permissionId}`, request);
  }

  deletePermission(permissionId: string): Observable<void> {
    return this.api.delete<void>(`/admin/rbac/permissions/${permissionId}`);
  }

  assignPermission(roleId: string, permissionId: string): Observable<void> {
    return this.api.post<void>(`/admin/rbac/roles/${roleId}/permissions/${permissionId}`, {});
  }

  removePermission(roleId: string, permissionId: string): Observable<void> {
    return this.api.delete<void>(`/admin/rbac/roles/${roleId}/permissions/${permissionId}`);
  }
}
