import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShell),
    data: { animation: 'admin' }
  }
];
