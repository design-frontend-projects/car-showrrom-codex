import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, ResolveFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AdminVehicleApiService } from './admin-vehicle-api.service';
import { CatalogApiService } from './catalog-api.service';
import {
  AdminVehicleEditorResolvedData,
  AdminVehicleOverviewResolvedData,
  CatalogRouteResolvedData,
  DefinitionEntityResolvedData,
  ListingSearchParams,
  ListingSearchResult,
  ShowroomMake,
  ShowroomModel,
  ShowroomVariant,
  VehicleColorDefinition,
  VehicleDefinitionCatalogItem,
  VehicleDefinitionEntity,
  VehicleDefinitionListResult,
  VehicleInventoryScope,
} from './showroom.models';
import { VehicleDefinitionApiService } from './vehicle-definition-api.service';

export const catalogRouteResolver: ResolveFn<CatalogRouteResolvedData> = async (route) => {
  const api = inject(CatalogApiService);
  const scope = (route.data['vehicleConditionScope'] as VehicleInventoryScope | undefined) ?? 'used';
  const query = listingQueryFromRoute(route, scope);

  try {
    const [results, makes, conditions, bodyTypes, fuelTypes, transmissions, exteriorColors, interiorColors] =
      await Promise.all([
        firstValueFrom(api.search(query)),
        firstValueFrom(api.options<ShowroomMake>('makes', { limit: 100 })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('conditions', { limit: 20 })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('body-types', { limit: 50 })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('fuel-types', { limit: 50 })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('transmissions', { limit: 50 })),
        firstValueFrom(api.options<VehicleColorDefinition>('exterior-colors', { limit: 50 })),
        firstValueFrom(api.options<VehicleColorDefinition>('interior-colors', { limit: 50 })),
      ]);

    return {
      scope,
      results,
      options: {
        makes: makes.items,
        conditions: conditions.items,
        bodyTypes: bodyTypes.items,
        fuelTypes: fuelTypes.items,
        transmissions: transmissions.items,
        exteriorColors: exteriorColors.items,
        interiorColors: interiorColors.items,
      },
    };
  } catch {
    return {
      scope,
      error: 'showroom.error.requestFailed',
      results: emptyListingResult(query.page ?? 1, query.pageSize ?? 12),
      options: {
        makes: [],
        conditions: [],
        bodyTypes: [],
        fuelTypes: [],
        transmissions: [],
        exteriorColors: [],
        interiorColors: [],
      },
    };
  }
};

export const adminVehicleOverviewResolver: ResolveFn<AdminVehicleOverviewResolvedData> = async (route) => {
  const api = inject(AdminVehicleApiService);
  const page = Number(route.queryParamMap.get('page') ?? 1);

  try {
    const [result, conditions] = await Promise.all([
      firstValueFrom(api.list({ page, pageSize: 20 })),
      firstValueFrom(api.options<VehicleDefinitionCatalogItem>('conditions', { limit: 20 })),
    ]);

    return { result, conditions: conditions.items };
  } catch {
    return {
      error: 'showroom.error.requestFailed',
      result: {
        ...emptyListingResult(page, 20),
        counters: { newCars: 0, usedCars: 0, cachedAt: new Date().toISOString() },
      },
      conditions: [],
    };
  }
};

export const adminVehicleEditorResolver: ResolveFn<AdminVehicleEditorResolvedData> = async (route) => {
  const api = inject(AdminVehicleApiService);
  const listingId = route.paramMap.get('id');

  try {
    const listing = listingId ? await firstValueFrom(api.detail(listingId)) : null;
    const makeId = listing?.make.id;
    const modelId = listing?.model.id;

    const [makes, models, trims, conditions, engines, transmissions, fuelTypes, bodyTypes, exteriorColors, interiorColors] =
      await Promise.all([
        firstValueFrom(api.options<ShowroomMake>('makes', { limit: 100, selectedId: makeId ?? undefined })),
        firstValueFrom(api.options<ShowroomModel>('models', { limit: 100, makeId, selectedId: listing?.model.id })),
        firstValueFrom(api.options<ShowroomVariant>('trims', { limit: 100, modelId, selectedId: listing?.variant.id })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('conditions', { limit: 20 })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('engines', { limit: 100 })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('transmissions', { limit: 100 })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('fuel-types', { limit: 100 })),
        firstValueFrom(api.options<VehicleDefinitionCatalogItem>('body-types', { limit: 100 })),
        firstValueFrom(api.options<VehicleColorDefinition>('exterior-colors', { limit: 100, selectedId: listing?.exteriorColorId ?? undefined })),
        firstValueFrom(api.options<VehicleColorDefinition>('interior-colors', { limit: 100, selectedId: listing?.interiorColorId ?? undefined })),
      ]);

    return {
      listing,
      options: {
        makes: makes.items,
        models: models.items,
        trims: trims.items,
        conditions: conditions.items,
        engines: engines.items,
        transmissions: transmissions.items,
        fuelTypes: fuelTypes.items,
        bodyTypes: bodyTypes.items,
        exteriorColors: exteriorColors.items,
        interiorColors: interiorColors.items,
      },
    };
  } catch {
    return {
      error: 'showroom.error.requestFailed',
      listing: null,
      options: {
        makes: [],
        models: [],
        trims: [],
        conditions: [],
        engines: [],
        transmissions: [],
        fuelTypes: [],
        bodyTypes: [],
        exteriorColors: [],
        interiorColors: [],
      },
    };
  }
};

export const definitionEntityResolver: ResolveFn<DefinitionEntityResolvedData> = async (route) => {
  const api = inject(VehicleDefinitionApiService);
  const entity = route.paramMap.get('entity') as VehicleDefinitionEntity | null;

  try {
    return {
      result: await firstValueFrom(
        api.list(entity ?? 'makes', {
          includeInactive: true,
          page: Number(route.queryParamMap.get('page') ?? 1),
          pageSize: Number(route.queryParamMap.get('pageSize') ?? 20),
        }),
      ),
    };
  } catch {
    return {
      error: 'admin.definitions.errors.load',
      result: emptyDefinitionResult(),
    };
  }
};

function listingQueryFromRoute(route: ActivatedRouteSnapshot, scope: VehicleInventoryScope): ListingSearchParams {
  const numberParam = (key: string) => {
    const value = route.queryParamMap.get(key);
    return value ? Number(value) : undefined;
  };

  return {
    inventoryScope: scope,
    q: route.queryParamMap.get('q') ?? undefined,
    makeId: route.queryParamMap.get('makeId') ?? undefined,
    modelId: route.queryParamMap.get('modelId') ?? undefined,
    variantId: route.queryParamMap.get('variantId') ?? undefined,
    location: route.queryParamMap.get('location') ?? undefined,
    minPrice: numberParam('minPrice'),
    maxPrice: numberParam('maxPrice'),
    page: numberParam('page') ?? 1,
    pageSize: 12,
    sort: 'newest',
  };
}

function emptyListingResult(page: number, pageSize: number): ListingSearchResult {
  return {
    items: [],
    page,
    pageSize,
    total: 0,
    pageCount: 0,
  };
}

function emptyDefinitionResult(): VehicleDefinitionListResult {
  return {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
    pageCount: 0,
  };
}
