import { AfterViewInit, Component, computed, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthFacade } from '../../core/auth/auth.facade';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { TourService } from '../../core/onboarding/tour.service';

@Component({
  selector: 'app-admin-shell',
  imports: [ButtonModule, CardModule, LucideAngularModule, RouterLink, TranslatePipe],
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

      <div class="button-row">
        <p-button routerLink="/admin/vehicles" icon="pi pi-car" label="Manage vehicles" />
        <p-button routerLink="/admin/vehicles/create" icon="pi pi-plus" label="Create vehicle" [outlined]="true" />
        @if (canManageRbac()) {
          <a routerLink="/admin/rbac/users" class="rbac-admin-link">
            <lucide-icon name="shield-check" size="18" />
            <span>{{ 'rbac.nav.workspace' | translate }}</span>
          </a>
        }
      </div>
    </section>
  `
})
export class AdminShell implements AfterViewInit {
  private readonly auth = inject(AuthFacade);
  private readonly tours = inject(TourService);
  private readonly layout = inject(ResponsiveLayoutService);
  readonly metricDensity = computed(() => (this.layout.isDesktop() ? 'dense' : this.layout.isTablet() ? 'medium' : 'compact'));
  readonly canManageRbac = computed(() => {
    const user = this.auth.user();

    return Boolean(
      user?.permissions.includes('showroom.admin.manage') ||
        user?.roles.some((role) => role === 'admin' || role === 'system-owner'),
    );
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => this.tours.startAdminTour());
  }
}
