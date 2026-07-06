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
