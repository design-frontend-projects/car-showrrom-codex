import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { firstValueFrom } from 'rxjs';
import { AdminVehicleApiService } from '../../../core/showroom/admin-vehicle-api.service';
import {
  AdminVehicleListParams,
  AdminVehicleListResult,
  CarListingCondition,
  CarListingStatus,
} from '../../../core/showroom/showroom.models';
import { formatCurrency, formatMileage } from '../../../utils/number-format.util';

@Component({
  selector: 'app-admin-vehicles-page',
  imports: [ButtonModule, CardModule, FormsModule, InputTextModule, RouterLink, SelectModule, TagModule],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">Inventory admin</span>
      <h1>Vehicle definitions</h1>
      <p>Create, publish, and maintain showroom listings for new and used inventory.</p>
      <p-button routerLink="/admin/vehicles/create" icon="pi pi-plus" label="Create vehicle" />
    </section>

    <section class="admin-vehicles-shell">
      <div class="admin-stats">
        <article>
          <span>Active new</span>
          <strong>{{ result()?.counters?.newCars ?? 0 }}</strong>
        </article>
        <article>
          <span>Active used</span>
          <strong>{{ result()?.counters?.usedCars ?? 0 }}</strong>
        </article>
        <article>
          <span>Total records</span>
          <strong>{{ result()?.total ?? 0 }}</strong>
        </article>
      </div>

      <form class="admin-filterbar" (ngSubmit)="loadVehicles()">
        <input pInputText type="search" name="q" [(ngModel)]="filters.q" placeholder="Search title, make, model, location" />
        <p-select [options]="statusOptions" optionLabel="label" optionValue="value" name="status" [(ngModel)]="filters.status" placeholder="Status" [showClear]="true" />
        <p-select [options]="conditionOptions" optionLabel="label" optionValue="value" name="condition" [(ngModel)]="filters.condition" placeholder="Condition" [showClear]="true" />
        <p-button type="submit" icon="pi pi-search" label="Filter" [outlined]="true" />
      </form>

      @if (loading()) {
        <div class="state-panel">Loading vehicle inventory...</div>
      } @else if ((result()?.items?.length ?? 0) === 0) {
        <div class="state-panel">No vehicles match the current filters.</div>
      } @else {
        <div class="admin-vehicle-list">
          @for (vehicle of result()?.items; track vehicle.id) {
            <p-card styleClass="management-card">
              <ng-template #title>{{ vehicle.title }}</ng-template>
              <ng-template #subtitle>{{ vehicle.make.name }} {{ vehicle.model.name }} - {{ vehicle.modelYear }}</ng-template>
              <div class="admin-row">
                <div class="vehicle-meta">
                  <span>{{ price(vehicle.price) }}</span>
                  <span>{{ mileage(vehicle.mileage) }}</span>
                  <span>{{ vehicle.imageCount }} images</span>
                  <span>{{ vehicle.location }}</span>
                </div>
                <div class="admin-tags">
                  <p-tag [value]="vehicle.condition" severity="info" />
                  <p-tag [value]="vehicle.status" [severity]="vehicle.status === 'ACTIVE' ? 'success' : 'secondary'" />
                </div>
              </div>
              <div class="button-row">
                <p-button [routerLink]="['/admin/vehicles/edit', vehicle.id]" icon="pi pi-pencil" label="Edit" [outlined]="true" />
                <p-button icon="pi pi-refresh" label="Publish" [outlined]="true" (onClick)="changeStatus(vehicle.id, 'ACTIVE')" />
                <p-button icon="pi pi-box" label="Archive" [outlined]="true" (onClick)="changeStatus(vehicle.id, 'ARCHIVED')" />
              </div>
            </p-card>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      .admin-vehicles-shell {
        display: grid;
        gap: var(--space-4);
        width: min(100%, var(--content-max));
        margin: 0 auto var(--space-8);
      }

      .admin-stats,
      .admin-filterbar {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--line);
      }

      .admin-stats article,
      .admin-filterbar {
        background: var(--surface);
      }

      .admin-stats article {
        display: grid;
        gap: var(--space-2);
        padding: var(--space-4);
      }

      .admin-stats span {
        color: var(--muted);
        font-weight: 850;
      }

      .admin-stats strong {
        font-size: 2rem;
        line-height: 1;
      }

      .admin-filterbar {
        gap: var(--space-3);
        padding: var(--space-4);
      }

      .admin-vehicle-list {
        display: grid;
        gap: var(--space-3);
      }

      .admin-row {
        display: grid;
        gap: var(--space-3);
      }

      .admin-tags {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      @media (min-width: 760px) {
        .admin-stats {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .admin-filterbar {
          grid-template-columns: minmax(0, 1fr) 12rem 12rem auto;
          align-items: center;
        }

        .admin-row {
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
        }
      }
    `,
  ],
})
export class AdminVehiclesPage implements OnInit {
  private readonly api = inject(AdminVehicleApiService);
  readonly loading = signal(false);
  readonly result = signal<AdminVehicleListResult | null>(null);
  readonly price = formatCurrency;
  readonly mileage = formatMileage;

  readonly filters: AdminVehicleListParams = {
    q: '',
    page: 1,
    pageSize: 20,
  };

  readonly statusOptions: { label: string; value: CarListingStatus }[] = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending', value: 'PENDING_REVIEW' },
    { label: 'Published', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Sold', value: 'SOLD' },
    { label: 'Archived', value: 'ARCHIVED' },
  ];

  readonly conditionOptions: { label: string; value: CarListingCondition }[] = [
    { label: 'New', value: 'NEW' },
    { label: 'Certified', value: 'CERTIFIED_PRE_OWNED' },
    { label: 'Used', value: 'USED' },
    { label: 'Damaged', value: 'DAMAGED' },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadVehicles();
  }

  async loadVehicles(): Promise<void> {
    this.loading.set(true);

    try {
      this.result.set(await firstValueFrom(this.api.list(this.filters)));
    } catch {
      this.result.set({
        items: [],
        page: 1,
        pageSize: this.filters.pageSize ?? 20,
        total: 0,
        pageCount: 0,
        counters: {
          newCars: 0,
          usedCars: 0,
          cachedAt: new Date().toISOString(),
        },
      });
    } finally {
      this.loading.set(false);
    }
  }

  async changeStatus(listingId: string, status: CarListingStatus): Promise<void> {
    await firstValueFrom(this.api.changeStatus(listingId, status));
    await this.loadVehicles();
  }
}
