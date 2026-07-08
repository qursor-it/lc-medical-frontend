import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/pages/orders-dashboard-page/orders-dashboard-page').then(
        (m) => m.OrdersDashboardPage,
      ),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./features/orders/pages/orders-list-page/orders-list-page').then(
        (m) => m.OrdersListPage,
      ),
  },
  {
    path: 'invoices',
    loadComponent: () =>
      import('./features/invoices/pages/invoices-list-page/invoices-list-page').then(
        (m) => m.InvoicesListPage,
      ),
  },
  {
    path: 'uploads/orders',
    data: { kind: 'orders' },
    loadComponent: () =>
      import('./features/uploads/pages/uploads-page/uploads-page').then((m) => m.UploadsPage),
  },
  {
    path: 'uploads/invoices',
    data: { kind: 'invoices' },
    loadComponent: () =>
      import('./features/uploads/pages/uploads-page/uploads-page').then((m) => m.UploadsPage),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
