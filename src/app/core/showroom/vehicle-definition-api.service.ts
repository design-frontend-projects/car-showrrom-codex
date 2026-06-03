import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  AdminUserRolesDto,
  UsersRolesQueryParams,
  VehicleDefinitionEntity,
  VehicleDefinitionInputDto,
  VehicleDefinitionListResult,
  VehicleDefinitionQueryParams,
  VehicleDefinitionRecord,
  VehicleOptionEntity,
  VehicleOptionQueryParams,
  VehicleOptionResult,
} from './showroom.models';

@Injectable({ providedIn: 'root' })
export class VehicleDefinitionApiService {
  private readonly api = inject(ApiService);

  list(entity: VehicleDefinitionEntity, params: VehicleDefinitionQueryParams = {}): Observable<VehicleDefinitionListResult> {
    return this.api.get<VehicleDefinitionListResult>(`/showroom/admin/definitions/${entity}`, toParams(params));
  }

  options<T extends { id: string; name: string }>(
    entity: VehicleOptionEntity,
    params: VehicleOptionQueryParams = {},
  ): Observable<VehicleOptionResult<T>> {
    return this.api.get<VehicleOptionResult<T>>(`/showroom/options/${entity}`, toParams(params));
  }

  create(entity: VehicleDefinitionEntity, input: VehicleDefinitionInputDto): Observable<VehicleDefinitionRecord> {
    return this.api.post<VehicleDefinitionRecord>(`/showroom/admin/definitions/${entity}`, input);
  }

  update(entity: VehicleDefinitionEntity, id: string, input: VehicleDefinitionInputDto): Observable<VehicleDefinitionRecord> {
    return this.api.patch<VehicleDefinitionRecord>(`/showroom/admin/definitions/${entity}/${id}`, input);
  }

  deactivate(entity: VehicleDefinitionEntity, id: string): Observable<void> {
    return this.api.delete<void>(`/showroom/admin/definitions/${entity}/${id}`);
  }

  usersRoles(params: UsersRolesQueryParams = {}): Observable<AdminUserRolesDto[]> {
    return this.api.get<AdminUserRolesDto[]>('/showroom/admin/users-roles', toParams(params));
  }
}

function toParams(params: object): HttpParams {
  return Object.entries(params).reduce((httpParams, [key, value]) => {
    return value === undefined || value === null || value === ''
      ? httpParams
      : httpParams.set(key, String(value));
  }, new HttpParams());
}
