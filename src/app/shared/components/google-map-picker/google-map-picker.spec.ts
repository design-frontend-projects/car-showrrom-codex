import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { GoogleMapPicker } from './google-map-picker';
import { MapLocationOverlay, MapRouteRequest } from './google-map-picker.models';

describe('GoogleMapPicker', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleMapPicker],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })]
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a missing-key state without loading Google Maps', () => {
    const fixture = TestBed.createComponent(GoogleMapPicker);

    fixture.detectChanges();

    expect(fixture.componentInstance.status()).toBe('missing-key');
    expect(fixture.nativeElement.textContent).toContain('maps.missingKeyTitle');
  });

  it('keeps empty overlays valid while search remains enabled by default', () => {
    const fixture = TestBed.createComponent(GoogleMapPicker);
    const component = fixture.componentInstance;

    fixture.detectChanges();

    expect(component.locations()).toEqual([]);
    expect(component.searchEnabled()).toBe(true);
    expect(component.zoom()).toBe(8);
  });

  it('emits selected overlay locations', () => {
    const fixture = TestBed.createComponent(GoogleMapPicker);
    const component = fixture.componentInstance;
    const emitted: unknown[] = [];
    const location: MapLocationOverlay = {
      id: 'service',
      title: 'Service Center',
      subtitle: 'Al Quoz',
      position: { lat: 25.1436, lng: 55.2262 },
      metadata: { department: 'service' }
    };
    component.locationSelected.subscribe((event) => emitted.push(event));

    component.handleOverlaySelection(location);

    expect(emitted).toEqual([
      {
        title: 'Service Center',
        address: 'Al Quoz',
        position: { lat: 25.1436, lng: 55.2262 },
        source: 'overlay',
        metadata: { department: 'service' }
      }
    ]);
  });

  it('emits selected Places search results', () => {
    const fixture = TestBed.createComponent(GoogleMapPicker);
    const component = fixture.componentInstance;
    const emitted: unknown[] = [];
    component.searchLocationSelected.subscribe((event) => emitted.push(event));

    component.handleSearchPlace({
      name: 'Dubai Mall',
      formatted_address: 'Downtown Dubai',
      place_id: 'place-1',
      geometry: {
        location: {
          toJSON: () => ({ lat: 25.1972, lng: 55.2796 })
        } as google.maps.LatLng
      } as google.maps.places.PlaceGeometry
    });

    expect(emitted).toEqual([
      {
        title: 'Dubai Mall',
        address: 'Downtown Dubai',
        placeId: 'place-1',
        position: { lat: 25.1972, lng: 55.2796 },
        source: 'search'
      }
    ]);
  });

  it('computes route output and route line path from DirectionsService', async () => {
    const fixture = TestBed.createComponent(GoogleMapPicker);
    const component = fixture.componentInstance;
    const emitted: unknown[] = [];
    const route: MapRouteRequest = {
      origin: { lat: 25.1972, lng: 55.2744 },
      destination: { lat: 25.1436, lng: 55.2262 }
    };
    component.routeComputed.subscribe((event) => emitted.push(event));
    vi.stubGlobal('google', {
      maps: {
        TravelMode: { DRIVING: 'DRIVING' },
        DirectionsService: class {
          route(): Promise<google.maps.DirectionsResult> {
            return Promise.resolve({
              routes: [
                {
                  overview_path: [
                    { toJSON: () => ({ lat: 25.1972, lng: 55.2744 }) },
                    { toJSON: () => ({ lat: 25.1436, lng: 55.2262 }) }
                  ],
                  overview_polyline: 'encoded-route',
                  legs: [
                    {
                      distance: { text: '12 km', value: 12000 },
                      duration: { text: '18 mins', value: 1080 }
                    }
                  ]
                }
              ]
            } as unknown as google.maps.DirectionsResult);
          }
        }
      }
    });

    await (component as unknown as { drawRoute(route: MapRouteRequest): Promise<void> }).drawRoute(route);

    expect(component.routePath()).toEqual([
      { lat: 25.1972, lng: 55.2744 },
      { lat: 25.1436, lng: 55.2262 }
    ]);
    expect(emitted).toEqual([
      {
        distanceText: '12 km',
        distanceValue: 12000,
        durationText: '18 mins',
        durationValue: 1080,
        overviewPolyline: 'encoded-route'
      }
    ]);
  });
});
