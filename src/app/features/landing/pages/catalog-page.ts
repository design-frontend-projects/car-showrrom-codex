import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { formatCurrency, formatMileage } from '../../../utils/number-format.util';

interface VehicleCard {
  name: string;
  price: number;
  mileage: number;
  tag: string;
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

    <section class="vehicle-grid">
      @for (vehicle of vehicles; track vehicle.name) {
        <p-card styleClass="vehicle-card">
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

  readonly pageKey = computed(() => this.route.snapshot.data['pageKey'] as 'usedCars' | 'newCars');
  readonly title = computed(() => this.translate.instant(`pages.${this.pageKey()}.title`));
  readonly copy = computed(() => this.translate.instant(`pages.${this.pageKey()}.copy`));
  readonly price = formatCurrency;
  readonly mileage = formatMileage;

  readonly vehicles: VehicleCard[] = [
    { name: 'BMW X5 xDrive40i', price: 64800, mileage: 12400, tag: 'Executive SUV' },
    { name: 'Tesla Model 3 Long Range', price: 36900, mileage: 18800, tag: 'Electric sedan' },
    { name: 'Toyota Land Cruiser', price: 74200, mileage: 5200, tag: 'Adventure ready' }
  ];
}
