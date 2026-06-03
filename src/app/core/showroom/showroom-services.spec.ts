import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { ApiService } from '../http/api.service';
import { AdminVehicleApiService } from './admin-vehicle-api.service';
import { CatalogApiService } from './catalog-api.service';
import { ClientListingApiService } from './client-listing-api.service';
import { VehicleDefinitionApiService } from './vehicle-definition-api.service';
import { VehicleRequestApiService } from './vehicle-request-api.service';
import { VehicleOptionLoaderService } from './vehicle-option-loader.service';

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

  it('uses public inventory counter endpoint', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const service = TestBed.inject(CatalogApiService);

    service.inventoryCounters().subscribe();

    expect(api.get).toHaveBeenCalledWith('/showroom/inventory-counters');
  });

  it('uses admin vehicle endpoints for list, detail, save, status, and image ordering', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const service = TestBed.inject(AdminVehicleApiService);

    service.list({ q: 'range', status: 'ACTIVE', page: 2 }).subscribe();
    service.detail('listing-id').subscribe();
    service.create({
      makeId: 'make-id',
      modelId: 'model-id',
      variantId: 'variant-id',
      title: 'Test',
      modelYear: 2026,
      price: 1,
      currency: 'USD',
      mileage: 0,
      condition: 'NEW',
      location: 'Showroom',
      description: 'Long enough vehicle description.',
      status: 'DRAFT',
    }).subscribe();
    service.changeStatus('listing-id', 'ARCHIVED').subscribe();
    service.reorderImages('listing-id', ['image-1', 'image-2']).subscribe();

    const params = vi.mocked(api.get).mock.calls[0]?.[1] as HttpParams;
    expect(vi.mocked(api.get).mock.calls[0]?.[0]).toBe('/showroom/admin/vehicles');
    expect(params.get('q')).toBe('range');
    expect(params.get('status')).toBe('ACTIVE');
    expect(api.get).toHaveBeenCalledWith('/showroom/admin/vehicles/listing-id');
    expect(api.post).toHaveBeenCalledWith('/showroom/admin/vehicles/listing-id/status', {
      status: 'ARCHIVED',
    });
    expect(api.patch).toHaveBeenCalledWith('/showroom/admin/vehicles/listing-id/images/order', {
      imageIds: ['image-1', 'image-2'],
    });
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

  it('uses admin vehicle definition and users-with-roles endpoints with query params', () => {
    const api = apiMock();
    TestBed.configureTestingModule({ providers: [{ provide: ApiService, useValue: api }] });
    const service = TestBed.inject(VehicleDefinitionApiService);

    service.list('models', { q: 'camry', includeInactive: true }).subscribe();
    service.create('fuel-types', { name: 'Hybrid', code: 'HYBRID', isActive: true }).subscribe();
    service.update('fuel-types', 'fuel-id', { name: 'Hybrid Electric' }).subscribe();
    service.deactivate('fuel-types', 'fuel-id').subscribe();
    service.usersRoles({ q: 'admin', role: 'admin', state: 'active' }).subscribe();

    const definitionParams = vi.mocked(api.get).mock.calls[0]?.[1] as HttpParams;
    const usersParams = vi.mocked(api.get).mock.calls[1]?.[1] as HttpParams;

    expect(vi.mocked(api.get).mock.calls[0]?.[0]).toBe('/showroom/admin/definitions/models');
    expect(definitionParams.get('q')).toBe('camry');
    expect(definitionParams.get('includeInactive')).toBe('true');
    expect(api.post).toHaveBeenCalledWith('/showroom/admin/definitions/fuel-types', {
      name: 'Hybrid',
      code: 'HYBRID',
      isActive: true,
    });
    expect(api.patch).toHaveBeenCalledWith('/showroom/admin/definitions/fuel-types/fuel-id', {
      name: 'Hybrid Electric',
    });
    expect(api.delete).toHaveBeenCalledWith('/showroom/admin/definitions/fuel-types/fuel-id');
    expect(vi.mocked(api.get).mock.calls[1]?.[0]).toBe('/showroom/admin/users-roles');
    expect(usersParams.get('q')).toBe('admin');
    expect(usersParams.get('role')).toBe('admin');
    expect(usersParams.get('state')).toBe('active');
  });

  it('loads dependent option data through declarative loader config', async () => {
    const catalog = {
      options: vi.fn(() => of({ items: [{ id: 'model-id', name: 'Model', makeId: 'make-id' }], total: 1 })),
    };
    TestBed.configureTestingModule({ providers: [{ provide: CatalogApiService, useValue: catalog }] });
    const loader = TestBed.inject(VehicleOptionLoaderService);

    const state = await firstValueFrom(
      loader.load(
        {
          key: 'test-models',
          entity: 'models',
          parentKeys: ['makeId'],
          parentParamMap: { makeId: 'makeId' },
          debounceMs: 0,
        },
        { makeId: 'make-id' },
      ),
    );

    expect(state.status).toBe('loaded');
    expect(state.items).toEqual([expect.objectContaining({ id: 'model-id' })]);
    expect(catalog.options).toHaveBeenCalledWith('models', expect.objectContaining({ makeId: 'make-id' }));
  });
});
