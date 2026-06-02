import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  CreateUserRequest,
  RbacListParams,
  RbacUser,
  toRbacQueryParams,
  UpdateUserRequest,
} from './rbac.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly api: ApiService) {}

  list(params?: RbacListParams): Observable<readonly RbacUser[]> {
    const queryParams = toRbacQueryParams(params);

    return queryParams
      ? this.api.get<readonly RbacUser[]>('/rbac/users', queryParams)
      : this.api.get<readonly RbacUser[]>('/rbac/users');
  }

  create(request: CreateUserRequest): Observable<RbacUser> {
    return this.api.post<RbacUser>('/rbac/users', request);
  }

  update(userId: string, request: UpdateUserRequest): Observable<RbacUser> {
    return this.api.patch<RbacUser>(`/rbac/users/${userId}`, request);
  }

  delete(userId: string): Observable<void> {
    return this.api.delete<void>(`/rbac/users/${userId}`);
  }

  assignRole(userId: string, roleId: string): Observable<void> {
    return this.api.post<void>(`/rbac/users/${userId}/roles/${roleId}`, {});
  }

  removeRole(userId: string, roleId: string): Observable<void> {
    return this.api.delete<void>(`/rbac/users/${userId}/roles/${roleId}`);
  }
}
