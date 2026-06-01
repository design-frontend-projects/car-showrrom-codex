import { Component, ElementRef, OnInit, ViewChild, computed, effect, inject, input, output, signal } from '@angular/core';
import { GoogleMap, MapInfoWindow, MapMarker, MapPolyline } from '@angular/google-maps';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { environment } from '../../../../environments/environment';
import { GoogleMapsLoaderService } from '../../../core/maps/google-maps-loader.service';
import { MapLocationOverlay, MapRouteRequest, MapRouteResult, MapSelectedLocation } from './google-map-picker.models';

type MapStatus = 'idle' | 'loading' | 'ready' | 'missing-key' | 'error';

@Component({
  selector: 'app-google-map-picker',
  imports: [ButtonModule, GoogleMap, InputTextModule, MapInfoWindow, MapMarker, MapPolyline, TranslatePipe],
  templateUrl: './google-map-picker.html',
  styleUrl: './google-map-picker.css'
})
export class GoogleMapPicker implements OnInit {
  private readonly loader = inject(GoogleMapsLoaderService);
  private autocomplete: google.maps.places.Autocomplete | null = null;
  private lastRouteKey = '';

  @ViewChild(GoogleMap) private googleMap?: GoogleMap;
  @ViewChild(MapInfoWindow) private infoWindow?: MapInfoWindow;
  @ViewChild('searchInput') set searchInput(ref: ElementRef<HTMLInputElement> | undefined) {
    this.searchInputRef = ref;
    this.initializeAutocomplete();
  }

  private searchInputRef?: ElementRef<HTMLInputElement>;

  readonly locations = input<MapLocationOverlay[]>([]);
  readonly center = input<google.maps.LatLngLiteral>({ lat: 25.2048, lng: 55.2708 });
  readonly zoom = input(8);
  readonly height = input('420px');
  readonly searchEnabled = input(true);
  readonly route = input<MapRouteRequest | null>(null);
  readonly routeColor = input('#126f5b');
  readonly fitBounds = input(true);
  readonly showCurrentLocation = input(false);
  readonly mapOptions = input<google.maps.MapOptions>({});

  readonly locationSelected = output<MapSelectedLocation>();
  readonly searchLocationSelected = output<MapSelectedLocation>();
  readonly routeComputed = output<MapRouteResult>();
  readonly mapReady = output<google.maps.Map>();
  readonly mapError = output<string>();

  readonly status = signal<MapStatus>('idle');
  readonly errorMessage = signal('');
  readonly selectedLocation = signal<MapSelectedLocation | null>(null);
  readonly selectedOverlay = signal<MapLocationOverlay | null>(null);
  readonly routePath = signal<google.maps.LatLngLiteral[]>([]);
  readonly currentPosition = signal<google.maps.LatLngLiteral | null>(null);

  readonly effectiveMapOptions = computed<google.maps.MapOptions>(() => ({
    fullscreenControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    clickableIcons: true,
    zoomControl: true,
    ...this.mapOptions(),
    mapId: this.mapOptions().mapId ?? (environment.googleMaps.mapId || undefined)
  }));

  readonly routeOptions = computed<google.maps.PolylineOptions>(() => ({
    strokeColor: this.routeColor(),
    strokeOpacity: 0.9,
    strokeWeight: 5
  }));

  constructor() {
    effect(() => {
      const status = this.status();
      const locations = this.locations();
      const route = this.route();
      const fitBounds = this.fitBounds();

      if (status !== 'ready') {
        return;
      }

      queueMicrotask(() => {
        if (fitBounds) {
          this.fitMapToLocations(locations);
        }
        void this.drawRoute(route);
      });
    });
  }

  ngOnInit(): void {
    if (!this.loader.isBrowser) {
      this.status.set('idle');
      return;
    }

    if (!this.loader.hasApiKey) {
      this.status.set('missing-key');
      return;
    }

    this.status.set('loading');
    this.loader
      .load()
      .then(() => {
        this.status.set('ready');
        this.initializeAutocomplete();
      })
      .catch((error: unknown) => this.setError(describeError(error)));
  }

  onMapInitialized(map: google.maps.Map): void {
    this.mapReady.emit(map);
    if (this.fitBounds()) {
      this.fitMapToLocations(this.locations());
    }
    if (this.showCurrentLocation()) {
      this.locateUser();
    }
    void this.drawRoute(this.route());
  }

