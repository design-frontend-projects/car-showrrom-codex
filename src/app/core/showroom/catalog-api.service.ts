import { HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import {
  ListingDetailDto,
  ListingSearchParams,
  ListingSearchResult,
  ShowroomMake,
  ShowroomModel,
  ShowroomTaxonomy,
  ShowroomVariant,
} from './showroom.models';

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
  private readonly api = inject(ApiService);

  taxonomy(): Observable<ShowroomTaxonomy> {
    return this.api.get<ShowroomTaxonomy>('/showroom/taxonomy');
  }

  makes(): Observable<ShowroomMake[]> {
    return this.api.get<ShowroomMake[]>('/showroom/makes');
  }

  models(makeId?: string): Observable<ShowroomModel[]> {
    return this.api.get<ShowroomModel[]>('/showroom/models', makeId ? { makeId } : {});
  }

  variants(modelId?: string): Observable<ShowroomVariant[]> {
    return this.api.get<ShowroomVariant[]>('/showroom/variants', modelId ? { modelId } : {});
  }

  search(params: ListingSearchParams): Observable<ListingSearchResult> {
    return this.api.get<ListingSearchResult>('/showroom/listings', toParams(params));
  }

  detail(listingId: string): Observable<ListingDetailDto> {
    return this.api.get<ListingDetailDto>(`/showroom/listings/${listingId}`);
  }
}

function toParams(params: ListingSearchParams): HttpParams {
  return Object.entries(params).reduce((httpParams, [key, value]) => {
    return value === undefined || value === null || value === ''
      ? httpParams
      : httpParams.set(key, String(value));
  }, new HttpParams());
}
