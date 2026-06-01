import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleMapsLoaderService {
  private readonly platformId = inject(PLATFORM_ID);
  private loadPromise: Promise<void> | null = null;
  private optionsApplied = false;

  get hasApiKey(): boolean {
    return environment.googleMaps.apiKey.trim().length > 0;
  }

  get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  load(): Promise<void> {
    if (!this.isBrowser) {
      return Promise.reject(new Error('Google Maps can only load in the browser.'));
    }

    if (!this.hasApiKey) {
      return Promise.reject(new Error('Google Maps API key is not configured.'));
    }

    this.applyOptions();

    this.loadPromise ??= Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
      importLibrary('places'),
      importLibrary('routes'),
      importLibrary('geocoding')
    ]).then(() => undefined);

    return this.loadPromise;
  }

  private applyOptions(): void {
    if (this.optionsApplied) {
      return;
    }

    setOptions({
      key: environment.googleMaps.apiKey,
      language: environment.googleMaps.language,
      region: environment.googleMaps.region,
      mapIds: environment.googleMaps.mapId ? [environment.googleMaps.mapId] : undefined,
      libraries: [...environment.googleMaps.libraries],
      v: 'weekly'
    });

    this.optionsApplied = true;
  }
}
