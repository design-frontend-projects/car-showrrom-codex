import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const clientRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./client-shell').then((m) => m.ClientShell),
    data: { animation: 'client' }
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile-page').then((m) => m.ProfilePage),
    data: { animation: 'profile' }
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./client-shell').then((m) => m.ClientShell),
    data: { animation: 'settings' }
  },
  {
    path: 'security',
    canActivate: [authGuard],
    loadComponent: () => import('./two-factor-page').then((m) => m.TwoFactorPage),
    data: { animation: 'security' }
  },
  {
    path: 'my-listings',
    canActivate: [authGuard],
    loadComponent: () => import('./client-listings-page').then((m) => m.ClientListingsPage),
    data: { animation: 'my-listings' }
  },
  {
    path: 'sell',
    canActivate: [authGuard],
    loadComponent: () => import('./client-listings-page').then((m) => m.ClientListingsPage),
    data: { animation: 'sell' }
  },
  {
    path: 'requests',
    canActivate: [authGuard],
    loadComponent: () => import('./client-requests-page').then((m) => m.ClientRequestsPage),
    data: { animation: 'client-requests' }
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in-page').then((m) => m.SignInPage),
    data: { animation: 'sign-in' }
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./invitation-onboarding-page').then((m) => m.InvitationOnboardingPage),
    data: { animation: 'invitation-onboarding' }
  }
];
