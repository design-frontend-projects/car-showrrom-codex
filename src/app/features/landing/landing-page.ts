import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { UiSignalStore } from '../../state/ui-signal.store';
import { formatCurrency, formatMileage } from '../../utils/number-format.util';

@Component({
  selector: 'app-landing-page',
  imports: [ButtonModule, InputTextModule, RouterLink, TranslatePipe],
  template: `
    <section class="hero-band" [attr.data-density]="heroDensity()">
      <div class="hero-copy">
        <span class="eyebrow">{{ 'landing.kicker' | translate }}</span>
        <h1>{{ 'landing.title' | translate }}</h1>
        <p>{{ 'landing.subtitle' | translate }}</p>

        <div id="hero-search" class="hero-search">
          <input
            pInputText
            type="search"
            [placeholder]="'landing.searchPlaceholder' | translate"
            [value]="ui.searchTerm()"
            (input)="ui.updateSearchTerm($any($event.target).value)"
          />
          <p-button [label]="'landing.search' | translate" icon="pi pi-search" />
        </div>
      </div>

      <div class="hero-panel" aria-label="Featured vehicle">
        <span>{{ 'landing.featured' | translate }}</span>
        <strong>2025 Mercedes-Benz CLE 300</strong>
        <dl>
          <div><dt>{{ 'landing.price' | translate }}</dt><dd>{{ price(58800) }}</dd></div>
          <div><dt>{{ 'landing.mileage' | translate }}</dt><dd>{{ mileage(8200) }}</dd></div>
          <div><dt>{{ 'landing.status' | translate }}</dt><dd>Certified</dd></div>
        </dl>
      </div>
    </section>

    <section class="quick-grid" [attr.data-density]="heroDensity()" aria-label="Showroom categories">
      <a routerLink="/used-cars">
        <i class="pi pi-history"></i>
        <strong>{{ 'nav.usedCars' | translate }}</strong>
        <span>{{ 'landing.usedCopy' | translate }}</span>
      </a>
      <a routerLink="/new-cars">
        <i class="pi pi-sparkles"></i>
        <strong>{{ 'nav.newCars' | translate }}</strong>
        <span>{{ 'landing.newCopy' | translate }}</span>
      </a>
      <a routerLink="/services">
        <i class="pi pi-wrench"></i>
        <strong>{{ 'nav.services' | translate }}</strong>
        <span>{{ 'landing.servicesCopy' | translate }}</span>
      </a>
      <a routerLink="/rent">
        <i class="pi pi-key"></i>
        <strong>{{ 'nav.rent' | translate }}</strong>
        <span>{{ 'landing.rentCopy' | translate }}</span>
      </a>
    </section>
  `
})
export class LandingPage {
  readonly ui = inject(UiSignalStore);
  private readonly layout = inject(ResponsiveLayoutService);
  readonly heroDensity = computed(() => (this.layout.isDesktop() ? 'full' : this.layout.isTablet() ? 'medium' : 'compact'));
  readonly price = formatCurrency;
  readonly mileage = formatMileage;
}
