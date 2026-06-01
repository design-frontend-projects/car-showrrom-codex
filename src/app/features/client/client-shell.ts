import { AfterViewInit, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
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

      <div class="metric-grid" [attr.data-density]="metricDensity()">
        <p-card><strong>3</strong><span>{{ 'client.saved' | translate }}</span></p-card>
        <p-card><strong>1</strong><span>{{ 'client.listings' | translate }}</span></p-card>
        <p-card><strong>2</strong><span>{{ 'client.appointments' | translate }}</span></p-card>
      </div>
    </section>
  `
})
export class ClientShell implements AfterViewInit {
  private readonly tours = inject(TourService);
  private readonly layout = inject(ResponsiveLayoutService);
  readonly metricDensity = computed(() => (this.layout.isDesktop() ? 'dense' : this.layout.isTablet() ? 'medium' : 'compact'));

  ngAfterViewInit(): void {
    queueMicrotask(() => this.tours.startClientTour());
  }
}
