import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogApiService } from '../../core/showroom/catalog-api.service';
import { ClientListingApiService } from '../../core/showroom/client-listing-api.service';
import { ClientListingsPage } from './client-listings-page';

describe('ClientListingsPage validation state', () => {
  it('requires taxonomy, price, title, and a useful description before saving', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CatalogApiService,
          useValue: { taxonomy: () => of({ makes: [], colors: [], bodyTypes: [], fuelTypes: [], transmissions: [], conditions: [] }) },
        },
        {
          provide: ClientListingApiService,
          useValue: { listMine: () => of({ activeCount: 0, activeLimit: 5, items: [] }) },
        },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new ClientListingsPage());

    expect(component.canSave()).toBe(false);

    Object.assign(component.draft, {
      title: 'Clean sedan',
      makeId: 'make-id',
      modelId: 'model-id',
      variantId: 'variant-id',
      price: 22000,
      description: 'Well maintained vehicle with full service history.',
    });

    expect(component.canSave()).toBe(true);
  });
});
