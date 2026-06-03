import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';
import { rbacAdminGuard } from '../../core/rbac/rbac.guard';

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
  },
  {
    path: 'access-denied',
    canActivate: [authGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.AdminAccessDeniedPage),
    data: { animation: 'admin-access-denied' }
  },
  {
    path: 'rbac',
    pathMatch: 'full',
    redirectTo: 'rbac/users'
  },
  {
    path: 'rbac/users',
    canActivate: [authGuard, rbacAdminGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.RbacUsersPage),
    data: { animation: 'rbac-users', permission: 'showroom.admin.manage' }
  },
  {
    path: 'rbac/users/:userId',
    canActivate: [authGuard, rbacAdminGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.RbacUsersPage),
    data: { animation: 'rbac-user-detail', permission: 'showroom.admin.manage' }
  },
  {
    path: 'rbac/invitations',
    canActivate: [authGuard, rbacAdminGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.RbacInvitationsPage),
    data: { animation: 'rbac-invitations', permission: 'showroom.admin.manage' }
  },
  {
    path: 'rbac/roles',
    canActivate: [authGuard, rbacAdminGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.RbacRolesPage),
    data: { animation: 'rbac-roles', permission: 'showroom.admin.manage' }
  },
  {
    path: 'rbac/roles/:roleId',
    canActivate: [authGuard, rbacAdminGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.RbacRoleDetailPage),
    data: { animation: 'rbac-role-detail', permission: 'showroom.admin.manage' }
  },
  {
    path: 'rbac/permissions',
    canActivate: [authGuard, rbacAdminGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.RbacPermissionsPage),
    data: { animation: 'rbac-permissions', permission: 'showroom.admin.manage' }
  },
  {
    path: 'rbac/assignments',
    canActivate: [authGuard, rbacAdminGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.RbacPermissionsPage),
    data: { animation: 'rbac-assignments', permission: 'showroom.admin.manage' }
  },
  {
    path: 'rbac/audit',
    canActivate: [authGuard, rbacAdminGuard],
    loadComponent: () => import('./rbac/rbac-admin-pages').then((m) => m.RbacAuditPage),
    data: { animation: 'rbac-audit', permission: 'showroom.admin.manage' }
  }
];
