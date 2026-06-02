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
import { AdminRequestResult, VehicleRequestDto, VehicleRequestStatus } from '../../core/showroom/showroom.models';
import { formatCurrency } from '../../utils/number-format.util';

@Component({
  selector: 'app-admin-requests-page',
  imports: [ButtonModule, CardModule, DatePipe, FormsModule, InputTextModule, SelectModule, TranslatePipe],
  template: `
    <section class="page-header">
      <span class="eyebrow">{{ 'showroom.admin.kicker' | translate }}</span>
      <h1>{{ 'showroom.admin.requestsTitle' | translate }}</h1>
      <p>{{ 'showroom.admin.requestsCopy' | translate }}</p>
    </section>

    <section class="review-toolbar">
      <p-select [options]="statusOptions" optionLabel="label" optionValue="value" [(ngModel)]="status" [placeholder]="'showroom.admin.statusFilter' | translate" />
      <p-button icon="pi pi-filter" [label]="'showroom.actions.apply' | translate" (onClick)="load()" />
    </section>

    @if (error()) {
      <div class="state-panel error">{{ error() | translate }}</div>
    } @else if ((requests()?.items?.length ?? 0) === 0) {
      <div class="state-panel">{{ 'showroom.admin.empty' | translate }}</div>
    } @else {
      <section class="review-grid">
        @for (request of requests()?.items; track request.id) {
          <p-card styleClass="management-card">
            <ng-template #title>{{ request.preferredMake || 'Any make' }} {{ request.preferredModel }}</ng-template>
            <ng-template #subtitle>{{ request.client?.displayName }} - {{ request.createdAt | date: 'medium' }}</ng-template>
            <div class="vehicle-meta">
              <span>{{ ('showroom.requestStatus.' + request.status) | translate }}</span>
              <span>{{ price(request.budgetMin ?? 0) }} - {{ price(request.budgetMax ?? 0) }}</span>
              <span>{{ request.contactPreference }}</span>
            </div>
            <p>{{ request.notes }}</p>
            @if (request.status === 'PENDING_REVIEW') {
              <textarea [(ngModel)]="decisionNotes[request.id]" [placeholder]="'showroom.admin.decisionNote' | translate"></textarea>
              <div class="button-row">
                <p-button icon="pi pi-check" [label]="'showroom.actions.approve' | translate" (onClick)="review(request, 'APPROVED')" />
                <p-button icon="pi pi-times" severity="danger" [outlined]="true" [label]="'showroom.actions.reject' | translate" (onClick)="review(request, 'REJECTED')" />
              </div>
            } @else if (request.decisionNote) {
              <p>{{ request.decisionNote }}</p>
            }
          </p-card>
        }
      </section>
    }
  `,
})
export class AdminRequestsPage implements OnInit {
  private readonly requestApi = inject(VehicleRequestApiService);

  readonly requests = signal<AdminRequestResult | null>(null);
  readonly error = signal<string | null>(null);
  readonly price = formatCurrency;
  readonly statusOptions: { label: string; value: VehicleRequestStatus | undefined }[] = [
    { label: 'Pending', value: 'PENDING_REVIEW' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'All', value: undefined },
  ];
  status: VehicleRequestStatus | undefined = 'PENDING_REVIEW';
  decisionNotes: Record<string, string> = {};

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  async load(): Promise<void> {
    this.error.set(null);

    try {
      this.requests.set(await firstValueFrom(this.requestApi.listAdmin({ status: this.status, page: 1, pageSize: 20 })));
    } catch {
      this.error.set('showroom.error.accessDenied');
    }
  }

  async review(request: VehicleRequestDto, status: 'APPROVED' | 'REJECTED'): Promise<void> {
    try {
      await firstValueFrom(
        this.requestApi.review(request.id, {
          status,
          decisionNote: this.decisionNotes[request.id] || null,
        }),
      );
      await this.load();
    } catch {
      this.error.set('showroom.error.requestAlreadyReviewed');
    }
  }
}
