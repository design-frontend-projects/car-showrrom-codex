import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { ProfilePage } from './profile-page';

describe('ProfilePage', () => {
  const profile = {
    id: '11111111-1111-4111-8111-111111111111',
    displayName: 'Ada Lovelace',
    email: 'ada@example.com',
    phone: null,
    avatarUrl: null,
    isActive: true,
    tenant: {
      id: '22222222-2222-4222-8222-222222222222',
      slug: 'public-showroom',
      name: 'Public Showroom',
    },
    roles: ['guest'],
    permissions: ['showroom.catalog.read'],
    twoFactorEnabled: true,
    twoFactorRequired: false,
    lastLoginAt: null,
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-02T08:00:00.000Z',
  };

  it('renders real profile fields and localized fallbacks', async () => {
    const fixture = await createFixture({ profile: vi.fn(() => of(profile)) });

    await settle(fixture);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Ada Lovelace');
    expect(text).toContain('ada@example.com');
    expect(text).toContain('Public Showroom');
    expect(text).toContain('Guest');
    expect(text).toContain('Not provided');
    expect(text).toContain('2FA enabled');
  });

  it('shows a localized error state when profile loading fails', async () => {
    const fixture = await createFixture({
      profile: vi.fn(() => throwError(() => ({ error: { code: 'profile.errors.requestFailed' } }))),
    });

    await settle(fixture);
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Profile unavailable');
    expect(text).toContain('We could not load your profile.');
  });
});

async function createFixture(api: Pick<AuthApiService, 'profile'>): Promise<ComponentFixture<ProfilePage>> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [ProfilePage],
    providers: [
      provideRouter([]),
      provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
      { provide: AuthApiService, useValue: api },
      {
        provide: ResponsiveLayoutService,
        useValue: {
          isDesktop: () => true,
          isTablet: () => false,
        },
      },
    ],
  }).compileComponents();

  const translate = TestBed.inject(TranslateService);
  translate.setTranslation('en', {
    profile: {
      kicker: 'Account profile',
      errorTitle: 'Profile unavailable',
      retry: 'Retry',
      actions: {
        security: 'Security',
        settings: 'Settings',
        manageSecurity: 'Manage security',
      },
      sections: {
        contact: 'Identity and contact',
        workspace: 'Workspace access',
        security: 'Security posture',
        timeline: 'Account timeline',
      },
      fields: {
        displayName: 'Display name',
        email: 'Email',
        phone: 'Phone',
        tenant: 'Tenant',
        tenantSlug: 'Tenant slug',
        roles: 'Roles',
        accountStatus: 'Account status',
        twoFactor: 'Two-factor authentication',
        securityAction: 'Security action',
        lastLogin: 'Last login',
        createdAt: 'Created',
        updatedAt: 'Updated',
      },
      fallback: {
        notProvided: 'Not provided',
        notAvailable: 'Not available',
        noRoles: 'No roles assigned',
      },
      status: {
        active: 'Active',
        inactive: 'Inactive',
        twoFactorEnabled: '2FA enabled',
        twoFactorRequired: '2FA required',
        twoFactorDisabled: '2FA not enabled',
      },
      errors: {
        requestFailed: 'We could not load your profile. Please try again.',
      },
    },
  });
  translate.use('en');

  return TestBed.createComponent(ProfilePage);
}

async function settle(fixture: ComponentFixture<ProfilePage>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}
