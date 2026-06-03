import { AfterViewInit, Component, computed, inject, signal } from '@angular/core';
import { animate, query, style, transition, trigger } from '@angular/animations';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthFacade } from '../../core/auth/auth.facade';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { TourService } from '../../core/onboarding/tour.service';
import { PreferenceService, ThemeMode } from '../../core/preferences/preference.service';
import { RegisterForm } from '../../shared/components/register-form/register-form';
import { RegisterRequest } from '../../core/auth/auth.models';

@Component({
  selector: 'app-shell',
  imports: [
    AvatarModule,
    ButtonModule,
    DialogModule,
    DrawerModule,
    MenuModule,
    RegisterForm,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe
  ],
  templateUrl: './app-shell.html',
  animations: [
    trigger('routeFade', [
      transition('* <=> *', [
        query(':enter, :leave', [style({ display: 'block', width: '100%' })], { optional: true }),
        query(':leave', [animate('140ms ease-out', style({ opacity: 0, transform: 'translateY(4px)' }))], { optional: true }),
        query(':enter', [style({ opacity: 0, transform: 'translateY(8px)' }), animate('180ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))], {
          optional: true
        })
      ])
    ])
  ]
})
export class AppShell implements AfterViewInit {
  readonly auth = inject(AuthFacade);
  readonly layout = inject(ResponsiveLayoutService);
  readonly preferences = inject(PreferenceService);
  private readonly translate = inject(TranslateService);
  private readonly tours = inject(TourService);
  readonly registerOpen = signal(false);
  readonly drawerOpen = signal(false);
  readonly usesDesktopNavigation = computed(() => this.layout.isDesktop());
  readonly compactAuth = computed(() => !this.layout.isDesktop());
  readonly canManageListings = computed(() => this.hasAnyRole(['manager', 'admin', 'showroom-manager', 'system-owner']));
  readonly canReviewRequests = computed(() => this.hasAnyRole(['admin', 'showroom-manager', 'system-owner']));
  readonly canManageRbac = computed(() => this.auth.canAccessAdmin());

  readonly userInitials = computed(() => {
    const name = this.auth.user()?.displayName ?? 'Guest User';
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  readonly userMenuItems = computed<MenuItem[]>(() => [
    { label: this.t('auth.account.profile'), icon: 'pi pi-user', routerLink: '/client/profile' },
    { label: this.t('auth.account.security'), icon: 'pi pi-shield', routerLink: '/client/security' },
    { label: this.t('auth.account.settings'), icon: 'pi pi-cog', routerLink: '/client/settings' },
    { label: this.t('auth.account.myListings'), icon: 'pi pi-list', routerLink: '/client/my-listings' },
    { label: this.t('showroom.requests.menu'), icon: 'pi pi-inbox', routerLink: '/client/requests' },
    { separator: true },
    { label: this.t('auth.signOut.local'), icon: 'pi pi-sign-out', command: () => this.auth.logoutLocal() },
    { label: this.t('auth.signOut.global'), icon: 'pi pi-power-off', command: () => this.auth.logoutGlobal() }
  ]);

  readonly navItems = [
    { labelKey: 'nav.usedCars', route: '/used-cars' },
    { labelKey: 'nav.newCars', route: '/new-cars' },
    { labelKey: 'nav.services', route: '/services' },
    { labelKey: 'nav.rent', route: '/rent' },
    { labelKey: 'nav.aboutUs', route: '/about-us' },
    { labelKey: 'nav.contactUs', route: '/contact-us' }
  ];

  readonly themeItems: { mode: ThemeMode; icon: string; labelKey: string }[] = [
    { mode: 'light', icon: 'pi pi-sun', labelKey: 'preferences.theme.light' },
    { mode: 'dark', icon: 'pi pi-moon', labelKey: 'preferences.theme.dark' },
    { mode: 'system', icon: 'pi pi-desktop', labelKey: 'preferences.theme.system' }
  ];

  ngAfterViewInit(): void {
    queueMicrotask(() => this.tours.startLandingTour());
  }

  async register(request: RegisterRequest): Promise<void> {
    await this.auth.register(request);

    if (this.auth.isAuthenticated()) {
      this.registerOpen.set(false);
    }
  }

  openDrawer(): void {
    if (!this.usesDesktopNavigation()) {
      this.drawerOpen.set(true);
    }
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  setThemeMode(themeMode: ThemeMode): void {
    this.preferences.setThemeMode(themeMode);
  }

  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] ?? 'root';
  }

  private t(key: string): string {
    this.preferences.language();
    return this.translate.instant(key);
  }

  private hasAnyRole(roles: string[]): boolean {
    const currentRoles = this.auth.user()?.roles ?? [];

    return roles.some((role) => currentRoles.includes(role));
  }

  private hasPermission(permission: string): boolean {
    return this.auth.user()?.permissions.includes(permission) ?? false;
  }
}
