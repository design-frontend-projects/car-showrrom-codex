import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TenantContextService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly selectedTenantIdState = signal<string | null>(this.readPersistedTenantId());

  readonly selectedTenantId = this.selectedTenantIdState.asReadonly();

  setSelectedTenantId(tenantId: string): void {
    this.selectedTenantIdState.set(tenantId);
    this.persistTenantId(tenantId);
  }

  clearSelectedTenantId(): void {
    this.selectedTenantIdState.set(null);
    this.removePersistedTenantId();
  }

  private readPersistedTenantId(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      return localStorage.getItem(environment.auth.tenantStorageKey);
    } catch {
      return null;
    }
  }

  private persistTenantId(tenantId: string): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.setItem(environment.auth.tenantStorageKey, tenantId);
    } catch {
      // Storage can be unavailable in private browsing or locked-down contexts.
    }
  }

  private removePersistedTenantId(): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      localStorage.removeItem(environment.auth.tenantStorageKey);
    } catch {
      // Storage can be unavailable in private browsing or locked-down contexts.
    }
  }
}
