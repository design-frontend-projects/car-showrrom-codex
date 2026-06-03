import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideAngularModule } from 'lucide-angular';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { firstValueFrom } from 'rxjs';
import {
  VehicleDefinitionApiService,
} from '../../../core/showroom/vehicle-definition-api.service';
import {
  VehicleDefinitionEntity,
  VehicleDefinitionRecord,
} from '../../../core/showroom/showroom.models';
import {
  createDefinitionForm,
  DefinitionConfig,
  DefinitionField,
  DefinitionOptionSource,
  getDefinitionConfig,
  patchDefinitionForm,
  readDefinitionInput,
} from './admin-definition.util';

@Component({
  selector: 'app-admin-definition-entity-page',
  imports: [
    ButtonModule,
    DialogModule,
    InputTextModule,
    LucideAngularModule,
    ReactiveFormsModule,
    RouterLink,
    SelectModule,
    TagModule,
    TranslatePipe,
  ],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'admin.definitions.kicker' | translate }}</span>
      <h1>{{ config().titleKey | translate }}</h1>
      <p>{{ config().descriptionKey | translate }}</p>
      <div class="button-row">
        <p-button routerLink="/admin/definitions" [outlined]="true" icon="pi pi-arrow-left" [label]="'admin.definitions.back' | translate" />
        <p-button (onClick)="openCreate()" [label]="'admin.definitions.actions.create' | translate" styleClass="gap-2">
          <lucide-icon name="plus" size="18" />
        </p-button>
      </div>
    </section>

    <section class="definition-shell">
      <form class="definition-toolbar" (ngSubmit)="loadRecords()">
        <input pInputText type="search" [formControl]="searchControl" [placeholder]="'admin.definitions.search' | translate" />
        <label class="checkline">
          <input type="checkbox" [checked]="includeInactive()" (change)="includeInactive.set($any($event.target).checked); loadRecords()" />
          <span>{{ 'admin.definitions.includeInactive' | translate }}</span>
        </label>
        <p-button type="submit" [outlined]="true" [label]="'admin.definitions.actions.filter' | translate" styleClass="gap-2">
          <lucide-icon name="search" size="18" />
        </p-button>
      </form>

      <div class="sr-only" aria-live="polite">{{ announcement() }}</div>

      @if (error()) {
        <div class="state-panel error">{{ error() | translate }}</div>
      } @else if (loading()) {
        <div class="state-panel">{{ 'admin.definitions.states.loading' | translate }}</div>
      } @else if (records().length === 0) {
        <div class="state-panel">{{ 'admin.definitions.states.empty' | translate }}</div>
      } @else {
        <div class="definition-table-wrap">
          <table class="definition-table">
            <thead>
              <tr>
                <th>{{ 'admin.definitions.fields.name' | translate }}</th>
                <th>{{ 'admin.definitions.fields.metadata' | translate }}</th>
                <th>{{ 'admin.definitions.fields.status' | translate }}</th>
                <th>{{ 'admin.definitions.fields.actions' | translate }}</th>
              </tr>
            </thead>
            <tbody>
              @for (record of records(); track record.id) {
                <tr>
                  <td>
                    <strong>{{ record.name }}</strong>
                    @if (readValue(record, 'code')) {
                      <span>{{ readValue(record, 'code') }}</span>
                    }
                  </td>
                  <td>{{ metadata(record) }}</td>
                  <td>
                    <p-tag [value]="(readValue(record, 'isActive') ? 'admin.definitions.status.active' : 'admin.definitions.status.inactive') | translate" [severity]="readValue(record, 'isActive') ? 'success' : 'secondary'" />
                  </td>
                  <td>
                    <div class="icon-actions">
                      <button type="button" [title]="'admin.definitions.actions.edit' | translate" (click)="openEdit(record)">
                        <lucide-icon name="pencil" size="17" />
                      </button>
                      <button type="button" [title]="'admin.definitions.actions.delete' | translate" (click)="deactivate(record)">
                        <lucide-icon name="trash-2" size="17" />
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </section>

    <p-dialog
      [header]="dialogTitle() | translate"
      [visible]="dialogOpen()"
      (visibleChange)="dialogOpen.set($event)"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(94vw, 42rem)' }"
    >
      <form class="definition-form" [formGroup]="form" (ngSubmit)="save()">
        @for (field of config().fields; track field.key) {
          @if (field.type === 'checkbox') {
            <label class="checkline">
              <input type="checkbox" [formControlName]="field.key" />
              <span>{{ field.labelKey | translate }}</span>
            </label>
          } @else if (field.type === 'select') {
            <label>
              <span>{{ field.labelKey | translate }}</span>
              <p-select
                [options]="options(field.options)"
                optionLabel="name"
                optionValue="id"
                [filter]="true"
                [showClear]="!field.required"
                [formControlName]="field.key"
                [placeholder]="field.labelKey | translate"
              />
              @if (form.get(field.key)?.invalid && form.get(field.key)?.touched) {
                <small>{{ 'admin.definitions.validation.required' | translate }}</small>
              }
            </label>
          } @else {
            <label>
              <span>{{ field.labelKey | translate }}</span>
              <input pInputText [type]="field.type" [formControlName]="field.key" />
              @if (form.get(field.key)?.invalid && form.get(field.key)?.touched) {
                <small>{{ 'admin.definitions.validation.required' | translate }}</small>
              }
            </label>
          }
        }

        <div class="button-row">
          <p-button type="submit" [disabled]="form.invalid || saving()" [label]="'admin.definitions.actions.save' | translate" />
          <p-button type="button" [outlined]="true" [label]="'admin.definitions.actions.cancel' | translate" (onClick)="dialogOpen.set(false)" />
        </div>
      </form>
    </p-dialog>
  `,
  styles: [
    `
      .definition-shell {
        width: min(100%, var(--content-max));
        margin: 0 auto var(--space-8);
        display: grid;
        gap: var(--space-4);
      }

      .definition-toolbar {
        display: grid;
        gap: var(--space-3);
        padding: var(--space-4);
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
      }

      .definition-table-wrap {
        overflow-x: auto;
        border: 1px solid var(--line);
        border-radius: var(--radius-md);
        background: var(--surface);
      }

      .definition-table {
        width: 100%;
        border-collapse: collapse;
      }

      .definition-table th,
      .definition-table td {
        padding: var(--space-3);
        border-bottom: 1px solid var(--line);
        text-align: start;
        vertical-align: top;
      }

      .definition-table td > span {
        display: block;
        color: var(--muted);
        margin-top: var(--space-1);
      }

      .definition-form {
        display: grid;
        gap: var(--space-3);
      }

      .definition-form label {
        display: grid;
        gap: var(--space-2);
        font-weight: 800;
      }

      .definition-form small {
        color: var(--danger);
      }

      .checkline {
        display: flex !important;
        align-items: center;
        gap: var(--space-2);
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
      }

      @media (min-width: 760px) {
        .definition-toolbar {
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
        }
      }
    `,
  ],
})
export class AdminDefinitionEntityPage implements OnInit {
  private readonly api = inject(VehicleDefinitionApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  readonly entity = signal<VehicleDefinitionEntity>('makes');
  readonly config = computed<DefinitionConfig>(() => getDefinitionConfig(this.entity()));
  readonly records = signal<VehicleDefinitionRecord[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly dialogOpen = signal(false);
  readonly editing = signal<VehicleDefinitionRecord | null>(null);
  readonly includeInactive = signal(true);
  readonly announcement = signal('');
  readonly searchControl = this.fb.control('');
  readonly optionState = signal<Record<DefinitionOptionSource, VehicleDefinitionRecord[]>>({
    makes: [],
    models: [],
    engines: [],
    transmissions: [],
    fuelTypes: [],
    bodyTypes: [],
  });
  form = createDefinitionForm(this.fb, this.config());
  readonly dialogTitle = computed(() =>
    this.editing() ? 'admin.definitions.actions.edit' : 'admin.definitions.actions.create',
  );

  async ngOnInit(): Promise<void> {
    this.entity.set((this.route.snapshot.paramMap.get('entity') as VehicleDefinitionEntity | null) ?? 'makes');
    this.form = createDefinitionForm(this.fb, this.config());
    await Promise.all([this.loadRecords(), this.loadOptions()]);
  }

  async loadRecords(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      this.records.set(
        await firstValueFrom(
          this.api.list(this.entity(), {
            q: this.searchControl.value ?? '',
            includeInactive: this.includeInactive(),
          }),
        ),
      );
    } catch {
      this.error.set('admin.definitions.errors.load');
      this.records.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async loadOptions(): Promise<void> {
    const load = (entity: VehicleDefinitionEntity) =>
      firstValueFrom(this.api.list(entity, { includeInactive: false })).catch(() => [] as VehicleDefinitionRecord[]);
    const [makes, models, engines, transmissions, fuelTypes, bodyTypes] = await Promise.all([
      load('makes'),
      load('models'),
      load('engines'),
      load('transmissions'),
      load('fuel-types'),
      load('body-types'),
    ]);

    this.optionState.set({ makes, models, engines, transmissions, fuelTypes, bodyTypes });
  }

  options(source: DefinitionOptionSource): VehicleDefinitionRecord[] {
    return this.optionState()[source] ?? [];
  }

  openCreate(): void {
    this.editing.set(null);
    this.form = createDefinitionForm(this.fb, this.config());
    patchDefinitionForm(this.form, null);
    this.dialogOpen.set(true);
  }

  openEdit(record: VehicleDefinitionRecord): void {
    this.editing.set(record);
    this.form = createDefinitionForm(this.fb, this.config());
    patchDefinitionForm(this.form, record);
    this.dialogOpen.set(true);
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const payload = readDefinitionInput(this.form.getRawValue());

    try {
      const editing = this.editing();
      if (editing) {
        await firstValueFrom(this.api.update(this.entity(), editing.id, payload));
        this.announcement.set('admin.definitions.announcements.updated');
      } else {
        await firstValueFrom(this.api.create(this.entity(), payload));
        this.announcement.set('admin.definitions.announcements.created');
      }

      this.dialogOpen.set(false);
      await Promise.all([this.loadRecords(), this.loadOptions()]);
    } catch {
      this.error.set('admin.definitions.errors.save');
      this.announcement.set('admin.definitions.announcements.failed');
    } finally {
      this.saving.set(false);
    }
  }

  async deactivate(record: VehicleDefinitionRecord): Promise<void> {
    if (!window.confirm(this.translate.instant('admin.definitions.confirmDeactivate'))) {
      return;
    }

    try {
      await firstValueFrom(this.api.deactivate(this.entity(), record.id));
      this.announcement.set('admin.definitions.announcements.deleted');
      await this.loadRecords();
    } catch {
      this.error.set('admin.definitions.errors.delete');
      this.announcement.set('admin.definitions.announcements.failed');
    }
  }

  metadata(record: VehicleDefinitionRecord): string {
    const values = ['make', 'model', 'country', 'code', 'description']
      .map((key) => this.readValue(record, key))
      .filter((value) => value !== null && value !== undefined && value !== '');

    return values.join(' · ') || '-';
  }

  readValue(record: VehicleDefinitionRecord, key: string): unknown {
    return (record as unknown as Record<string, unknown>)[key];
  }
}
