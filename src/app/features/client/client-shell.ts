import { AfterViewInit, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { TourService } from '../../core/onboarding/tour.service';

@Component({
  selector: 'app-client-shell',
  imports: [CardModule, TranslatePipe],
  template: `
    <section id="client-shell" class="workspace-shell">
      <div class="page-header">
        <span class="eyebrow">{{ 'client.kicker' | translate }}</span>
        <h1>{{ 'client.title' | translate }}</h1>
        <p>{{ 'client.copy' | translate }}</p>
      </div>

      <div class="metric-grid">
        <p-card><strong>3</strong><span>{{ 'client.saved' | translate }}</span></p-card>
        <p-card><strong>1</strong><span>{{ 'client.listings' | translate }}</span></p-card>
        <p-card><strong>2</strong><span>{{ 'client.appointments' | translate }}</span></p-card>
      </div>
    </section>
  `
})
export class ClientShell implements AfterViewInit {
  private readonly tours = inject(TourService);

  ngAfterViewInit(): void {
    queueMicrotask(() => this.tours.startClientTour());
  }
}
