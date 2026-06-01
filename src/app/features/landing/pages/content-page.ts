import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-content-page',
  imports: [ButtonModule, RouterLink, TranslatePipe],
  template: `
    <section class="page-header">
      <span class="eyebrow">{{ 'landing.kicker' | translate }}</span>
      <h1>{{ title() }}</h1>
      <p>{{ copy() }}</p>
      <p-button routerLink="/contact-us" [label]="'pages.cta' | translate" icon="pi pi-send" />
    </section>

    <section class="feature-list">
      @for (item of items(); track item) {
        <article>
          <i class="pi pi-check-circle"></i>
          <span>{{ item }}</span>
        </article>
      }
    </section>
  `
})
export class ContentPage {
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  readonly pageKey = computed(() => this.route.snapshot.data['pageKey'] as string);
  readonly title = computed(() => this.translate.instant(`pages.${this.pageKey()}.title`));
  readonly copy = computed(() => this.translate.instant(`pages.${this.pageKey()}.copy`));
  readonly items = computed(() => this.translate.instant(`pages.${this.pageKey()}.items`) as string[]);
}
