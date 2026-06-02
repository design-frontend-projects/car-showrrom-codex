import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from './catalog-api.service';
import { ClientListingApiService } from './client-listing-api.service';
import { VehicleRequestApiService } from './vehicle-request-api.service';
import {
  AdminRequestResult,
  ClientListingsDto,
  ListingSearchParams,
  ListingSearchResult,
  ShowroomTaxonomy,
  VehicleRequestDto,
} from './showroom.models';

type LoadState = 'idle' | 'loading' | 'loaded' | 'failed';

@Injectable({ providedIn: 'root' })
export class ShowroomStore {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly listingApi = inject(ClientListingApiService);
  private readonly requestApi = inject(VehicleRequestApiService);

  readonly taxonomy = signal<ShowroomTaxonomy | null>(null);
  readonly searchResult = signal<ListingSearchResult | null>(null);
  readonly clientListings = signal<ClientListingsDto | null>(null);
  readonly clientRequests = signal<VehicleRequestDto[]>([]);
  readonly adminRequests = signal<AdminRequestResult | null>(null);
  readonly status = signal<LoadState>('idle');
  readonly error = signal<string | null>(null);
  readonly isLoading = computed(() => this.status() === 'loading');

  async loadTaxonomy(): Promise<void> {
    await this.capture(async () => {
      this.taxonomy.set(await firstValueFrom(this.catalogApi.taxonomy()));
    });
  }

  async search(params: ListingSearchParams): Promise<void> {
    await this.capture(async () => {
      this.searchResult.set(await firstValueFrom(this.catalogApi.search(params)));
    });
  }

  async loadClientListings(): Promise<void> {
    await this.capture(async () => {
      this.clientListings.set(await firstValueFrom(this.listingApi.listMine()));
    });
  }

  async loadClientRequests(): Promise<void> {
    await this.capture(async () => {
      this.clientRequests.set(await firstValueFrom(this.requestApi.listMine()));
    });
  }

  async loadAdminRequests(params: { status?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'; page?: number; pageSize?: number }): Promise<void> {
    await this.capture(async () => {
      this.adminRequests.set(await firstValueFrom(this.requestApi.listAdmin(params)));
    });
  }

  private async capture(work: () => Promise<void>): Promise<void> {
    this.status.set('loading');
    this.error.set(null);

    try {
      await work();
      this.status.set('loaded');
    } catch (error) {
      this.status.set('failed');
      this.error.set(describeError(error));
    }
  }
}

function describeError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    const body = (error as { error?: { code?: string } }).error;

    if (body?.code) {
      return body.code;
    }
  }

  return error instanceof Error ? error.message : 'showroom.error.unexpected';
}
