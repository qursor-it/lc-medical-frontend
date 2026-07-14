import { Routes } from '@angular/router';

import { adminGuard, authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
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
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/pages/orders-dashboard-page/orders-dashboard-page').then(
        (m) => m.OrdersDashboardPage,
      ),
  },
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/orders/pages/orders-list-page/orders-list-page').then(
        (m) => m.OrdersListPage,
      ),
  },
  {
    path: 'invoices',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/invoices/pages/invoices-list-page/invoices-list-page').then(
        (m) => m.InvoicesListPage,
      ),
  },
  {
    path: 'payments',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/payments/pages/payments-list-page/payments-list-page').then(
        (m) => m.PaymentsListPage,
      ),
  },
  {
    path: 'uploads/orders',
    canActivate: [authGuard],
    data: { kind: 'orders' },
    loadComponent: () =>
      import('./features/uploads/pages/uploads-page/uploads-page').then((m) => m.UploadsPage),
  },
  {
    path: 'uploads/invoices',
    canActivate: [authGuard],
    data: { kind: 'invoices' },
    loadComponent: () =>
      import('./features/uploads/pages/uploads-page/uploads-page').then((m) => m.UploadsPage),
  },
  {
    path: 'uploads/payments',
    canActivate: [authGuard],
    data: { kind: 'paid-order-items' },
    loadComponent: () =>
      import('./features/uploads/pages/uploads-page/uploads-page').then((m) => m.UploadsPage),
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () =>
      import('./features/users/pages/users-page/users-page').then((m) => m.UsersPage),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
