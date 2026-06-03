import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { SliderModule } from 'primeng/slider';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from '../../../core/showroom/catalog-api.service';
import {
  CatalogRouteResolvedData,
  ListingSearchParams,
  ListingSummaryDto,
  ShowroomMake,
  ShowroomModel,
  ShowroomVariant,
  VehicleDefinitionCatalogItem,
} from '../../../core/showroom/showroom.models';
import { VehicleOptionLoaderService } from '../../../core/showroom/vehicle-option-loader.service';
import { ResponsiveLayoutService } from '../../../core/layout/responsive-layout.service';
import { formatCurrency, formatMileage } from '../../../utils/number-format.util';

@Component({
  selector: 'app-catalog-page',
  imports: [
    ButtonModule,
    CardModule,
    FormsModule,
    InputTextModule,
    RouterLink,
    SelectModule,
    SliderModule,
    ToggleSwitchModule,
    TranslatePipe,
  ],
  template: `
    <section class="page-header">
      <span class="eyebrow">{{ 'catalog.inventory' | translate }}</span>
      <h1>{{ title() }}</h1>
      <p>{{ copy() }}</p>
    </section>

    <section class="catalog-workspace" [attr.data-density]="cardDensity()">
      <aside class="catalog-filters">
        <input
          pInputText
          type="search"
          name="q"
          [(ngModel)]="filters.q"
          [placeholder]="'showroom.search.keyword' | translate"
        />

        <p-select
          [options]="makes()"
          optionLabel="name"
          optionValue="id"
          [(ngModel)]="filters.makeId"
          [placeholder]="'showroom.search.make' | translate"
          (onChange)="onMakeChange()"
        />

        <p-select
          [options]="models()"
          optionLabel="name"
          optionValue="id"
          [(ngModel)]="filters.modelId"
          [placeholder]="'showroom.search.model' | translate"
          (onChange)="onModelChange()"
        />

        <p-select
          [options]="variants()"
          optionLabel="name"
          optionValue="id"
          [(ngModel)]="filters.variantId"
          [placeholder]="'showroom.search.variant' | translate"
        />

        <p-select
          [options]="conditionOptions()"
          optionLabel="name"
          optionValue="code"
          [(ngModel)]="filters.condition"
          [placeholder]="'showroom.search.condition' | translate"
        />

        <input
          pInputText
          type="text"
          name="location"
          [(ngModel)]="filters.location"
          [placeholder]="'showroom.search.location' | translate"
        />

        <label class="range-label">
          <span>{{ 'showroom.search.priceRange' | translate }}</span>
          <strong>{{ price(priceRange[0]) }} - {{ price(priceRange[1]) }}</strong>
        </label>
        <p-slider [(ngModel)]="priceRange" [range]="true" [min]="0" [max]="200000" [step]="5000" />

        <label class="toggle-line">
          <p-toggleswitch [(ngModel)]="activeOnly" />
          <span>{{ 'showroom.search.activeOnly' | translate }}</span>
        </label>

        <div class="filter-actions">
          <p-button [label]="'showroom.actions.apply' | translate" icon="pi pi-search" (onClick)="applyFilters()" />
          <p-button [label]="'showroom.actions.clear' | translate" icon="pi pi-filter-slash" [outlined]="true" (onClick)="clearFilters()" />
        </div>
      </aside>

      <div class="catalog-results">
        @if (loading()) {
          <div class="state-panel">{{ 'showroom.states.loading' | translate }}</div>
        } @else if (error()) {
          <div class="state-panel error">
            <span>{{ error() | translate }}</span>
            <p-button label="Retry" icon="pi pi-refresh" [outlined]="true" (onClick)="loadResults()" />
          </div>
        } @else if ((vehicles()?.items?.length ?? 0) === 0) {
          <div class="state-panel">{{ 'showroom.states.empty' | translate }}</div>
        } @else {
          <div class="vehicle-grid" [attr.data-density]="cardDensity()">
            @for (vehicle of vehicles()?.items; track vehicle.id) {
              <p-card styleClass="vehicle-card">
                <ng-template #header>
                  <figure class="vehicle-media">
                    <img [src]="imageUrl(vehicle)" [alt]="vehicle.title" loading="lazy" />
                  </figure>
                </ng-template>
                <ng-template #title>{{ vehicle.title }}</ng-template>
                <ng-template #subtitle>{{ vehicle.make.name }} {{ vehicle.model.name }} {{ vehicle.variant.name }}</ng-template>
                <div class="vehicle-meta">
                  <span>{{ price(vehicle.price) }}</span>
                  <span>{{ vehicle.modelYear }}</span>
                  <span>{{ mileage(vehicle.mileage) }}</span>
                  <span>{{ ('showroom.status.' + vehicle.status) | translate }}</span>
                </div>
                <p-button
                  [label]="'catalog.viewDetails' | translate"
                  icon="pi pi-arrow-right"
                  [outlined]="true"
                  [routerLink]="['/cars', vehicle.id]"
                />
              </p-card>
            }
          </div>

          <div class="pagination-row">
            <p-button icon="pi pi-angle-left" [disabled]="(vehicles()?.page ?? 1) <= 1" [outlined]="true" (onClick)="goToPage((vehicles()?.page ?? 1) - 1)" />
            <span>{{ vehicles()?.page }} / {{ vehicles()?.pageCount || 1 }}</span>
            <p-button icon="pi pi-angle-right" [disabled]="(vehicles()?.page ?? 1) >= (vehicles()?.pageCount ?? 1)" [outlined]="true" (onClick)="goToPage((vehicles()?.page ?? 1) + 1)" />
          </div>
        }
      </div>
    </section>
  `,
})
export class CatalogPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly layout = inject(ResponsiveLayoutService);
  private readonly catalog = inject(CatalogApiService);
  private readonly optionLoader = inject(VehicleOptionLoaderService);

  readonly makes = signal<ShowroomMake[]>([]);
  readonly models = signal<ShowroomModel[]>([]);
  readonly variants = signal<ShowroomVariant[]>([]);
  readonly conditionOptions = signal<VehicleDefinitionCatalogItem[]>([]);
  readonly vehicles = signal<{ items: ListingSummaryDto[]; page: number; pageCount: number } | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly cardDensity = computed(() => (this.layout.isDesktop() ? 'dense' : this.layout.isTablet() ? 'medium' : 'compact'));
  readonly price = formatCurrency;
  readonly mileage = formatMileage;
  readonly pageKey = computed(() => this.route.snapshot.data['pageKey'] as 'usedCars' | 'newCars');
  readonly title = computed(() => this.translate.instant(`pages.${this.pageKey()}.title`));
  readonly copy = computed(() => this.translate.instant(`pages.${this.pageKey()}.copy`));
  readonly filters: ListingSearchParams = {};
  priceRange = [0, 200000];
  activeOnly = true;

  ngOnInit(): void {
    this.route.data.subscribe((data) => {
      this.applyResolvedData(data['catalogData'] as CatalogRouteResolvedData | undefined);
    });

    this.route.queryParamMap.subscribe((params) => {
      this.filters.q = params.get('q') ?? undefined;
      this.filters.makeId = params.get('makeId') ?? undefined;
      this.filters.modelId = params.get('modelId') ?? undefined;
      this.filters.variantId = params.get('variantId') ?? undefined;
      this.filters.location = params.get('location') ?? undefined;
      this.filters.minPrice = params.get('minPrice') ? Number(params.get('minPrice')) : undefined;
      this.filters.maxPrice = params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined;
      this.filters.page = Number(params.get('page') ?? 1);
      this.filters.sort = 'newest';
      this.priceRange = [this.filters.minPrice ?? 0, this.filters.maxPrice ?? 200000];
      void this.loadDependentOptions();
    });
  }

  onMakeChange(): void {
    this.filters.modelId = undefined;
    this.filters.variantId = undefined;
    this.models.set([]);
    this.variants.set([]);
    void this.loadModels();
  }

  onModelChange(): void {
    this.filters.variantId = undefined;
    this.variants.set([]);
    void this.loadVariants();
  }

  applyFilters(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...this.filters,
        minPrice: this.priceRange[0] > 0 ? this.priceRange[0] : null,
        maxPrice: this.priceRange[1] < 200000 ? this.priceRange[1] : null,
        page: 1,
      },
      queryParamsHandling: 'merge',
    });
  }

  clearFilters(): void {
    Object.keys(this.filters).forEach((key) => {
      delete this.filters[key as keyof ListingSearchParams];
    });
    this.priceRange = [0, 200000];
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  goToPage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
    });
  }

  imageUrl(vehicle: ListingSummaryDto): string {
    return vehicle.primaryImage?.url ?? 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80';
  }

  async loadResults(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.vehicles.set(
        await firstValueFrom(
          this.catalog.search({
            ...this.filters,
            inventoryScope: this.route.snapshot.data['vehicleConditionScope'],
            pageSize: 12,
          }),
        ),
      );
    } catch {
      this.error.set('showroom.error.requestFailed');
    } finally {
      this.loading.set(false);
    }
  }

  private applyResolvedData(data: CatalogRouteResolvedData | undefined): void {
    if (!data) {
      return;
    }

    this.error.set(data.error ?? null);
    this.vehicles.set(data.results);
    this.makes.set(data.options.makes);
    this.conditionOptions.set(data.options.conditions);
  }

  private async loadDependentOptions(): Promise<void> {
    await this.loadModels();
    await this.loadVariants();
  }

  private async loadModels(): Promise<void> {
    if (!this.filters.makeId) {
      this.models.set([]);
      return;
    }

    const state = await firstValueFrom(
      this.optionLoader.load<ShowroomModel>(
        {
          key: 'catalog-models',
          entity: 'models',
          parentKeys: ['makeId'],
          parentParamMap: { makeId: 'makeId' },
          emptyMessageKey: 'showroom.states.empty',
        },
        { makeId: this.filters.makeId },
      ),
    );

    if (state.status !== 'stale') {
      this.models.set(state.items);
    }
  }

  private async loadVariants(): Promise<void> {
    if (!this.filters.modelId) {
      this.variants.set([]);
      return;
    }

    const state = await firstValueFrom(
      this.optionLoader.load<ShowroomVariant>(
        {
          key: 'catalog-trims',
          entity: 'trims',
          parentKeys: ['modelId'],
          parentParamMap: { modelId: 'modelId' },
          emptyMessageKey: 'showroom.states.empty',
        },
        { modelId: this.filters.modelId },
      ),
    );

    if (state.status !== 'stale') {
      this.variants.set(state.items);
    }
  }
}
