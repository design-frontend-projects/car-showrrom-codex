import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ResponsiveLayoutService } from '../../../core/layout/responsive-layout.service';
import { GoogleMapPicker } from '../../../shared/components/google-map-picker/google-map-picker';
import { MapLocationOverlay, MapRouteRequest, MapRouteResult, MapSelectedLocation } from '../../../shared/components/google-map-picker/google-map-picker.models';

@Component({
  selector: 'app-contact-page',
  imports: [ButtonModule, FormsModule, GoogleMapPicker, InputTextModule, TranslatePipe],
  template: `
    <section class="page-header compact-header">
      <span class="eyebrow">{{ 'nav.contactUs' | translate }}</span>
      <h1>{{ 'pages.contactUs.title' | translate }}</h1>
      <p>{{ 'pages.contactUs.copy' | translate }}</p>
    </section>

    <section class="contact-layout">
      <form class="contact-form">
        <input pInputText name="name" [placeholder]="'contact.name' | translate" />
        <input pInputText name="email" type="email" [placeholder]="'contact.email' | translate" />
        <input pInputText name="message" [placeholder]="'contact.message' | translate" />
        <p-button [label]="'contact.send' | translate" icon="pi pi-send" />
      </form>

      <section class="map-demo">
        <div class="map-copy">
          <span class="eyebrow">{{ 'maps.demoKicker' | translate }}</span>
          <h2>{{ 'maps.demoTitle' | translate }}</h2>
          <p>{{ 'maps.demoCopy' | translate }}</p>
        </div>

        <app-google-map-picker
          [locations]="showroomLocations"
          [center]="dubaiCenter"
          [zoom]="10"
          [route]="demoRoute"
          routeColor="#da291c"
          [height]="mapHeight()"
          [showCurrentLocation]="true"
          (locationSelected)="selectedLocation.set($event)"
          (searchLocationSelected)="selectedLocation.set($event)"
          (routeComputed)="routeSummary.set($event)"
        />

        @if (selectedLocation(); as selected) {
          <aside class="map-result">
            <span>{{ 'maps.selectedLocation' | translate }}</span>
            <strong>{{ selected.title }}</strong>
            @if (selected.address) {
              <small>{{ selected.address }}</small>
            }
          </aside>
        }

        @if (routeSummary(); as summary) {
          <aside class="map-result">
            <span>{{ 'maps.routeSummary' | translate }}</span>
            <strong>{{ summary.distanceText }} / {{ summary.durationText }}</strong>
          </aside>
        }
      </section>
    </section>
  `
})
export class ContactPage {
  private readonly layout = inject(ResponsiveLayoutService);
  readonly dubaiCenter: google.maps.LatLngLiteral = { lat: 25.2048, lng: 55.2708 };
  readonly selectedLocation = signal<MapSelectedLocation | null>(null);
  readonly routeSummary = signal<MapRouteResult | null>(null);
  readonly mapHeight = computed(() => (this.layout.isMobile() ? '340px' : this.layout.isTablet() ? '380px' : '420px'));

  readonly showroomLocations: MapLocationOverlay[] = [
    {
      id: 'downtown',
      title: 'Downtown Showroom',
      subtitle: 'Sheikh Mohammed bin Rashid Blvd, Dubai',
      position: { lat: 25.1972, lng: 55.2744 },
      iconColor: '#da291c',
      metadata: { department: 'sales' }
    },
    {
      id: 'marina',
      title: 'Marina Delivery Hub',
      subtitle: 'Dubai Marina, Dubai',
      position: { lat: 25.0806, lng: 55.1403 },
      iconColor: '#181818',
      metadata: { department: 'delivery' }
    },
    {
      id: 'service',
      title: 'Al Quoz Service Center',
      subtitle: 'Al Quoz Industrial Area, Dubai',
      position: { lat: 25.1436, lng: 55.2262 },
      iconColor: '#303030',
      metadata: { department: 'service' }
    }
  ];

  readonly demoRoute: MapRouteRequest = {
    origin: this.showroomLocations[0].position,
    destination: this.showroomLocations[2].position,
    travelMode: 'DRIVING'
  };
}
