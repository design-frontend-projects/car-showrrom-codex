import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CatalogApiService } from '../../core/showroom/catalog-api.service';
import { ClientListingApiService } from '../../core/showroom/client-listing-api.service';
import type { VehicleOptionEntity } from '../../core/showroom/showroom.models';
import { ClientListingsPage } from './client-listings-page';

describe('ClientListingsPage validation state', () => {
  it('requires taxonomy, price, title, and a useful description before saving', () => {
    const { component } = setup();
    component.conditions.set([{ id: 'condition-id', name: 'Used', code: 'USED', isActive: true, sortOrder: 10 }]);

    expect(component.canSave()).toBe(false);

    Object.assign(component.draft, {
      title: 'Clean sedan',
      makeId: 'make-id',
      modelId: 'model-id',
      variantId: 'variant-id',
      price: 22000,
      condition: 'USED',
      description: 'Well maintained vehicle with full service history.',
    });

    expect(component.canSave()).toBe(true);
  });

  it('initializes condition from the preferred active option after options load', async () => {
    const { component, catalog } = setup({
      conditions: [
        { id: 'new-id', name: 'New', code: 'NEW', isActive: true, sortOrder: 10 },
        { id: 'used-id', name: 'Used', code: 'USED', isActive: true, sortOrder: 20 },
      ],
    });

    expect(component.draft.condition).toBe('');

    await component.ngOnInit();

    expect(component.draft.condition).toBe('USED');
    expect(component.fieldErrors()).toEqual({});
    expect(catalog.options).toHaveBeenCalledWith('conditions', { limit: 20 });
  });

  it('keeps saving disabled and shows a condition error when active options are unavailable', async () => {
    const { component, listingApi } = setup({ conditions: [] });

    await component.ngOnInit();
    Object.assign(component.draft, {
      title: 'Clean sedan',
      makeId: 'make-id',
      modelId: 'model-id',
      variantId: 'variant-id',
      price: 22000,
      description: 'Well maintained vehicle with full service history.',
    });

    expect(component.draft.condition).toBe('');
    expect(component.canSave()).toBe(false);

    await component.saveListing();

    expect(listingApi.create).not.toHaveBeenCalled();
    expect(component.fieldErrors()).toEqual({ condition: 'showroom.validation.required' });
    expect(component.fieldErrorList()).toContain('showroom.validation.required');
  });

  it('preserves draft values and displays server condition field errors', async () => {
    const { component, listingApi } = setup();
    component.conditions.set([{ id: 'condition-id', name: 'Used', code: 'USED', isActive: true, sortOrder: 10 }]);
    Object.assign(component.draft, {
      title: 'Clean sedan',
      makeId: 'make-id',
      modelId: 'model-id',
      variantId: 'variant-id',
      price: 22000,
      condition: 'USED',
      description: 'Well maintained vehicle with full service history.',
    });
    listingApi.create.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: {
              code: 'showroom.error.validation',
              fieldErrors: { condition: 'showroom.validation.invalid_value' },
            },
          }),
      ),
    );

    await component.saveListing();

    expect(component.draft.title).toBe('Clean sedan');
    expect(component.draft.condition).toBe('USED');
    expect(component.fieldErrors()).toEqual({ condition: 'showroom.validation.invalid_value' });
    expect(component.fieldErrorList()).toContain('showroom.validation.invalid_value');
  });
});

function setup(options: { conditions?: unknown[] } = {}) {
  const catalog = {
    options: vi.fn((entity: VehicleOptionEntity) =>
      of({
        items:
          entity === 'conditions'
            ? (options.conditions ?? [{ id: 'condition-id', name: 'Used', code: 'USED', isActive: true, sortOrder: 10 }])
            : [],
        total: entity === 'conditions' ? (options.conditions?.length ?? 1) : 0,
      }),
    ),
  };
  const listingApi = {
    create: vi.fn(() => of({})),
    listMine: vi.fn(() => of({ activeCount: 0, activeLimit: 5, items: [] })),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: CatalogApiService, useValue: catalog },
      { provide: ClientListingApiService, useValue: listingApi },
    ],
  });

  const component = TestBed.runInInjectionContext(() => new ClientListingsPage());

  return { component, catalog, listingApi };
}
