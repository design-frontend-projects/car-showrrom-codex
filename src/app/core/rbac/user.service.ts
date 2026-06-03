import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  CreateUserRequest,
  CreateInvitationRequest,
  RbacInvitation,
  RbacListParams,
  RbacUser,
  toQueryParams,
  UpdateUserRequest,
} from './rbac.models';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly api: ApiService) {}

  list(params?: RbacListParams): Observable<readonly RbacUser[]> {
    const queryParams = toQueryParams(params);

    return queryParams
      ? this.api.get<readonly RbacUser[]>('/admin/rbac/users', queryParams)
      : this.api.get<readonly RbacUser[]>('/admin/rbac/users');
  }

  create(request: CreateUserRequest): Observable<RbacUser> {
    return this.api.post<RbacUser>('/admin/rbac/users', request);
  }

  update(userId: string, request: UpdateUserRequest): Observable<RbacUser> {
    return this.api.patch<RbacUser>(`/admin/rbac/users/${userId}`, request);
  }

  disable(userId: string): Observable<RbacUser> {
    return this.api.post<RbacUser>(`/admin/rbac/users/${userId}/disable`, {});
  }

  enable(userId: string): Observable<RbacUser> {
    return this.api.post<RbacUser>(`/admin/rbac/users/${userId}/enable`, {});
  }

  initiateReset(userId: string): Observable<{ ok: true; delivery: string }> {
    return this.api.post<{ ok: true; delivery: string }>(`/admin/rbac/users/${userId}/reset`, {});
  }

  assignRole(userId: string, roleId: string): Observable<void> {
    return this.api.post<void>(`/admin/rbac/users/${userId}/roles/${roleId}`, {});
  }

  removeRole(userId: string, roleId: string): Observable<void> {
    return this.api.delete<void>(`/admin/rbac/users/${userId}/roles/${roleId}`);
  }

  listInvitations(): Observable<readonly RbacInvitation[]> {
    return this.api.get<readonly RbacInvitation[]>('/admin/rbac/invitations');
  }

  invite(request: CreateInvitationRequest): Observable<RbacInvitation> {
    return this.api.post<RbacInvitation>('/admin/rbac/invitations', request);
  }

  revokeInvitation(invitationId: string): Observable<RbacInvitation> {
    return this.api.post<RbacInvitation>(`/admin/rbac/invitations/${invitationId}/revoke`, {});
  }

  resendInvitation(invitationId: string): Observable<RbacInvitation> {
    return this.api.post<RbacInvitation>(`/admin/rbac/invitations/${invitationId}/resend`, {});
  }
}
