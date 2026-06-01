import { Routes } from '@angular/router';

export const clientRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./client-shell').then((m) => m.ClientShell),
    data: { animation: 'client' }
  },
  {
    path: 'profile',
    loadComponent: () => import('./client-shell').then((m) => m.ClientShell),
    data: { animation: 'profile' }
  },
  {
    path: 'settings',
    loadComponent: () => import('./client-shell').then((m) => m.ClientShell),
    data: { animation: 'settings' }
  },
  {
    path: 'my-listings',
    loadComponent: () => import('./client-shell').then((m) => m.ClientShell),
    data: { animation: 'my-listings' }
  },
  {
    path: 'sell',
    loadComponent: () => import('./client-shell').then((m) => m.ClientShell),
    data: { animation: 'sell' }
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./sign-in-page').then((m) => m.SignInPage),
    data: { animation: 'sign-in' }
  }
];
