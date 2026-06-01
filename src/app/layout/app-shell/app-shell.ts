import { AfterViewInit, Component, computed, inject, signal } from '@angular/core';
import { animate, query, style, transition, trigger } from '@angular/animations';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DrawerModule } from 'primeng/drawer';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthFacade } from '../../core/auth/auth.facade';
import { ResponsiveLayoutService } from '../../core/layout/responsive-layout.service';
import { TourService } from '../../core/onboarding/tour.service';
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
  styleUrl: './app-shell.css',
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
  private readonly tours = inject(TourService);
  readonly registerOpen = signal(false);
  readonly drawerOpen = signal(false);
  readonly usesDesktopNavigation = computed(() => this.layout.isDesktop());
  readonly compactAuth = computed(() => !this.layout.isDesktop());

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

  readonly userMenuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', routerLink: '/client/profile' },
    { label: 'Settings', icon: 'pi pi-cog', routerLink: '/client/settings' },
    { label: 'My Listings', icon: 'pi pi-list', routerLink: '/client/my-listings' },
    { separator: true },
    { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.auth.signOut() }
  ];

  readonly navItems = [
    { labelKey: 'nav.usedCars', route: '/used-cars' },
    { labelKey: 'nav.newCars', route: '/new-cars' },
    { labelKey: 'nav.services', route: '/services' },
    { labelKey: 'nav.rent', route: '/rent' },
    { labelKey: 'nav.aboutUs', route: '/about-us' },
    { labelKey: 'nav.contactUs', route: '/contact-us' }
  ];

  ngAfterViewInit(): void {
    queueMicrotask(() => this.tours.startLandingTour());
  }

  register(request: RegisterRequest): void {
    this.auth.register(request);
  }

  openDrawer(): void {
    if (!this.usesDesktopNavigation()) {
      this.drawerOpen.set(true);
    }
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }

  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.activatedRouteData?.['animation'] ?? 'root';
  }
}
