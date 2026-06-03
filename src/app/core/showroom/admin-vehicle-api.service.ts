import { HttpClient, HttpEvent, HttpParams, HttpRequest } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../http/api.service';
import {
  AdminVehicleInputDto,
  AdminVehicleListParams,
  AdminVehicleListResult,
  CarListingStatus,
  ListingDetailDto,
  ListingImageDto,
  VehicleOptionEntity,
  VehicleOptionQueryParams,
  VehicleOptionResult,
} from './showroom.models';

@Injectable({ providedIn: 'root' })
export class AdminVehicleApiService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  list(params: AdminVehicleListParams = {}): Observable<AdminVehicleListResult> {
    return this.api.get<AdminVehicleListResult>('/showroom/admin/vehicles', toParams(params));
  }

  options<T extends { id: string; name: string }>(
    entity: VehicleOptionEntity,
    params: VehicleOptionQueryParams = {},
  ): Observable<VehicleOptionResult<T>> {
    return this.api.get<VehicleOptionResult<T>>(`/showroom/options/${entity}`, toParams(params));
  }

  detail(listingId: string): Observable<ListingDetailDto> {
    return this.api.get<ListingDetailDto>(`/showroom/admin/vehicles/${listingId}`);
  }

  create(input: AdminVehicleInputDto): Observable<ListingDetailDto> {
    return this.api.post<ListingDetailDto>('/showroom/admin/vehicles', input);
  }

  update(listingId: string, input: Partial<AdminVehicleInputDto>): Observable<ListingDetailDto> {
    return this.api.patch<ListingDetailDto>(`/showroom/admin/vehicles/${listingId}`, input);
  }

  changeStatus(listingId: string, status: CarListingStatus): Observable<ListingDetailDto> {
    return this.api.post<ListingDetailDto>(`/showroom/admin/vehicles/${listingId}/status`, { status });
  }

  delete(listingId: string): Observable<void> {
    return this.api.delete<void>(`/showroom/admin/vehicles/${listingId}`);
  }

  uploadImage(
    listingId: string,
    file: File,
    metadata: { altText?: string; isPrimary?: boolean },
  ): Observable<HttpEvent<ListingImageDto>> {
    const body = new FormData();
    body.set('image', file);

    if (metadata.altText) {
      body.set('altText', metadata.altText);
    }

    if (metadata.isPrimary !== undefined) {
      body.set('isPrimary', String(metadata.isPrimary));
    }

    return this.http.request(
      new HttpRequest('POST', `${baseUrl()}/showroom/admin/vehicles/${listingId}/images`, body, {
        reportProgress: true,
        withCredentials: true,
      }),
    );
  }

  reorderImages(listingId: string, imageIds: string[]): Observable<ListingImageDto[]> {
    return this.api.patch<ListingImageDto[]>(`/showroom/admin/vehicles/${listingId}/images/order`, { imageIds });
  }

  setPrimaryImage(listingId: string, imageId: string): Observable<ListingImageDto[]> {
    return this.api.post<ListingImageDto[]>(`/showroom/admin/vehicles/${listingId}/images/${imageId}/primary`, {});
  }

  deleteImage(listingId: string, imageId: string): Observable<void> {
    return this.api.delete<void>(`/showroom/admin/vehicles/${listingId}/images/${imageId}`);
  }
}

function toParams(params: AdminVehicleListParams): HttpParams {
  return Object.entries(params).reduce((httpParams, [key, value]) => {
    return value === undefined || value === null || value === ''
      ? httpParams
      : httpParams.set(key, String(value));
  }, new HttpParams());
}

function baseUrl(): string {
  return environment.apiBaseUrl.replace(/\/$/, '');
}
