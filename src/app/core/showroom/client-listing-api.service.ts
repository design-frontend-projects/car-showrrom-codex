import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../http/api.service';
import {
  CarListingStatus,
  ClientListingsDto,
  ListingDetailDto,
  ListingImageDto,
  ListingInputDto,
} from './showroom.models';

@Injectable({ providedIn: 'root' })
export class ClientListingApiService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  listMine(): Observable<ClientListingsDto> {
    return this.api.get<ClientListingsDto>('/showroom/client/listings');
  }

  create(input: ListingInputDto): Observable<ListingDetailDto> {
    return this.api.post<ListingDetailDto>('/showroom/client/listings', input);
  }

  update(listingId: string, input: Partial<ListingInputDto>): Observable<ListingDetailDto> {
    return this.api.patch<ListingDetailDto>(`/showroom/client/listings/${listingId}`, input);
  }

  changeStatus(listingId: string, status: CarListingStatus): Observable<ListingDetailDto> {
    return this.api.post<ListingDetailDto>(`/showroom/client/listings/${listingId}/status`, { status });
  }

  delete(listingId: string): Observable<void> {
    return this.api.delete<void>(`/showroom/client/listings/${listingId}`);
  }

  uploadImage(listingId: string, file: File, metadata: { altText?: string; isPrimary?: boolean }): Observable<ListingImageDto> {
    const body = new FormData();
    body.set('image', file);

    if (metadata.altText) {
      body.set('altText', metadata.altText);
    }

    if (metadata.isPrimary !== undefined) {
      body.set('isPrimary', String(metadata.isPrimary));
    }

    return this.http.post<ListingImageDto>(`${baseUrl()}/showroom/client/listings/${listingId}/images`, body, {
      withCredentials: true,
    });
  }

  reorderImages(listingId: string, imageIds: string[]): Observable<ListingImageDto[]> {
    return this.api.patch<ListingImageDto[]>(`/showroom/client/listings/${listingId}/images/order`, { imageIds });
  }

  setPrimaryImage(listingId: string, imageId: string): Observable<ListingImageDto[]> {
    return this.api.post<ListingImageDto[]>(`/showroom/client/listings/${listingId}/images/${imageId}/primary`, {});
  }

  deleteImage(listingId: string, imageId: string): Observable<void> {
    return this.api.delete<void>(`/showroom/client/listings/${listingId}/images/${imageId}`);
  }
}

function baseUrl(): string {
  return environment.apiBaseUrl.replace(/\/$/, '');
}
