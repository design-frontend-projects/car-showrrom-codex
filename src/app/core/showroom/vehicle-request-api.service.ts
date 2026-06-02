import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  AdminRequestResult,
  VehicleRequestDto,
  VehicleRequestInputDto,
  VehicleRequestStatus,
} from './showroom.models';

@Injectable({ providedIn: 'root' })
export class VehicleRequestApiService {
  private readonly api = inject(ApiService);

  create(input: VehicleRequestInputDto): Observable<VehicleRequestDto> {
    return this.api.post<VehicleRequestDto>('/showroom/client/requests', input);
  }

  listMine(): Observable<VehicleRequestDto[]> {
    return this.api.get<VehicleRequestDto[]>('/showroom/client/requests');
  }

  listAdmin(params: { status?: VehicleRequestStatus; page?: number; pageSize?: number }): Observable<AdminRequestResult> {
    return this.api.get<AdminRequestResult>('/showroom/admin/requests', params);
  }

  review(requestId: string, input: { status: Extract<VehicleRequestStatus, 'APPROVED' | 'REJECTED'>; decisionNote?: string | null }): Observable<VehicleRequestDto> {
    return this.api.post<VehicleRequestDto>(`/showroom/admin/requests/${requestId}/review`, input);
  }
}
