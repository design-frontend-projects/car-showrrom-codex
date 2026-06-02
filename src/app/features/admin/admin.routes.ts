import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    data: { animation: 'admin' }
  },
  {
    path: 'vehicles',
    canActivate: [authGuard],
    loadComponent: () => import('./vehicles/admin-vehicles-page').then((m) => m.AdminVehiclesPage),
    data: { animation: 'admin-vehicles' }
  },
  {
    path: 'vehicles/create',
    canActivate: [authGuard],
    loadComponent: () => import('./vehicles/admin-vehicle-editor-page').then((m) => m.AdminVehicleEditorPage),
    data: { animation: 'admin-vehicle-create' }
  },
  {
    path: 'vehicles/edit/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./vehicles/admin-vehicle-editor-page').then((m) => m.AdminVehicleEditorPage),
    data: { animation: 'admin-vehicle-edit' }
  },
  {
    path: 'requests',
    canActivate: [authGuard],
    loadComponent: () => import('./admin-requests-page').then((m) => m.AdminRequestsPage),
    data: { animation: 'admin-requests' }
  }
];
