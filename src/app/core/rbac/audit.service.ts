import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { AuditQueryParams, RbacAuditEvent, RbacPage, toQueryParams } from './rbac.models';

@Injectable({ providedIn: 'root' })
export class AuditService {
  constructor(private readonly api: ApiService) {}

  list(params: AuditQueryParams = {}): Observable<RbacPage<RbacAuditEvent>> {
    const queryParams = toQueryParams(params);

    return queryParams
      ? this.api.get<RbacPage<RbacAuditEvent>>('/admin/rbac/audit', queryParams)
      : this.api.get<RbacPage<RbacAuditEvent>>('/admin/rbac/audit');
  }
}
