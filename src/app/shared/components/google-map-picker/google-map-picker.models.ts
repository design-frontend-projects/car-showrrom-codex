export interface MapLocationOverlay {
  id: string;
  title: string;
  position: google.maps.LatLngLiteral;
  subtitle?: string;
  iconUrl?: string;
  iconColor?: string;
  metadata?: Record<string, unknown>;
}

export type MapRouteEndpoint = google.maps.LatLngLiteral | string;

export interface MapRouteRequest {
  origin: MapRouteEndpoint;
  destination: MapRouteEndpoint;
  travelMode?: keyof typeof google.maps.TravelMode;
}

export interface MapSelectedLocation {
  title: string;
  position: google.maps.LatLngLiteral;
  address?: string;
  placeId?: string;
  source: 'overlay' | 'search' | 'current-location';
  metadata?: Record<string, unknown>;
}

export interface MapRouteResult {
  distanceText: string;
  distanceValue: number;
  durationText: string;
  durationValue: number;
  overviewPolyline?: string;
}
