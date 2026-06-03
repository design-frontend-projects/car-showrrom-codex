import { TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AuthFacade } from '../../core/auth/auth.facade';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { TourService } from '../../core/onboarding/tour.service';
import { PreferenceService } from '../../core/preferences/preference.service';
import { AppShell } from './app-shell';

describe('AppShell admin navigation', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('shows the localized admin module link only when centralized auth allows admin access', async () => {
    const auth = createAuth(true);
    await configure(auth);

    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();
    await fixture.whenStable();

    const adminLink = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).find((link) =>
      link.getAttribute('href')?.includes('/admin'),
    );

    expect(adminLink?.textContent?.trim()).toBe('admin.nav.module');
  });

  it('hides the admin module link for non-admin users', async () => {
    const auth = createAuth(false);
    await configure(auth);

    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();
    await fixture.whenStable();

    const adminLinks = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('a')).filter((link) =>
      link.getAttribute('href')?.includes('/admin'),
    );

    expect(adminLinks).toHaveLength(0);
  });
});

async function configure(auth: ReturnType<typeof createAuth>): Promise<void> {
  await TestBed.configureTestingModule({
    imports: [AppShell],
    providers: [
      provideAnimations(),
      provideRouter([]),
      provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
      { provide: AuthFacade, useValue: auth },
      {
        provide: ResponsiveLayoutService,
        useValue: {
          mode: vi.fn(() => 'desktop'),
          isDesktop: vi.fn(() => true),
        },
      },
      {
        provide: PreferenceService,
        useValue: {
          themeMode: vi.fn(() => 'light'),
          language: vi.fn(() => 'en'),
          direction: vi.fn(() => 'ltr'),
          toggleLanguage: vi.fn(),
          setThemeMode: vi.fn(),
        },
      },
      {
        provide: TourService,
        useValue: {
          startLandingTour: vi.fn(),
        },
      },
    ],
  }).compileComponents();
}

function createAuth(canAccessAdmin: boolean) {
  return {
    canAccessAdmin: vi.fn(() => canAccessAdmin),
    isAuthenticated: vi.fn(() => true),
    user: vi.fn(() => ({
      id: 'user-id',
      tenantId: 'tenant-id',
      tenantSlug: 'tenant',
      displayName: 'Admin User',
      email: 'admin@example.com',
      phone: null,
      avatarUrl: null,
      roles: canAccessAdmin ? ['admin'] : ['user'],
      permissions: [],
      twoFactorEnabled: false,
      twoFactorRequired: false,
    })),
    register: vi.fn(),
    logoutLocal: vi.fn(),
    logoutGlobal: vi.fn(),
  };
}
