import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { firstValueFrom } from 'rxjs';
import { VehicleRequestApiService } from '../../core/showroom/vehicle-request-api.service';
import { VehicleRequestDto, VehicleRequestInputDto } from '../../core/showroom/showroom.models';
import { formatCurrency } from '../../utils/number-format.util';

@Component({
  selector: 'app-client-requests-page',
  imports: [ButtonModule, CardModule, DatePipe, FormsModule, InputTextModule, SelectModule, TranslatePipe],
  template: `
    <section class="page-header">
      <span class="eyebrow">{{ 'showroom.requests.kicker' | translate }}</span>
      <h1>{{ 'showroom.requests.title' | translate }}</h1>
      <p>{{ 'showroom.requests.copy' | translate }}</p>
    </section>

    <section class="management-layout">
      <form class="management-form" (ngSubmit)="submitRequest()">
        <input pInputText name="preferredMake" [(ngModel)]="draft.preferredMake" [placeholder]="'showroom.fields.make' | translate" />
        <input pInputText name="preferredModel" [(ngModel)]="draft.preferredModel" [placeholder]="'showroom.fields.model' | translate" />
        <input pInputText name="preferredVariant" [(ngModel)]="draft.preferredVariant" [placeholder]="'showroom.fields.variant' | translate" />
        <div class="form-grid">
          <input pInputText type="number" name="budgetMin" [(ngModel)]="draft.budgetMin" [placeholder]="'showroom.requests.budgetMin' | translate" />
          <input pInputText type="number" name="budgetMax" [(ngModel)]="draft.budgetMax" [placeholder]="'showroom.requests.budgetMax' | translate" />
          <p-select [options]="contactOptions" optionLabel="label" optionValue="value" name="contactPreference" [(ngModel)]="draft.contactPreference" [placeholder]="'showroom.requests.contactPreference' | translate" />
        </div>
        <textarea name="notes" [(ngModel)]="draft.notes" [placeholder]="'showroom.requests.notes' | translate"></textarea>
        <p-button type="submit" icon="pi pi-send" [label]="'showroom.requests.submit' | translate" />
      </form>

      <div class="management-list">
        @for (request of requests(); track request.id) {
          <p-card styleClass="management-card">
            <ng-template #title>{{ request.preferredMake || 'Any make' }} {{ request.preferredModel }}</ng-template>
            <ng-template #subtitle>{{ ('showroom.requestStatus.' + request.status) | translate }}</ng-template>
            <div class="vehicle-meta">
              <span>{{ price(request.budgetMin ?? 0) }} - {{ price(request.budgetMax ?? 0) }}</span>
              <span>{{ request.contactPreference }}</span>
              <span>{{ request.createdAt | date: 'mediumDate' }}</span>
            </div>
            @if (request.decisionNote) {
              <p>{{ request.decisionNote }}</p>
            }
          </p-card>
        } @empty {
          <div class="state-panel">{{ 'showroom.requests.empty' | translate }}</div>
        }
      </div>
    </section>
  `,
})
export class ClientRequestsPage implements OnInit {
  private readonly requestApi = inject(VehicleRequestApiService);

  readonly requests = signal<VehicleRequestDto[]>([]);
  readonly price = formatCurrency;
  readonly draft: VehicleRequestInputDto = {
    currency: 'USD',
    contactPreference: 'email',
  };
  readonly contactOptions = [
    { label: 'Email', value: 'email' },
    { label: 'Phone', value: 'phone' },
    { label: 'WhatsApp', value: 'whatsapp' },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadRequests();
  }

  async submitRequest(): Promise<void> {
    await firstValueFrom(this.requestApi.create(this.draft));
    Object.assign(this.draft, {
      preferredMake: null,
      preferredModel: null,
      preferredVariant: null,
      budgetMin: null,
      budgetMax: null,
      notes: null,
    });
    await this.loadRequests();
  }

  private async loadRequests(): Promise<void> {
    this.requests.set(await firstValueFrom(this.requestApi.listMine()));
  }
}
