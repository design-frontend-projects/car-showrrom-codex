import { AfterViewInit, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { TourService } from '../../core/onboarding/tour.service';

@Component({
  selector: 'app-admin-shell',
  imports: [ButtonModule, CardModule, TranslatePipe],
  template: `
    <section id="admin-shell" class="workspace-shell">
      <div class="page-header">
        <span class="eyebrow">{{ 'admin.kicker' | translate }}</span>
        <h1>{{ 'admin.title' | translate }}</h1>
        <p>{{ 'admin.copy' | translate }}</p>
      </div>

      <div class="metric-grid" [attr.data-density]="metricDensity()">
        <p-card><strong>128</strong><span>{{ 'admin.inventory' | translate }}</span></p-card>
        <p-card><strong>34</strong><span>{{ 'admin.leads' | translate }}</span></p-card>
        <p-card><strong>12</strong><span>{{ 'admin.pending' | translate }}</span></p-card>
      </div>
    </section>
  `
})
export class AdminShell implements AfterViewInit {
  private readonly tours = inject(TourService);
  private readonly layout = inject(ResponsiveLayoutService);
  readonly metricDensity = computed(() => (this.layout.isDesktop() ? 'dense' : this.layout.isTablet() ? 'medium' : 'compact'));

  ngAfterViewInit(): void {
    queueMicrotask(() => this.tours.startAdminTour());
  }
}
