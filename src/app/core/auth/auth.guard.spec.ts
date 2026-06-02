import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthFacade } from './auth.facade';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('loads the session before allowing a cookie-authenticated route', async () => {
    let authenticated = false;
    const auth = {
      isAuthenticated: vi.fn(() => authenticated),
      status: vi.fn(() => 'anonymous' as const),
      loadSession: vi.fn(async () => {
        authenticated = true;
      }),
      requiresTwoFactor: vi.fn(() => false),
    };

    const result = await runGuard(auth);

    expect(auth.loadSession).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('redirects anonymous users after session loading confirms no user', async () => {
    const redirect = {};
    const auth = {
      isAuthenticated: vi.fn(() => false),
      status: vi.fn(() => 'anonymous' as const),
      loadSession: vi.fn(async () => undefined),
      requiresTwoFactor: vi.fn(() => false),
    };
    const router = {
      parseUrl: vi.fn(() => redirect),
    };

    const result = await runGuard(auth, router);

    expect(router.parseUrl).toHaveBeenCalledWith(environment.auth.unauthorizedRedirect);
    expect(result).toBe(redirect);
  });
});

function runGuard(auth: unknown, router: unknown = { parseUrl: vi.fn() }) {
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthFacade, useValue: auth },
      { provide: Router, useValue: router },
    ],
  });

  return TestBed.runInInjectionContext(() => authGuard({} as never, {} as never)) as Promise<unknown> | boolean;
}
