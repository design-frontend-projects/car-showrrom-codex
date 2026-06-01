# Google Map Picker

Reusable SSR-safe Google Maps component for showing showroom locations, letting users search/select a place, and drawing a route between two destinations.

## Setup

Add a Google Maps API key to the active environment file:

```ts
googleMaps: {
  apiKey: 'YOUR_KEY',
  mapId: '',
  language: 'en',
  region: 'AE',
  libraries: ['maps', 'marker', 'places', 'routes', 'geocoding'] as const
}
```

The component renders a placeholder when `apiKey` is empty, so SSR and local builds do not fail.

## Inputs

- `locations: MapLocationOverlay[]` - optional marker list. Empty lists are valid and still allow search.
- `center: google.maps.LatLngLiteral` - initial map center. Default is Dubai.
- `zoom: number` - initial zoom. Default is `8`.
- `height: string` - CSS height for the map surface. Default is `420px`.
- `searchEnabled: boolean` - shows Places autocomplete search. Default is `true`.
- `route: MapRouteRequest | null` - origin/destination route to draw. Default is `null`.
- `routeColor: string` - polyline stroke color. Default is `#126f5b`.
- `fitBounds: boolean` - auto-fits all markers. Default is `true`.
- `showCurrentLocation: boolean` - asks browser geolocation and marks the user location. Default is `false`.
- `mapOptions: google.maps.MapOptions` - extra native map options.

## Outputs

- `locationSelected` - emits when a marker or current location is selected.
- `searchLocationSelected` - emits when a Places search result is selected.
- `routeComputed` - emits distance/duration when a route is successfully calculated.
- `mapReady` - emits the native `google.maps.Map`.
- `mapError` - emits recoverable loader, geolocation, search, or route errors.

## Example

```html
<app-google-map-picker
  [locations]="showrooms"
  [zoom]="10"
  [route]="demoRoute"
  routeColor="#0a0a0a"
  (locationSelected)="selectShowroom($event)"
  (searchLocationSelected)="selectSearchResult($event)"
  (routeComputed)="routeSummary.set($event)"
/>
```
