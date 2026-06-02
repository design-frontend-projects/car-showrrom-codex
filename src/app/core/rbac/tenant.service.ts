import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Tenant } from './rbac.models';

@Injectable({ providedIn: 'root' })
export class TenantService {
  constructor(private readonly api: ApiService) {}

  current(): Observable<Tenant> {
    return this.api.get<Tenant>('/rbac/tenant');
  }
}
