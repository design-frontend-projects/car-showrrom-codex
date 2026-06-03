import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs';
import { CatalogApiService } from './catalog-api.service';
import {
  ShowroomTaxonomyItem,
  VehicleOptionEntity,
  VehicleOptionQueryParams,
} from './showroom.models';

export interface VehicleOptionLoaderConfig<T extends ShowroomTaxonomyItem = ShowroomTaxonomyItem> {
  key: string;
  entity: VehicleOptionEntity;
  parentKeys?: readonly string[];
  parentParamMap?: Record<string, keyof VehicleOptionQueryParams>;
  debounceMs?: number;
  includeInactive?: boolean;
  limit?: number;
  cacheMs?: number;
  emptyMessageKey?: string;
  mapItem?: (item: T) => T;
}

export interface VehicleOptionLoadState<T extends ShowroomTaxonomyItem = ShowroomTaxonomyItem> {
  status: 'idle' | 'loading' | 'loaded' | 'empty' | 'error' | 'stale';
  items: T[];
  error?: string;
  emptyMessageKey?: string;
  retry: () => Observable<VehicleOptionLoadState<T>>;
}

@Injectable({ providedIn: 'root' })
export class VehicleOptionLoaderService {
  private readonly catalog = inject(CatalogApiService);
  private readonly cache = new Map<string, { expiresAt: number; items: ShowroomTaxonomyItem[] }>();
  private readonly versions = new Map<string, number>();

  load<T extends ShowroomTaxonomyItem>(
    config: VehicleOptionLoaderConfig<T>,
    values: Record<string, string | null | undefined> = {},
    search = '',
    selectedId?: string | null,
  ): Observable<VehicleOptionLoadState<T>> {
    const params = this.buildParams(config, values, search, selectedId);
    const cacheKey = this.cacheKey(config, params);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();
    const retry = () => this.load(config, values, search, selectedId);

    if (cached && cached.expiresAt > now) {
      const items = cached.items as T[];
      return of({
        status: items.length ? 'loaded' : 'empty',
        items,
        emptyMessageKey: config.emptyMessageKey,
        retry,
      });
    }

    const version = (this.versions.get(config.key) ?? 0) + 1;
    this.versions.set(config.key, version);

    return timer(config.debounceMs ?? 150).pipe(
      switchMap(() => this.catalog.options<T>(config.entity, params)),
      map((result) => {
        const latestVersion = this.versions.get(config.key);
        const items = (config.mapItem ? result.items.map(config.mapItem) : result.items) as T[];

        if (latestVersion !== version) {
          return {
            status: 'stale' as const,
            items: [],
            emptyMessageKey: config.emptyMessageKey,
            retry,
          };
        }

        this.cache.set(cacheKey, {
          items,
          expiresAt: Date.now() + (config.cacheMs ?? 60_000),
        });

        return {
          status: items.length ? ('loaded' as const) : ('empty' as const),
          items,
          emptyMessageKey: config.emptyMessageKey,
          retry,
        };
      }),
      catchError(() =>
        of({
          status: 'error' as const,
          items: [],
          error: 'showroom.error.requestFailed',
          emptyMessageKey: config.emptyMessageKey,
          retry,
        }),
      ),
    );
  }

  invalidate(prefix?: string): void {
    for (const key of this.cache.keys()) {
      if (!prefix || key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  private buildParams<T extends ShowroomTaxonomyItem>(
    config: VehicleOptionLoaderConfig<T>,
    values: Record<string, string | null | undefined>,
    search: string,
    selectedId?: string | null,
  ): VehicleOptionQueryParams {
    const params: VehicleOptionQueryParams = {
      q: search || undefined,
      includeInactive: config.includeInactive,
      selectedId: selectedId || undefined,
      limit: config.limit,
    };

    for (const parentKey of config.parentKeys ?? []) {
      const value = values[parentKey];
      const paramKey = config.parentParamMap?.[parentKey];

      if (value && paramKey) {
        params[paramKey] = value as never;
      }
    }

    return params;
  }

  private cacheKey<T extends ShowroomTaxonomyItem>(
    config: VehicleOptionLoaderConfig<T>,
    params: VehicleOptionQueryParams,
  ): string {
    const normalized = Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        const value = params[key as keyof VehicleOptionQueryParams];
        if (value !== undefined && value !== null && value !== '') {
          result[key] = value;
        }

        return result;
      }, {});

    return `${config.key}:${config.entity}:${JSON.stringify(normalized)}`;
  }
}
