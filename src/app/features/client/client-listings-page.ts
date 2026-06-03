import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from '../../core/showroom/catalog-api.service';
import { ClientListingApiService } from '../../core/showroom/client-listing-api.service';
import {
  CarListingCondition,
  CarListingStatus,
  ClientListingsDto,
  ListingInputDto,
  ListingSummaryDto,
  ShowroomMake,
  ShowroomModel,
  ShowroomVariant,
  VehicleDefinitionCatalogItem,
} from '../../core/showroom/showroom.models';
import { VehicleOptionLoaderService } from '../../core/showroom/vehicle-option-loader.service';
import { formatCurrency, formatMileage } from '../../utils/number-format.util';

@Component({
  selector: 'app-client-listings-page',
  imports: [ButtonModule, CardModule, FormsModule, InputTextModule, SelectModule, TranslatePipe],
  template: `
    <section class="page-header">
      <span class="eyebrow">{{ 'showroom.client.kicker' | translate }}</span>
      <h1>{{ 'showroom.client.title' | translate }}</h1>
      <p>{{ 'showroom.client.copy' | translate }}</p>
    </section>

    <section class="management-layout">
      <form class="management-form" (ngSubmit)="saveListing()">
        <h2>{{ 'showroom.client.formTitle' | translate }}</h2>
        <input pInputText name="title" required [(ngModel)]="draft.title" [placeholder]="'showroom.fields.title' | translate" />
        <div class="form-grid">
          <p-select [options]="makes()" optionLabel="name" optionValue="id" name="makeId" required [(ngModel)]="draft.makeId" [placeholder]="'showroom.search.make' | translate" (onChange)="onMakeChange()" />
          <p-select [options]="models()" optionLabel="name" optionValue="id" name="modelId" required [(ngModel)]="draft.modelId" [placeholder]="'showroom.search.model' | translate" (onChange)="onModelChange()" />
          <p-select [options]="variants()" optionLabel="name" optionValue="id" name="variantId" required [(ngModel)]="draft.variantId" [placeholder]="'showroom.search.variant' | translate" />
          <p-select [options]="conditions()" optionLabel="name" optionValue="code" name="condition" required [(ngModel)]="draft.condition" [placeholder]="'showroom.search.condition' | translate" />
          <input pInputText type="number" name="modelYear" required [(ngModel)]="draft.modelYear" [placeholder]="'showroom.fields.year' | translate" />
          <input pInputText type="number" name="price" required [(ngModel)]="draft.price" [placeholder]="'showroom.fields.price' | translate" />
          <input pInputText type="number" name="mileage" required [(ngModel)]="draft.mileage" [placeholder]="'showroom.fields.mileage' | translate" />
          <input pInputText name="location" required [(ngModel)]="draft.location" [placeholder]="'showroom.fields.location' | translate" />
        </div>
        <textarea name="description" required [(ngModel)]="draft.description" [placeholder]="'showroom.fields.description' | translate"></textarea>
        @if (formError()) {
          <div class="state-panel error">{{ formError() | translate }}</div>
        }
        @if (fieldErrorList().length > 0) {
          <div class="state-panel error">
            @for (error of fieldErrorList(); track error) {
              <span>{{ error | translate }}</span>
            }
          </div>
        }
        <p-button type="submit" icon="pi pi-save" [label]="'showroom.actions.saveDraft' | translate" [disabled]="!canSave()" />
      </form>

      <div class="management-list">
        <div class="active-meter">
          <strong>{{ listings()?.activeCount ?? 0 }} / {{ listings()?.activeLimit ?? 5 }}</strong>
          <span>{{ 'showroom.client.activeUsage' | translate }}</span>
        </div>

        @if (loading()) {
          <div class="state-panel">{{ 'showroom.states.loading' | translate }}</div>
        } @else if ((listings()?.items?.length ?? 0) === 0) {
          <div class="state-panel">{{ 'showroom.client.empty' | translate }}</div>
        } @else {
          @for (listing of listings()?.items; track listing.id) {
            <p-card styleClass="management-card">
              <ng-template #title>{{ listing.title }}</ng-template>
              <ng-template #subtitle>{{ listing.make.name }} {{ listing.model.name }} - {{ listing.modelYear }}</ng-template>
              <div class="vehicle-meta">
                <span>{{ price(listing.price) }}</span>
                <span>{{ mileage(listing.mileage) }}</span>
                <span>{{ ('showroom.status.' + listing.status) | translate }}</span>
                <span>{{ listing.imageCount }} {{ 'showroom.upload.images' | translate }}</span>
              </div>
              <div class="button-row">
                <p-button icon="pi pi-check-circle" [label]="'showroom.actions.activate' | translate" [outlined]="true" (onClick)="changeStatus(listing, 'ACTIVE')" />
                <p-button icon="pi pi-pause-circle" [label]="'showroom.actions.deactivate' | translate" [outlined]="true" (onClick)="changeStatus(listing, 'INACTIVE')" />
                <p-button icon="pi pi-tag" [label]="'showroom.actions.markSold' | translate" [outlined]="true" (onClick)="changeStatus(listing, 'SOLD')" />
                <p-button icon="pi pi-box" [label]="'showroom.actions.archive' | translate" [outlined]="true" (onClick)="changeStatus(listing, 'ARCHIVED')" />
                <p-button icon="pi pi-trash" [label]="'showroom.actions.delete' | translate" severity="danger" [outlined]="true" (onClick)="deleteListing(listing)" />
              </div>
              <label class="upload-line">
                <span>{{ 'showroom.upload.addImage' | translate }}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" (change)="uploadImage(listing, $event)" />
              </label>
            </p-card>
          }
        }
      </div>
    </section>
  `,
})
export class ClientListingsPage implements OnInit {
  private readonly catalog = inject(CatalogApiService);
  private readonly listingApi = inject(ClientListingApiService);
  private readonly optionLoader = inject(VehicleOptionLoaderService);