  handleOverlaySelection(location: MapLocationOverlay, marker?: MapMarker): void {
    const selected: MapSelectedLocation = {
      title: location.title,
      address: location.subtitle,
      position: location.position,
      source: 'overlay',
      metadata: location.metadata
    };

    this.selectedOverlay.set(location);
    this.selectedLocation.set(selected);
    this.locationSelected.emit(selected);

    if (marker && this.infoWindow) {
      this.infoWindow.open(marker, false);
    }
  }

  handleSearchPlace(place: google.maps.places.PlaceResult): void {
    const position = place.geometry?.location?.toJSON();
    if (!position) {
      this.setError('Selected place does not include a map position.');
      return;
    }

    const selected: MapSelectedLocation = {
      title: place.name ?? 'Selected location',
      address: place.formatted_address,
      placeId: place.place_id,
      position,
      source: 'search'
    };

    this.selectedOverlay.set(null);
    this.selectedLocation.set(selected);
    this.searchLocationSelected.emit(selected);
    this.googleMap?.googleMap?.panTo(position);
    this.googleMap?.googleMap?.setZoom(Math.max(this.zoom(), 13));
  }

  locateUser(): void {
    if (!this.loader.isBrowser || !navigator.geolocation) {
      this.setError('Browser geolocation is not available.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const current = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const selected: MapSelectedLocation = {
          title: 'Current location',
          position: current,
          source: 'current-location'
        };

        this.currentPosition.set(current);
        this.selectedLocation.set(selected);
        this.locationSelected.emit(selected);
        this.googleMap?.googleMap?.panTo(current);
      },
      () => this.setError('Unable to read current location.')
    );
  }

  markerIcon(location: MapLocationOverlay): google.maps.Icon | google.maps.Symbol {
    if (location.iconUrl) {
      return {
        url: location.iconUrl,
        scaledSize: new google.maps.Size(34, 34)
      };
    }

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: location.iconColor ?? '#126f5b',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 9
    };
  }

  private initializeAutocomplete(): void {
    if (this.autocomplete || this.status() !== 'ready' || !this.searchEnabled() || !this.searchInputRef) {
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(this.searchInputRef.nativeElement, {
      fields: ['formatted_address', 'geometry', 'name', 'place_id'],
      types: ['geocode', 'establishment']
    });
    this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete?.getPlace();
      if (place) {
        this.handleSearchPlace(place);
      }
    });
  }

  private fitMapToLocations(locations: MapLocationOverlay[]): void {
    const map = this.googleMap?.googleMap;
    if (!map || locations.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    locations.forEach((location) => bounds.extend(location.position));
    const currentPosition = this.currentPosition();
    if (currentPosition) {
      bounds.extend(currentPosition);
    }
    map.fitBounds(bounds);
  }

  private async drawRoute(route: MapRouteRequest | null): Promise<void> {
    if (!route) {
      this.lastRouteKey = '';
      this.routePath.set([]);
      return;
    }

    const routeKey = `${JSON.stringify(route.origin)}:${JSON.stringify(route.destination)}:${route.travelMode ?? 'DRIVING'}:${this.routeColor()}`;
    if (routeKey === this.lastRouteKey) {
      return;
    }
    this.lastRouteKey = routeKey;

    try {
      const service = new google.maps.DirectionsService();
      const response = await service.route({
        origin: route.origin,
        destination: route.destination,
        travelMode: google.maps.TravelMode[route.travelMode ?? 'DRIVING']
      });
      const firstRoute = response.routes[0];
      const firstLeg = firstRoute?.legs[0];

      if (!firstRoute || !firstLeg) {
        this.setError('Route unavailable for the selected destinations.');
        return;
      }

      this.routePath.set(firstRoute.overview_path.map((point) => point.toJSON()));
      this.routeComputed.emit({
        distanceText: firstLeg.distance?.text ?? '',
        distanceValue: firstLeg.distance?.value ?? 0,
        durationText: firstLeg.duration?.text ?? '',
        durationValue: firstLeg.duration?.value ?? 0,
        overviewPolyline: firstRoute.overview_polyline
      });
    } catch (error) {
      this.setError(describeError(error));
    }
  }

  private setError(message: string): void {
    this.status.set('error');
    this.errorMessage.set(message);
    this.mapError.emit(message);
  }
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Google Maps could not complete the requested action.';
}
