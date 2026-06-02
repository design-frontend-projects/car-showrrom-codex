import { HttpEventType, HttpResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ProgressBarModule } from 'primeng/progressbar';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TextareaModule } from 'primeng/textarea';
import { firstValueFrom } from 'rxjs';
import { AdminVehicleApiService } from '../../../core/showroom/admin-vehicle-api.service';
import { CatalogApiService } from '../../../core/showroom/catalog-api.service';
import {
  AdminVehicleImageQueueItem,
  CarBodyType,
  CarFuelType,
  CarListingCondition,
  CarListingStatus,
  CarTransmissionType,
  ListingDetailDto,
  ListingImageDto,
  ShowroomTaxonomy,
} from '../../../core/showroom/showroom.models';
import { formatCurrency, formatMileage } from '../../../utils/number-format.util';
import {
  ADMIN_FEATURES,
  AdminVehicleFormValue,
  buildAdminVehiclePayload,
  buildPreview,
  createImageQueueItem,
  formValueFromListing,
  reorderQueue,
} from './admin-vehicle-form.util';

@Component({
  selector: 'app-admin-vehicle-editor-page',
  imports: [
    ButtonModule,
    CardModule,
    DialogModule,
    InputTextModule,
    ProgressBarModule,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    TagModule,
    TextareaModule,
  ],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">Vehicle editor</span>
      <h1>{{ isEditMode() ? 'Edit listing' : 'Create vehicle' }}</h1>
      <p>Define the listing, stage images, preview the public card, then publish when ready.</p>
      <p-button routerLink="/admin/vehicles" icon="pi pi-arrow-left" label="Back to vehicles" [outlined]="true" />
    </section>

    @if (loading()) {
      <section class="state-panel">Loading vehicle definition...</section>
    } @else {
      <section class="vehicle-editor-layout">
        <form class="vehicle-editor-form" [formGroup]="form" (ngSubmit)="openPreviewDialog()">
          <section class="editor-section">
            <h2>Basic information</h2>
            <div class="form-grid">
              <label>
                <span>Make</span>
                <p-select [options]="taxonomy()?.makes ?? []" optionLabel="name" optionValue="id" formControlName="makeId" placeholder="Select make" (onChange)="resetModel()" />
              </label>
              <label>
                <span>Model</span>
                <p-select [options]="selectedModels()" optionLabel="name" optionValue="id" formControlName="modelId" placeholder="Select model" (onChange)="resetVariant()" />
              </label>
              <label>
                <span>Trim</span>
                <p-select [options]="selectedVariants()" optionLabel="name" optionValue="id" formControlName="variantId" placeholder="Select trim" (onChange)="syncVariantSpecs()" />
              </label>
              <label>
                <span>Year</span>
                <input pInputText type="number" formControlName="modelYear" />
              </label>
            </div>
            <label>
              <span>Listing title</span>
              <input pInputText formControlName="title" placeholder="2026 Range Rover Sport P400" />
            </label>
          </section>

          <section class="editor-section">
            <h2>Pricing</h2>
            <div class="form-grid">
              <label>
                <span>Original price</span>
                <input pInputText type="number" formControlName="originalPrice" />
              </label>
              <label>
                <span>Sale price</span>
                <input pInputText type="number" formControlName="salePrice" />
              </label>
              <label>
                <span>Discount</span>
                <input pInputText type="number" formControlName="discount" />
              </label>
              <label>
                <span>Status</span>
                <p-select [options]="statusOptions" optionLabel="label" optionValue="value" formControlName="status" />
              </label>
            </div>
          </section>

          <section class="editor-section">
            <h2>Specifications</h2>
            <div class="form-grid">
              <label>
                <span>Engine</span>
                <input pInputText formControlName="engine" placeholder="2.0L turbo hybrid" />
              </label>
              <label>
                <span>Transmission</span>
                <p-select [options]="transmissionOptions" optionLabel="label" optionValue="value" formControlName="transmission" />
              </label>
              <label>
                <span>Fuel type</span>
                <p-select [options]="fuelOptions" optionLabel="label" optionValue="value" formControlName="fuelType" />
              </label>
              <label>
                <span>Body type</span>
                <p-select [options]="bodyOptions" optionLabel="label" optionValue="value" formControlName="bodyType" />
              </label>
              <label>
                <span>Mileage</span>
                <input pInputText type="number" formControlName="mileage" />
              </label>
              <label>
                <span>Condition</span>
                <p-select [options]="conditionOptions" optionLabel="label" optionValue="value" formControlName="condition" />
              </label>
              <label>
                <span>Exterior color</span>
                <input pInputText formControlName="exteriorColorName" />
              </label>
              <label>
                <span>Interior color</span>
                <input pInputText formControlName="interiorColorName" />
              </label>
            </div>
            <label>
              <span>Location</span>
              <input pInputText formControlName="location" placeholder="Main showroom" />
            </label>
          </section>

          <section class="editor-section">
            <h2>Features</h2>
            <div class="feature-checklist">
              @for (feature of features; track feature) {
                <label class="feature-option">
                  <input type="checkbox" [checked]="isFeatureSelected(feature)" (change)="toggleFeature(feature, $event)" />
                  <span>{{ feature }}</span>
                </label>
              }
            </div>
          </section>

          <section class="editor-section">
            <h2>Description</h2>
            <textarea pTextarea formControlName="description" placeholder="Summarize condition, ownership, and selling points"></textarea>
          </section>

          <section class="editor-section">
            <h2>Images</h2>
            <div class="drop-zone" (dragover)="allowDrop($event)" (drop)="dropImages($event)">
              <i class="pi pi-upload"></i>
              <strong>Drop images here</strong>
              <span>JPEG, PNG, or WebP up to 5 MB each</span>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" (change)="selectImages($event)" />
            </div>

            @if (existingImages().length > 0) {
              <h3>Saved images</h3>
              <div class="image-grid">
                @for (image of existingImages(); track image.id; let index = $index) {
                  <article class="image-tile">
                    <img [src]="image.url" [alt]="image.altText ?? image.originalName" />
                    <div class="image-actions">
                      <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" [disabled]="index === 0" (onClick)="moveExistingImage(index, -1)" />
                      <p-button icon="pi pi-arrow-right" [rounded]="true" [text]="true" [disabled]="index === existingImages().length - 1" (onClick)="moveExistingImage(index, 1)" />
                      <p-button icon="pi pi-star" [rounded]="true" [text]="true" (onClick)="setPrimaryImage(image)" />
                      <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="deleteExistingImage(image)" />
                    </div>
                    @if (image.isPrimary) {
                      <p-tag value="Primary" severity="success" />
                    }
                  </article>
                }
              </div>
            }

            @if (queuedImages().length > 0) {
              <h3>Queued images</h3>
              <div class="image-grid">
                @for (item of queuedImages(); track item.id; let index = $index) {
                  <article class="image-tile" [attr.data-state]="item.status">
                    @if (item.previewUrl) {
                      <img [src]="item.previewUrl" [alt]="item.file.name" />
                    } @else {
                      <div class="image-placeholder">{{ item.file.name }}</div>
                    }
                    <div class="image-actions">
                      <p-button icon="pi pi-arrow-left" [rounded]="true" [text]="true" [disabled]="index === 0 || submitting()" (onClick)="moveQueuedImage(index, -1)" />
                      <p-button icon="pi pi-arrow-right" [rounded]="true" [text]="true" [disabled]="index === queuedImages().length - 1 || submitting()" (onClick)="moveQueuedImage(index, 1)" />
                      <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" [disabled]="submitting()" (onClick)="removeQueuedImage(item)" />
                    </div>
                    @if (item.status === 'uploading') {
                      <p-progressbar [value]="item.progress" />
                    } @else if (item.error) {
                      <small class="error-text">{{ item.error }}</small>
                    } @else {
                      <small>{{ item.status }}</small>
                    }
                  </article>
                }
              </div>
            }
          </section>

          @if (form.invalid && attemptedSubmit()) {
            <div class="state-panel error">Complete the required vehicle fields before preview.</div>
          }

          <div class="button-row editor-actions">
            <p-button type="submit" icon="pi pi-eye" label="Preview submission" [disabled]="submitting()" />
            <p-button routerLink="/admin/vehicles" icon="pi pi-times" label="Cancel" [outlined]="true" />
          </div>
        </form>

        <aside class="preview-panel">
          <p-card styleClass="vehicle-card">
            @if (preview().imageUrl) {
              <figure class="vehicle-media"><img [src]="preview().imageUrl ?? ''" [alt]="preview().title" /></figure>
            } @else {
              <figure class="vehicle-media preview-empty"><i class="pi pi-car"></i></figure>
            }
            <ng-template #title>{{ preview().title }}</ng-template>
            <ng-template #subtitle>{{ preview().subtitle || 'Select make, model, and trim' }}</ng-template>
            <div class="vehicle-meta">
              <span>{{ price(preview().price) }}</span>
              <span>{{ mileage(preview().mileage) }}</span>
              <span>{{ preview().condition }}</span>
              <span>{{ preview().location }}</span>
            </div>
            <div class="admin-tags">
              <p-tag [value]="preview().status" [severity]="preview().status === 'ACTIVE' ? 'success' : 'secondary'" />
              @if (preview().discount > 0) {
                <p-tag [value]="'Save ' + price(preview().discount)" severity="warn" />
              }
            </div>
          </p-card>
        </aside>
      </section>
    }

    <p-dialog
      header="Review vehicle listing"
      [modal]="true"
      [(visible)]="previewDialogVisible"
      [style]="{ width: 'min(44rem, 92vw)' }"
    >
      <div class="confirm-preview">
        <strong>{{ preview().title }}</strong>
        <span>{{ preview().subtitle }}</span>
        <dl>
          <div><dt>Price</dt><dd>{{ price(preview().price) }}</dd></div>
          <div><dt>Mileage</dt><dd>{{ mileage(preview().mileage) }}</dd></div>
          <div><dt>Status</dt><dd>{{ preview().status }}</dd></div>
          <div><dt>Queued images</dt><dd>{{ queuedImages().length }}</dd></div>
        </dl>
      </div>
      <div class="button-row dialog-actions">
        <p-button icon="pi pi-check" label="Confirm and save" [loading]="submitting()" (onClick)="confirmSubmit()" />
        <p-button icon="pi pi-times" label="Continue editing" [outlined]="true" (onClick)="previewDialogVisible = false" />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      .vehicle-editor-layout {
        display: grid;
        gap: var(--space-4);
        width: min(100%, var(--content-max));
        margin: 0 auto var(--space-8);
        align-items: start;
      }

      .vehicle-editor-form,
      .preview-panel {
        display: grid;
        gap: var(--space-4);
        min-width: 0;
      }

      .editor-section {
        display: grid;
        gap: var(--space-3);
        padding: var(--space-4);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
      }

      .editor-section h2,
      .editor-section h3 {
        margin: 0;
        font-size: 1rem;
        line-height: 1.1;
      }

      label {
        display: grid;
        gap: var(--space-2);
        color: var(--muted-strong);
        font-size: 0.88rem;
        font-weight: 850;
      }

      textarea {
        min-height: 9rem;
      }

      .feature-checklist,
      .image-grid {
        display: grid;
        gap: var(--space-3);
      }

      .feature-option {
        grid-template-columns: auto 1fr;
        align-items: center;
        padding: var(--space-3);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface-panel);
      }

      .drop-zone {
        position: relative;
        display: grid;
        place-items: center;
        gap: var(--space-2);
        min-height: 12rem;
        padding: var(--space-5);
        border: 1px dashed var(--line-strong);
        border-radius: var(--radius-md);
        background: var(--surface-panel);
        text-align: center;
      }

      .drop-zone input {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      .drop-zone i {
        color: var(--accent);
        font-size: 1.75rem;
      }

      .image-grid {
        grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
      }

      .image-tile {
        display: grid;
        gap: var(--space-2);
        min-width: 0;
        padding: var(--space-2);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface-panel);
      }

      .image-tile img,
      .image-placeholder {
        aspect-ratio: 4 / 3;
        width: 100%;
        border-radius: var(--radius-sm);
        object-fit: cover;
        background: var(--surface);
      }

      .image-placeholder {
        display: grid;
        place-items: center;
        padding: var(--space-2);
        color: var(--muted);
        font-size: 0.78rem;
        text-align: center;
      }

      .image-actions {
        display: flex;
        justify-content: center;
        gap: var(--space-1);
      }

      .preview-panel {
        position: sticky;
        top: calc(var(--topbar-height) + var(--space-4));
      }

      .preview-empty {
        display: grid;
        place-items: center;
        color: var(--muted);
      }

      .preview-empty i {
        font-size: 2rem;
      }

      .admin-tags,
      .dialog-actions,
      .editor-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }

      .confirm-preview {
        display: grid;
        gap: var(--space-3);
      }

      .confirm-preview strong {
        font-size: 1.4rem;
      }

      .confirm-preview dl {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--line);
      }

      .confirm-preview div {
        padding: var(--space-3);
        background: var(--surface-panel);
      }

      .confirm-preview dt {
        color: var(--muted);
        font-size: 0.78rem;
      }

      .confirm-preview dd {
        margin: var(--space-1) 0 0;
        font-weight: 900;
      }

      .error-text {
        color: var(--danger);
        font-weight: 850;
      }

      @media (min-width: 900px) {
        .vehicle-editor-layout {
          grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.38fr);
        }
      }
    `,
  ],
})
export class AdminVehicleEditorPage implements OnInit {
  private readonly api = inject(AdminVehicleApiService);
  private readonly catalog = inject(CatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly messages = inject(MessageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly attemptedSubmit = signal(false);
  readonly taxonomy = signal<ShowroomTaxonomy | null>(null);
  readonly listing = signal<ListingDetailDto | null>(null);
  readonly queuedImages = signal<AdminVehicleImageQueueItem[]>([]);
  readonly existingImages = signal<ListingImageDto[]>([]);
  readonly price = formatCurrency;
  readonly mileage = formatMileage;
  readonly features = ADMIN_FEATURES;
  previewDialogVisible = false;

  readonly listingId = computed(() => this.route.snapshot.paramMap.get('id'));
  readonly isEditMode = computed(() => Boolean(this.listingId()));

  readonly form = this.fb.nonNullable.group({
    makeId: ['', Validators.required],
    modelId: ['', Validators.required],
    variantId: ['', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(160)]],
    modelYear: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 2)]],
    originalPrice: [0, [Validators.min(0), Validators.max(99_999_999)]],
    salePrice: [0, [Validators.required, Validators.min(1), Validators.max(99_999_999)]],
    discount: [0, [Validators.min(0), Validators.max(99_999_999)]],
    mileage: [0, [Validators.required, Validators.min(0), Validators.max(5_000_000)]],
    condition: ['USED' as CarListingCondition, Validators.required],
    status: ['DRAFT' as CarListingStatus, Validators.required],
    location: ['', [Validators.required, Validators.maxLength(120)]],
    engine: [''],
    transmission: ['' as CarTransmissionType | ''],
    fuelType: ['' as CarFuelType | ''],
    bodyType: ['' as CarBodyType | ''],
    exteriorColorName: [''],
    interiorColorName: [''],
    features: [[] as string[]],
    description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(5000)]],
  });

  readonly formValue = signal<AdminVehicleFormValue>(this.readFormValue());

  readonly selectedModels = computed(() => {
    const makeId = this.formValue().makeId;

    return this.taxonomy()?.makes.find((make) => make.id === makeId)?.models ?? [];
  });

  readonly selectedVariants = computed(() => {
    const modelId = this.formValue().modelId;

    return this.selectedModels().find((model) => model.id === modelId)?.variants ?? [];
  });

  readonly selectedLabels = computed(() => {
    const value = this.formValue();
    const make = this.taxonomy()?.makes.find((item) => item.id === value.makeId);
    const model = make?.models?.find((item) => item.id === value.modelId);
    const variant = model?.variants?.find((item) => item.id === value.variantId);

    return {
      make: make?.name,
      model: model?.name,
      variant: variant?.name,
    };
  });

  readonly preview = computed(() => {
    const queuedImage = this.queuedImages().find((item) => item.previewUrl);
    const existingImage = this.existingImages().find((image) => image.isPrimary) ?? this.existingImages()[0];

    return buildPreview(this.formValue(), this.selectedLabels(), queuedImage?.previewUrl ?? existingImage?.url);
  });

  readonly statusOptions: { label: string; value: CarListingStatus }[] = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending review', value: 'PENDING_REVIEW' },
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

  readonly fuelOptions = enumOptions<CarFuelType>(['PETROL', 'DIESEL', 'HYBRID', 'PLUG_IN_HYBRID', 'ELECTRIC', 'LPG', 'OTHER']);
  readonly transmissionOptions = enumOptions<CarTransmissionType>(['AUTOMATIC', 'MANUAL', 'CVT', 'DUAL_CLUTCH', 'OTHER']);
  readonly bodyOptions = enumOptions<CarBodyType>(['SEDAN', 'SUV', 'COUPE', 'HATCHBACK', 'CONVERTIBLE', 'WAGON', 'PICKUP', 'VAN', 'CROSSOVER', 'OTHER']);

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formValue.set(this.readFormValue());
      this.syncDiscount();
    });
  }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);

    try {
      const taxonomy = await firstValueFrom(this.catalog.taxonomy());
      const listing = this.listingId()
        ? await firstValueFrom(this.api.detail(this.listingId() as string))
        : null;

      this.taxonomy.set(taxonomy);
      if (listing) {
        this.listing.set(listing);
        this.existingImages.set(listing.images);
        this.form.patchValue(formValueFromListing(listing));
        this.formValue.set(this.readFormValue());
      }
    } catch {
      this.messages.add({
        severity: 'error',
        summary: 'Inventory unavailable',
        detail: 'Select a tenant or sign in with showroom admin access to load vehicle data.',
      });
    } finally {
      this.loading.set(false);
    }
  }

  resetModel(): void {
    this.form.patchValue({ modelId: '', variantId: '' });
  }

  resetVariant(): void {
    this.form.patchValue({ variantId: '' });
  }

  syncVariantSpecs(): void {
    const variant = this.selectedVariants().find((item) => item.id === this.form.controls.variantId.value);

    if (!variant) {
      return;
    }

    this.form.patchValue({
      fuelType: variant.fuelType,
      transmission: variant.transmission,
      bodyType: variant.bodyType,
    });
  }

  isFeatureSelected(feature: string): boolean {
    return this.form.controls.features.value.includes(feature);
  }

  toggleFeature(feature: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.controls.features.value;
    const next = checked ? [...current, feature] : current.filter((item) => item !== feature);

    this.form.controls.features.setValue(next);
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
  }

  dropImages(event: DragEvent): void {
    event.preventDefault();
    this.addFiles(event.dataTransfer?.files);
  }

  selectImages(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(input.files);
    input.value = '';
  }

  moveQueuedImage(index: number, direction: -1 | 1): void {
    this.queuedImages.update((items) => reorderQueue(items, index, index + direction));
  }

  removeQueuedImage(item: AdminVehicleImageQueueItem): void {
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }

    this.queuedImages.update((items) => items.filter((candidate) => candidate.id !== item.id));
  }

  moveExistingImage(index: number, direction: -1 | 1): void {
    this.existingImages.update((items) => reorderQueue(items, index, index + direction));
  }

  async setPrimaryImage(image: ListingImageDto): Promise<void> {
    const listingId = this.listingId();

    if (!listingId) {
      return;
    }

    this.existingImages.set(await firstValueFrom(this.api.setPrimaryImage(listingId, image.id)));
  }

  async deleteExistingImage(image: ListingImageDto): Promise<void> {
    const listingId = this.listingId();

    if (!listingId) {
      return;
    }

    await firstValueFrom(this.api.deleteImage(listingId, image.id));
    this.existingImages.update((items) => items.filter((candidate) => candidate.id !== image.id));
  }

  openPreviewDialog(): void {
    this.attemptedSubmit.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.previewDialogVisible = true;
  }

  async confirmSubmit(): Promise<void> {
    this.previewDialogVisible = false;
    this.submitting.set(true);

    try {
      const payload = buildAdminVehiclePayload(this.readFormValue());
      const listing = this.listingId()
        ? await firstValueFrom(this.api.update(this.listingId() as string, payload))
        : await firstValueFrom(this.api.create(payload));

      this.listing.set(listing);
      await this.uploadQueuedImages(listing.id);
      await this.persistImageOrder(listing.id);
      this.messages.add({
        severity: 'success',
        summary: 'Vehicle saved',
        detail: `${listing.title} is ready in admin inventory.`,
      });
      await this.router.navigateByUrl('/admin/vehicles');
    } catch {
      this.messages.add({
        severity: 'error',
        summary: 'Save failed',
        detail: 'Review the vehicle fields and retry.',
      });
    } finally {
      this.submitting.set(false);
    }
  }

  private addFiles(files: FileList | null | undefined): void {
    if (!files?.length) {
      return;
    }

    const next = Array.from(files).map((file) => createImageQueueItem(file));
    this.queuedImages.update((items) => [...items, ...next]);
  }

  private async uploadQueuedImages(listingId: string): Promise<void> {
    for (const item of this.queuedImages()) {
      if (item.status === 'succeeded' || item.error) {
        continue;
      }

      this.updateQueueItem(item.id, { status: 'uploading', progress: 1, error: undefined });

      try {
        const uploaded = await this.uploadImage(listingId, item);
        this.existingImages.update((images) => [...images, uploaded]);
        this.updateQueueItem(item.id, { status: 'succeeded', progress: 100 });
      } catch {
        this.updateQueueItem(item.id, { status: 'failed', error: 'Upload failed. Retry from the editor.', progress: 0 });
      }
    }

    this.queuedImages.update((items) => items.filter((item) => item.status !== 'succeeded'));
  }

  private uploadImage(listingId: string, item: AdminVehicleImageQueueItem): Promise<ListingImageDto> {
    return new Promise((resolve, reject) => {
      this.api.uploadImage(listingId, item.file, { isPrimary: this.existingImages().length === 0 }).subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 50;
            this.updateQueueItem(item.id, { progress });
          }

          if (event instanceof HttpResponse && event.body) {
            resolve(event.body);
          }
        },
        error: reject,
      });
    });
  }

  private async persistImageOrder(listingId: string): Promise<void> {
    const imageIds = this.existingImages().map((image) => image.id);

    if (imageIds.length > 1) {
      this.existingImages.set(await firstValueFrom(this.api.reorderImages(listingId, imageIds)));
    }
  }

  private updateQueueItem(id: string, patch: Partial<AdminVehicleImageQueueItem>): void {
    this.queuedImages.update((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  private syncDiscount(): void {
    const originalPrice = Number(this.form.controls.originalPrice.value) || 0;
    const salePrice = Number(this.form.controls.salePrice.value) || 0;
    const discount = Math.max(0, originalPrice - salePrice);

    if (discount !== this.form.controls.discount.value) {
      this.form.controls.discount.setValue(discount, { emitEvent: false });
    }
  }

  private readFormValue(): AdminVehicleFormValue {
    return this.form.getRawValue();
  }
}

function enumOptions<T extends string>(values: T[]): { label: string; value: T }[] {
  return values.map((value) => ({
    value,
    label: value
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' '),
  }));
}
