import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { HlmCard, HlmCardHeader, HlmCardTitle, HlmCardDescription, HlmCardContent } from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideKeyRound,
  lucideScanFace,
  lucideLoader,
  lucideCircleAlert,
} from '@ng-icons/lucide';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardDescription,
    HlmCardContent,
    HlmButton,
    HlmInput,
    HlmLabel,
    HlmIcon,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideKeyRound,
      lucideScanFace,
      lucideLoader,
      lucideCircleAlert,
    }),
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="flex justify-center mb-6">
            <img 
              src="/logo-animated.svg" 
              alt="Meu Ponto - Logo Animado" 
              class="w-36 h-36 animate-[fade-in_0.8s_ease-out] drop-shadow-lg" 
            />
          </div>
          <h1 class="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent animate-[fade-in_1s_ease-out]">
            Meu Ponto
          </h1>
          <p class="text-muted-foreground animate-[fade-in_1.2s_ease-out]">
            Sistema de Controle de Ponto
          </p>
        </div>

        <div hlmCard>
          <div hlmCardHeader class="text-center">
            <h3 hlmCardTitle>Bem-vindo</h3>
            <p hlmCardDescription>Entre usando seu PIN ou reconhecimento facial</p>
          </div>

          <div hlmCardContent class="space-y-6">
            <!-- Login com PIN -->
            <div class="space-y-4">
              <div class="space-y-2">
                <label hlmLabel for="pin">PIN de Acesso</label>
                <div class="relative">
                  <input
                    hlmInput
                    id="pin"
                    type="password"
                    inputmode="numeric"
                    maxlength="4"
                    placeholder="Digite seu PIN"
                    [(ngModel)]="pin"
                    (keyup.enter)="loginWithPin()"
                    [disabled]="authService.isLoading()"
                    class="pr-10"
                  />
                  <ng-icon
                    hlm
                    name="lucideKeyRound"
                    size="sm"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>

              <button
                hlmBtn
                class="w-full"
                [disabled]="!pin || pin.length < 4 || authService.isLoading()"
                (click)="loginWithPin()"
              >
                @if (authService.isLoading() && !isFaceAuth()) {
                  <ng-icon hlm name="lucideLoader" size="sm" class="mr-2 animate-spin" />
                  Verificando...
                } @else {
                  <ng-icon hlm name="lucideKeyRound" size="sm" class="mr-2" />
                  Entrar com PIN
                }
              </button>
            </div>

            <!-- Separador -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <span class="w-full border-t"></span>
              </div>
              <div class="relative flex justify-center text-xs uppercase">
                <span class="bg-card px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            <!-- Login com Face -->
            <button
              hlmBtn
              variant="outline"
              class="w-full"
              [disabled]="authService.isLoading()"
              (click)="loginWithFace()"
            >
              @if (authService.isLoading() && isFaceAuth()) {
                <ng-icon hlm name="lucideLoader" size="sm" class="mr-2 animate-spin" />
                Analisando rosto...
              } @else {
                <ng-icon hlm name="lucideScanFace" size="sm" class="mr-2" />
                Reconhecimento Facial
              }
            </button>

            <!-- Mensagem de Erro -->
            @if (authService.error()) {
              <div class="flex items-start gap-2 p-3 text-sm rounded-md bg-destructive/10 text-destructive">
                <ng-icon hlm name="lucideCircleAlert" size="sm" class="mt-0.5 flex-shrink-0" />
                <p>{{ authService.error() }}</p>
              </div>
            }
          </div>
        </div>

        <div class="text-center mt-6 space-y-2">
          <p class="text-xs text-muted-foreground">
            © 2025 Meu Ponto - Todos os direitos reservados
          </p>
          <p class="text-xs text-muted-foreground/60">
            Controle de ponto inteligente e seguro
          </p>
        </div>
      </div>
    </div>
  `,
  styles: `
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
})
export class LoginComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  pin = '';
  readonly isFaceAuth = signal(false);

  loginWithPin(): void {
    if (!this.pin || this.pin.length < 4) {
      toast.error('PIN inválido', {
        description: 'Digite um PIN com pelo menos 4 dígitos',
      });
      return;
    }

    this.isFaceAuth.set(false);
    this.authService.loginWithPin({ pin: this.pin }).subscribe({
      next: () => {
        toast.success('Login realizado', {
          description: 'Bem-vindo de volta!',
        });
        this.redirectAfterLogin();
      },
      error: (error) => {
        console.error('Erro no login:', error);
        toast.error('Erro no login', {
          description: 'PIN inválido ou usuário não encontrado',
        });
      },
    });
  }

  async loginWithFace(): Promise<void> {
    this.isFaceAuth.set(true);
    const result = await this.authService.authenticateWithFace();
    
    if (result.success) {
      toast.success('Login realizado', {
        description: 'Autenticação facial bem-sucedida!',
      });
      this.redirectAfterLogin();
    } else {
      console.error('Erro na autenticação facial:', result.error);
      toast.error('Erro na autenticação', {
        description: result.error || 'Não foi possível autenticar',
      });
      this.isFaceAuth.set(false);
    }
  }

  private redirectAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/fechamento-ponto';
    this.router.navigate([returnUrl]);
  }
}
