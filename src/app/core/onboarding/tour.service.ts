import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { driver, DriveStep } from 'driver.js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TourService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  startLandingTour(): void {
    this.startOnce('landing', [
      {
        element: '#top-navigation',
        popover: { title: 'Navigation', description: 'Browse inventory, services, rentals, and showroom details.' }
      },
      {
        element: '#auth-rail',
        popover: { title: 'Account rail', description: 'Register, sign in, or manage listings from this rail.' }
      },
      {
        element: '#hero-search',
        popover: { title: 'Quick discovery', description: 'Use showroom filters to start a purchase or rental journey.' }
      }
    ]);
  }

  startAdminTour(): void {
    this.startOnce('admin', [
      {
        element: '#admin-shell',
        popover: { title: 'Admin workspace', description: 'Operations teams can monitor inventory, leads, and listings here.' }
      }
    ]);
  }

  startClientTour(): void {
    this.startOnce('client', [
      {
        element: '#client-shell',
        popover: { title: 'Client workspace', description: 'Customers can track profile details, settings, and listings here.' }
      }
    ]);
  }

  private startOnce(key: string, steps: DriveStep[]): void {
    if (!environment.tours.enabled || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const storageKey = `${environment.tours.storageKey}.${key}`;
    if (localStorage.getItem(storageKey) === 'done') {
      return;
    }

    const hasTargets = steps.every((step) => !step.element || this.document.querySelector(String(step.element)));
    if (!hasTargets) {
      return;
    }

    driver({ showProgress: true, steps }).drive();
    localStorage.setItem(storageKey, 'done');
  }
}
