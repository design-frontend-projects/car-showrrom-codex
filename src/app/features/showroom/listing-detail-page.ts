import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CarouselModule } from 'primeng/carousel';
import { TagModule } from 'primeng/tag';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from '../../core/showroom/catalog-api.service';
import { ListingDetailDto, ListingImageDto } from '../../core/showroom/showroom.models';
import { formatCurrency, formatMileage } from '../../utils/number-format.util';

@Component({
  selector: 'app-listing-detail-page',
  imports: [ButtonModule, CarouselModule, RouterLink, TagModule, TranslatePipe],
  template: `
    @if (loading()) {
      <section class="state-panel">{{ 'showroom.states.loading' | translate }}</section>
    } @else if (error()) {
      <section class="state-panel error">{{ error() | translate }}</section>
    } @else if (listing()) {
      <section class="detail-layout">
        <div class="gallery-panel">
          @if (images().length > 0) {
            <p-carousel [value]="images()" [numVisible]="1" [numScroll]="1" [circular]="images().length > 1">
              <ng-template let-image #item>
                <figure class="detail-media">
                  <img [src]="image.url" [alt]="image.altText || listing()?.title" />
                </figure>
              </ng-template>
            </p-carousel>
          } @else {
            <figure class="detail-media">
              <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80" [alt]="listing()?.title" />
            </figure>
          }
        </div>

        <article class="detail-copy">
          <a routerLink="/used-cars" class="text-link">{{ 'showroom.actions.backToResults' | translate }}</a>
          <h1>{{ listing()?.title }}</h1>
          <p-tag [value]="('showroom.status.' + listing()?.status) | translate" severity="contrast" />
          <div class="detail-price">{{ price(listing()?.price ?? 0) }}</div>
          <dl class="fact-grid">
            <div><dt>{{ 'showroom.fields.make' | translate }}</dt><dd>{{ listing()?.make?.name }}</dd></div>
            <div><dt>{{ 'showroom.fields.model' | translate }}</dt><dd>{{ listing()?.model?.name }}</dd></div>
            <div><dt>{{ 'showroom.fields.variant' | translate }}</dt><dd>{{ listing()?.variant?.name }}</dd></div>
            <div><dt>{{ 'showroom.fields.year' | translate }}</dt><dd>{{ listing()?.modelYear }}</dd></div>
            <div><dt>{{ 'showroom.fields.mileage' | translate }}</dt><dd>{{ mileage(listing()?.mileage ?? 0) }}</dd></div>
            <div><dt>{{ 'showroom.fields.location' | translate }}</dt><dd>{{ listing()?.location }}</dd></div>
            <div><dt>{{ 'showroom.fields.condition' | translate }}</dt><dd>{{ ('showroom.condition.' + listing()?.condition) | translate }}</dd></div>
            <div><dt>{{ 'showroom.fields.seller' | translate }}</dt><dd>{{ listing()?.seller?.displayName || ('showroom.fields.showroom' | translate) }}</dd></div>
          </dl>
          <p>{{ listing()?.description }}</p>

          <section class="history-strip">
            <strong>{{ 'showroom.details.history' | translate }}</strong>
            <span>{{ 'showroom.details.priceChanges' | translate }}: {{ listing()?.priceHistory?.length ?? 0 }}</span>
            <span>{{ 'showroom.details.modelChanges' | translate }}: {{ listing()?.modelHistory?.length ?? 0 }}</span>
          </section>
        </article>
      </section>
    }
  `,
})
export class ListingDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogApiService);

  readonly listing = signal<ListingDetailDto | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly price = formatCurrency;
  readonly mileage = formatMileage;

  readonly images = signal<ListingImageDto[]>([]);

  async ngOnInit(): Promise<void> {
    const listingId = this.route.snapshot.paramMap.get('listingId');

    if (!listingId) {
      this.error.set('showroom.error.listingNotFound');
      this.loading.set(false);
      return;
    }

    try {
      const listing = await firstValueFrom(this.catalog.detail(listingId));
      this.listing.set(listing);
      this.images.set(listing.images ?? []);
    } catch {
      this.error.set('showroom.error.listingNotFound');
    } finally {
      this.loading.set(false);
    }
  }
}
