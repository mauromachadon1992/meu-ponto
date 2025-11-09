import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'registro-ponto',
    pathMatch: 'full',
  },
  {
    path: 'registro-ponto',
    loadComponent: () =>
      import('./features/registro-ponto/registro-ponto.component').then(
        (m) => m.RegistroPontoComponent
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then((m) => m.LoginComponent),
    canActivate: [noAuthGuard],
  },
  {
    path: 'fechamento-ponto',
    loadComponent: () =>
      import('./features/fechamento-ponto/fechamento-lista.component').then(
        (m) => m.FechamentoListaComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'fechamento-ponto/:id',
    loadComponent: () =>
      import('./features/fechamento-ponto/fechamento-detalhes.component').then(
        (m) => m.FechamentoDetalhesComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
        canActivate: [authGuard, adminGuard],
      },
    ],
  },
  {
    path: 'configuracoes',
    loadComponent: () =>
      import('./features/configuracoes/configuracoes.component').then(
        (m) => m.ConfiguracoesComponent
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'cadastro-usuario',
    loadComponent: () =>
      import('./features/admin/cadastro-usuario.component').then(
        (m) => m.CadastroUsuarioComponent
      ),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: '**',
    redirectTo: 'registro-ponto',
  },
];
