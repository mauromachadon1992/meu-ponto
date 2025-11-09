import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { toast } from 'ngx-sonner';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.user();

  if (!user) {
    toast.error('Acesso negado', {
      description: 'Você precisa fazer login primeiro.',
    });
    router.navigate(['/login']);
    return false;
  }

  if (!user.isAdmin) {
    toast.error('Acesso restrito', {
      description: 'Apenas administradores podem acessar esta área.',
    });
    router.navigate(['/fechamento']);
    return false;
  }

  return true;
};
