import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { firstValueFrom } from 'rxjs';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { CatalogApiService } from '../../core/showroom/catalog-api.service';
import { VehicleInventoryCountersDto } from '../../core/showroom/showroom.models';
import { UiSignalStore } from '../../state/ui-signal.store';
import { formatCurrency, formatMileage } from '../../utils/number-format.util';

@Component({
  selector: 'app-landing-page',
  imports: [ButtonModule, FormsModule, InputTextModule, RouterLink, TranslatePipe],
  template: `
    <section class="hero-band" [attr.data-density]="heroDensity()">
      <div class="hero-copy">
        <span class="eyebrow">{{ 'landing.kicker' | translate }}</span>
        <h1>{{ 'landing.title' | translate }}</h1>
        <p>{{ 'landing.subtitle' | translate }}</p>

        <form id="hero-search" class="hero-search" (ngSubmit)="submitSearch()">
          <input
            pInputText
            type="search"
            [placeholder]="'landing.searchPlaceholder' | translate"
            name="landingSearch"
            [ngModel]="ui.searchTerm()"
            (ngModelChange)="ui.updateSearchTerm($event)"
          />
          <p-button type="submit" [label]="'landing.search' | translate" icon="pi pi-search" />
        </form>
      </div>

      <div class="hero-panel glass-panel" aria-label="Featured vehicle">
        <div class="panel-header">
          <span class="status-badge">Scuderia Certified</span>
          <span class="featured-label">{{ 'landing.featured' | translate }}</span>
        </div>
        <strong>2026 Ferrari SF90 Stradale</strong>
        <dl>
          <div><dt>{{ 'landing.price' | translate }}</dt><dd>{{ price(524000) }}</dd></div>
          <div><dt>{{ 'landing.mileage' | translate }}</dt><dd>{{ mileage(1200) }}</dd></div>
        </dl>
      </div>
    </section>

    <section class="brand-experience">
      <div class="experience-header">
        <h2>{{ 'landing.heritage.title' | translate }}</h2>
        <p>{{ 'landing.heritage.subtitle' | translate }}</p>
      </div>
      <div class="experience-grid">
        <div class="experience-card scuderia">
          <div class="card-content">
            <h3>{{ 'landing.heritage.scuderiaTitle' | translate }}</h3>
            <p>{{ 'landing.heritage.scuderiaCopy' | translate }}</p>
          </div>
        </div>
        <div class="experience-card v12">
          <div class="card-content">
            <h3>{{ 'landing.heritage.v12Title' | translate }}</h3>
            <p>{{ 'landing.heritage.v12Copy' | translate }}</p>
          </div>
        </div>
        <div class="experience-card atelier">
          <div class="card-content">
            <h3>{{ 'landing.heritage.customTitle' | translate }}</h3>
            <p>{{ 'landing.heritage.customCopy' | translate }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="quick-grid premium-grid" [attr.data-density]="heroDensity()" aria-label="Showroom categories">
      <a routerLink="/used-cars" class="grid-item">
        <i class="pi pi-history"></i>
        <div class="item-content">
          <strong>{{ 'nav.usedCars' | translate }}</strong>
          <span>{{ counterText('used') }}</span>
        </div>
      </a>
      <a routerLink="/new-cars" class="grid-item">
        <i class="pi pi-sparkles"></i>
        <div class="item-content">
          <strong>{{ 'nav.newCars' | translate }}</strong>
          <span>{{ counterText('new') }}</span>
        </div>
      </a>
      <a routerLink="/services" class="grid-item">
        <i class="pi pi-wrench"></i>
        <div class="item-content">
          <strong>{{ 'nav.services' | translate }}</strong>
          <span>{{ 'landing.servicesCopy' | translate }}</span>
        </div>
      </a>
      <a routerLink="/rent" class="grid-item">
        <i class="pi pi-key"></i>
        <div class="item-content">
          <strong>{{ 'nav.rent' | translate }}</strong>
          <span>{{ 'landing.rentCopy' | translate }}</span>
        </div>
      </a>
    </section>
  `
})
export class LandingPage implements OnInit {
  readonly ui = inject(UiSignalStore);
  private readonly catalog = inject(CatalogApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly layout = inject(ResponsiveLayoutService);
  readonly heroDensity = computed(() => (this.layout.isDesktop() ? 'full' : this.layout.isTablet() ? 'medium' : 'compact'));
  readonly counters = signal<VehicleInventoryCountersDto | null>(null);
  readonly countersLoading = signal(false);
  readonly countersFailed = signal(false);
  readonly price = formatCurrency;
  readonly mileage = formatMileage;
  private counterInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    void this.loadCounters();

    if (isPlatformBrowser(this.platformId)) {
      this.counterInterval = setInterval(() => void this.loadCounters(), 15_000);
      this.destroyRef.onDestroy(() => {
        if (this.counterInterval) {
          clearInterval(this.counterInterval);
        }
      });
    }
  }

  submitSearch(): void {
    void this.router.navigate(['/used-cars'], {
      queryParams: {
        q: this.ui.searchTerm() || null,
      },
    });
  }

  counterText(type: 'new' | 'used'): string {
    const counters = this.counters();

    if (this.countersLoading() && !counters) {
      return 'Loading inventory totals...';
    }

    if (!counters || this.countersFailed()) {
      return type === 'new' ? 'Browse latest showroom arrivals' : 'Browse inspected pre-owned vehicles';
    }

    const total = type === 'new' ? counters.newCars : counters.usedCars;
    const label = type === 'new' ? 'new cars available' : 'used cars available';

    return `${total.toLocaleString()} ${label}`;
  }

  private async loadCounters(): Promise<void> {
    this.countersLoading.set(true);
    this.countersFailed.set(false);

    try {
      const counters = await firstValueFrom(this.catalog.inventoryCounters());
      this.counters.set(counters);
    } catch {
      this.countersFailed.set(true);
    } finally {
      this.countersLoading.set(false);
    }
  }
}
