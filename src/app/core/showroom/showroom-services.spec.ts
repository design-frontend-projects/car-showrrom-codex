import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { ApiService } from '../http/api.service';
import { CatalogApiService } from './catalog-api.service';
import { ClientListingApiService } from './client-listing-api.service';
import { VehicleRequestApiService } from './vehicle-request-api.service';

describe('showroom Angular services', () => {
  function apiMock(): ApiService {
    return {
      get: vi.fn(() => of({})),
      post: vi.fn(() => of({})),
      patch: vi.fn(() => of({})),
      put: vi.fn(() => of({})),
      delete: vi.fn(() => of(undefined)),
    } as unknown as ApiService;
  }

  it('builds catalog search query params without server-only imports', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const service = TestBed.inject(CatalogApiService);

    service.search({ q: 'bmw', page: 2, minPrice: 10000 }).subscribe();

    const params = vi.mocked(api.get).mock.calls[0]?.[1] as HttpParams;
    expect(vi.mocked(api.get).mock.calls[0]?.[0]).toBe('/showroom/listings');
    expect(params.get('q')).toBe('bmw');
    expect(params.get('page')).toBe('2');
    expect(params.get('minPrice')).toBe('10000');
  });

  it('uses client listing status and image ordering endpoints', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const service = TestBed.inject(ClientListingApiService);

    service.changeStatus('listing-id', 'ACTIVE').subscribe();
    service.reorderImages('listing-id', ['image-2', 'image-1']).subscribe();

    expect(api.post).toHaveBeenCalledWith('/showroom/client/listings/listing-id/status', {
      status: 'ACTIVE',
    });
    expect(api.patch).toHaveBeenCalledWith('/showroom/client/listings/listing-id/images/order', {
      imageIds: ['image-2', 'image-1'],
    });
  });

  it('uses vehicle request client and admin endpoints', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const service = TestBed.inject(VehicleRequestApiService);

    service.listMine().subscribe();
    service.listAdmin({ status: 'PENDING_REVIEW', page: 1 }).subscribe();
    service.review('request-id', { status: 'APPROVED', decisionNote: 'Looks good' }).subscribe();

    expect(api.get).toHaveBeenCalledWith('/showroom/client/requests');
    expect(api.get).toHaveBeenCalledWith('/showroom/admin/requests', {
      status: 'PENDING_REVIEW',
      page: 1,
    });
    expect(api.post).toHaveBeenCalledWith('/showroom/admin/requests/request-id/review', {
      status: 'APPROVED',
      decisionNote: 'Looks good',
    });
  });
});
