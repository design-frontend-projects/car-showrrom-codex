import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ResponsiveLayoutService } from '../../../core/layout/responsive-layout.service';
import { formatCurrency, formatMileage } from '../../../utils/number-format.util';

interface VehicleCard {
  name: string;
  price: number;
  mileage: number;
  tag: string;
  imageUrl: string;
}

@Component({
  selector: 'app-catalog-page',
  imports: [ButtonModule, CardModule, TranslatePipe],
  template: `
    <section class="page-header">
      <span class="eyebrow">{{ 'catalog.inventory' | translate }}</span>
      <h1>{{ title() }}</h1>
      <p>{{ copy() }}</p>
    </section>

    <section class="vehicle-grid" [attr.data-density]="cardDensity()">
      @for (vehicle of vehicles; track vehicle.name) {
        <p-card styleClass="vehicle-card">
          <ng-template #header>
            <figure class="vehicle-media">
              <img [src]="vehicle.imageUrl" [alt]="vehicle.name" loading="lazy" />
            </figure>
          </ng-template>
          <ng-template #title>{{ vehicle.name }}</ng-template>
          <ng-template #subtitle>{{ vehicle.tag }}</ng-template>
          <div class="vehicle-meta">
            <span>{{ price(vehicle.price) }}</span>
            <span>{{ mileage(vehicle.mileage) }}</span>
          </div>
          <p-button [label]="'catalog.viewDetails' | translate" icon="pi pi-arrow-right" [outlined]="true" />
        </p-card>
      }
    </section>
  `
})
export class CatalogPage {
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly layout = inject(ResponsiveLayoutService);

  readonly pageKey = computed(() => this.route.snapshot.data['pageKey'] as 'usedCars' | 'newCars');
  readonly title = computed(() => this.translate.instant(`pages.${this.pageKey()}.title`));
  readonly copy = computed(() => this.translate.instant(`pages.${this.pageKey()}.copy`));
  readonly cardDensity = computed(() => (this.layout.isDesktop() ? 'dense' : this.layout.isTablet() ? 'medium' : 'compact'));
  readonly price = formatCurrency;
  readonly mileage = formatMileage;

  readonly vehicles: VehicleCard[] = [
    {
      name: 'BMW X5 xDrive40i',
      price: 64800,
      mileage: 12400,
      tag: 'Executive SUV',
      imageUrl: 'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?auto=format&fit=crop&w=1000&q=82'
    },
    {
      name: 'Tesla Model 3 Long Range',
      price: 36900,
      mileage: 18800,
      tag: 'Electric sedan',
      imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=82'
    },
    {
      name: 'Toyota Land Cruiser',
      price: 74200,
      mileage: 5200,
      tag: 'Adventure ready',
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=82'
    }
  ];
}