  readonly makes = signal<ShowroomMake[]>([]);
  readonly models = signal<ShowroomModel[]>([]);
  readonly variants = signal<ShowroomVariant[]>([]);
  readonly conditions = signal<VehicleDefinitionCatalogItem[]>([]);
  readonly listings = signal<ClientListingsDto | null>(null);
  readonly loading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly fieldErrorList = signal<string[]>([]);
  readonly price = formatCurrency;
  readonly mileage = formatMileage;

  readonly draft: ListingInputDto = {
    makeId: '',
    modelId: '',
    variantId: '',
    title: '',
    modelYear: new Date().getFullYear(),
    price: 0,
    currency: 'USD',
    mileage: 0,
    condition: 'USED',
    location: '',
    description: '',
    status: 'DRAFT',
  };

  canSave(): boolean {
    return Boolean(
      this.draft.title &&
        this.draft.makeId &&
        this.draft.modelId &&
        this.draft.variantId &&
        this.draft.price > 0 &&
        this.draft.description.length >= 20,
    );
  }

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadOptions(), this.loadListings()]);
  }

  async saveListing(): Promise<void> {
    this.formError.set(null);
    this.fieldErrors.set({});
    this.fieldErrorList.set([]);

    try {
      await firstValueFrom(this.listingApi.create(this.draft));
      Object.assign(this.draft, {
        makeId: '',
        modelId: '',
        variantId: '',
        title: '',
        price: 0,
        mileage: 0,
        description: '',
      });
      await this.loadListings();
    } catch (error) {
      this.captureFieldErrors(error);
      this.formError.set('showroom.error.validation');
    }
  }

  onMakeChange(): void {
    this.draft.modelId = '';
    this.draft.variantId = '';
    this.models.set([]);
    this.variants.set([]);
    void this.loadModels();
  }

  onModelChange(): void {
    this.draft.variantId = '';
    this.variants.set([]);
    void this.loadVariants();
  }

  async changeStatus(listing: ListingSummaryDto, status: CarListingStatus): Promise<void> {
    try {
      await firstValueFrom(this.listingApi.changeStatus(listing.id, status));
      await this.loadListings();
    } catch {
      this.formError.set(status === 'ACTIVE' ? 'showroom.error.activeListingLimit' : 'showroom.error.requestFailed');
    }
  }

  async deleteListing(listing: ListingSummaryDto): Promise<void> {
    await firstValueFrom(this.listingApi.delete(listing.id));
    await this.loadListings();
  }

  async uploadImage(listing: ListingSummaryDto, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    try {
      await firstValueFrom(this.listingApi.uploadImage(listing.id, file, { isPrimary: listing.imageCount === 0 }));
      await this.loadListings();
    } catch {
      this.formError.set('showroom.error.invalidImageType');
    } finally {
      input.value = '';
    }
  }

  private async loadOptions(): Promise<void> {
    const [makes, conditions] = await Promise.all([
      firstValueFrom(this.catalog.options<ShowroomMake>('makes', { limit: 100 })),
      firstValueFrom(this.catalog.options<VehicleDefinitionCatalogItem>('conditions', { limit: 20 })),
    ]);
    this.makes.set(makes.items);
    this.conditions.set(conditions.items);
  }

  private async loadModels(): Promise<void> {
    if (!this.draft.makeId) {
      return;
    }

    const state = await firstValueFrom(
      this.optionLoader.load<ShowroomModel>(
        {
          key: 'client-listing-models',
          entity: 'models',
          parentKeys: ['makeId'],
          parentParamMap: { makeId: 'makeId' },
        },
        { makeId: this.draft.makeId },
      ),
    );

    if (state.status !== 'stale') {
      this.models.set(state.items);
    }
  }

  private async loadVariants(): Promise<void> {
    if (!this.draft.modelId) {
      return;
    }

    const state = await firstValueFrom(
      this.optionLoader.load<ShowroomVariant>(
        {
          key: 'client-listing-trims',
          entity: 'trims',
          parentKeys: ['modelId'],
          parentParamMap: { modelId: 'modelId' },
        },
        { modelId: this.draft.modelId },
      ),
    );

    if (state.status !== 'stale') {
      this.variants.set(state.items);
    }
  }

  private async loadListings(): Promise<void> {
    this.loading.set(true);

    try {
      this.listings.set(await firstValueFrom(this.listingApi.listMine()));
    } finally {
      this.loading.set(false);
    }
  }

  private captureFieldErrors(error: unknown): void {
    if (!(error instanceof HttpErrorResponse)) {
      return;
    }

    const fieldErrors = error.error?.fieldErrors as Record<string, string> | undefined;

    if (fieldErrors) {
      this.fieldErrors.set(fieldErrors);
      this.fieldErrorList.set(Object.values(fieldErrors));
    }
  }
}
