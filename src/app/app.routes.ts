import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/app-shell/app-shell').then((m) => m.AppShell),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/landing/landing-page').then((m) => m.LandingPage),
        data: { animation: 'landing' }
      },
      {
        path: 'used-cars',
        loadComponent: () => import('./features/landing/pages/catalog-page').then((m) => m.CatalogPage),
        data: { animation: 'used-cars', pageKey: 'usedCars' }
      },
      {
        path: 'new-cars',
        loadComponent: () => import('./features/landing/pages/catalog-page').then((m) => m.CatalogPage),
        data: { animation: 'new-cars', pageKey: 'newCars' }
      },
      {
        path: 'services',
        loadComponent: () => import('./features/landing/pages/content-page').then((m) => m.ContentPage),
        data: { animation: 'services', pageKey: 'services' }
      },
      {
        path: 'rent',
        loadComponent: () => import('./features/landing/pages/content-page').then((m) => m.ContentPage),
        data: { animation: 'rent', pageKey: 'rent' }
      },
      {
        path: 'about-us',
        loadComponent: () => import('./features/landing/pages/content-page').then((m) => m.ContentPage),
        data: { animation: 'about', pageKey: 'aboutUs' }
      },
      {
        path: 'contact-us',
        loadComponent: () => import('./features/landing/pages/contact-page').then((m) => m.ContactPage),
        data: { animation: 'contact' }
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes)
      },
      {
        path: 'client',
        loadChildren: () => import('./features/client/client.routes').then((m) => m.clientRoutes)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
