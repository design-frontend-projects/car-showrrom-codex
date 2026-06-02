import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantContextService } from '../rbac/tenant-context.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
      clear: vi.fn(() => {
        storage = {};
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds authorization and tenant headers when a tenant is selected', () => {
    storage[environment.auth.tokenStorageKey] = 'access-token';
    storage[environment.auth.tenantStorageKey] = '11111111-1111-4111-8111-111111111111';
    let handledRequest: HttpRequest<unknown> | undefined;

    TestBed.configureTestingModule({
      providers: [
        TenantContextService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    });

    TestBed.runInInjectionContext(() => {
      authInterceptor(new HttpRequest('GET', '/api/rbac/users'), (request) => {
        handledRequest = request;
        return of(new HttpResponse({ status: 200 }));
      }).subscribe();
    });

    if (!handledRequest) {
      throw new Error('Expected the interceptor to forward the request.');
    }

    expect(handledRequest.headers.get('Authorization')).toBe('Bearer access-token');
    expect(handledRequest.headers.get('X-Tenant-Id')).toBe('11111111-1111-4111-8111-111111111111');
  });
});
