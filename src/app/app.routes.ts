import { Routes } from '@angular/router';

import { adminGuard, authGuard, permissionGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Accedi · Lc Medical',
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    title: 'Dashboard · Lc Medical',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/orders-dashboard-page/orders-dashboard-page').then(
        (m) => m.OrdersDashboardPage,
      ),
  },
  {
    path: 'orders',
    title: 'Ordini · Lc Medical',
    canActivate: [authGuard, permissionGuard('orders', 'view')],
    loadComponent: () =>
      import('./features/orders/pages/orders-list-page/orders-list-page').then(
        (m) => m.OrdersListPage,
      ),
  },
  {
    path: 'payments',
    title: 'Pagamenti · Lc Medical',
    canActivate: [authGuard, permissionGuard('payments', 'view')],
    loadComponent: () =>
      import('./features/payments/pages/payments-list-page/payments-list-page').then(
        (m) => m.PaymentsListPage,
      ),
  },
  {
    path: 'uploads/orders',
    title: 'Importa ordini · Lc Medical',
    canActivate: [authGuard, permissionGuard('orders', 'upload')],
    data: { kind: 'orders' },
    loadComponent: () =>
      import('./features/uploads/pages/uploads-page/uploads-page').then((m) => m.UploadsPage),
  },
  {
    path: 'uploads/payments',
    title: 'Importa pagamenti · Lc Medical',
    canActivate: [authGuard, permissionGuard('payments', 'upload')],
    data: { kind: 'paid-order-items' },
    loadComponent: () =>
      import('./features/uploads/pages/uploads-page/uploads-page').then((m) => m.UploadsPage),
  },
  {
    path: 'users',
    title: 'Utenti · Lc Medical',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/users/pages/users-page/users-page').then((m) => m.UsersPage),
  },
  {
    path: 'agents',
    title: 'Agenti · Lc Medical',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/agents/pages/agents-page/agents-page').then((m) => m.AgentsPage),
  },
  {
    path: 'agent-commissions',
    redirectTo: 'agents',
  },
  {
    path: 'settings',
    title: 'Impostazioni · Lc Medical',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/settings/pages/settings-page/settings-page').then((m) => m.SettingsPage),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
