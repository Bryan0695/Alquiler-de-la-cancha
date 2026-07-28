import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { jugadorGuard } from './core/guards/jugador.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/auth/registro/registro').then((m) => m.Registro),
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then((m) => m.MainLayout),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'canchas', pathMatch: 'full' },
      {
        path: 'canchas',
        canActivate: [jugadorGuard],
        loadComponent: () =>
          import('./features/canchas/canchas-buscar/canchas-buscar').then((m) => m.CanchasBuscar),
      },
      {
        path: 'canchas/:id/reservar',
        canActivate: [jugadorGuard],
        loadComponent: () =>
          import('./features/reservas/reserva-flow/reserva-flow').then((m) => m.ReservaFlow),
      },
      {
        path: 'reservas',
        canActivate: [jugadorGuard],
        loadComponent: () =>
          import('./features/reservas/reservas-list/reservas-list').then((m) => m.ReservasList),
      },
      {
        path: 'admin/canchas',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/canchas/canchas-list/canchas-list').then((m) => m.CanchasList),
      },
      {
        path: 'admin/reservas',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/reservas/reservas-admin/reservas-admin').then((m) => m.ReservasAdmin),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
