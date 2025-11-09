import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toast } from 'ngx-sonner';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmAvatar, HlmAvatarFallback, HlmAvatarImage } from '@spartan-ng/helm/avatar';
import { BrnSheetImports } from '@spartan-ng/brain/sheet';
import { HlmSheetImports } from '@spartan-ng/helm/sheet';
import { BrnMenuTrigger } from '@spartan-ng/brain/menu';
import {
  HlmMenu,
  HlmMenuItem,
  HlmMenuSeparator,
  HlmMenuShortcut,
} from '@spartan-ng/helm/menu';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLogOut, lucideUser, lucideMenu, lucideClock, lucideX, lucideDollarSign, lucideSettings, lucideChevronDown } from '@ng-icons/lucide';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    HlmButton,
    HlmIcon,
    NgIcon,
    HlmAvatar,
    HlmAvatarImage,
    HlmAvatarFallback,
    BrnSheetImports,
    HlmSheetImports,
    BrnMenuTrigger,
    HlmMenu,
    HlmMenuItem,
    HlmMenuSeparator,
    HlmMenuShortcut,
  ],
  providers: [
    provideIcons({
      lucideLogOut,
      lucideUser,
      lucideMenu,
      lucideClock,
      lucideX,
      lucideDollarSign,
      lucideSettings,
      lucideChevronDown,
    }),
  ],
  template: `
    @if (authService.isAuthenticated()) {
      <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="flex h-16 items-center justify-between px-4 max-w-screen-2xl mx-auto">
          <!-- Logo e Nav Desktop -->
          <div class="flex items-center gap-8">
            <a routerLink="/fechamento-ponto" class="flex items-center gap-2 transition-transform hover:scale-105">
              <img src="/logo.svg" alt="Meu Ponto" class="h-9 w-9" />
              <span class="hidden font-bold text-lg sm:inline-block">Meu Ponto</span>
            </a>
            
            <nav class="hidden md:flex items-center gap-1">
              <a
                routerLink="/registro-ponto"
                routerLinkActive="bg-accent text-accent-foreground"
                class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Registrar Ponto
              </a>
              <a
                routerLink="/fechamento-ponto"
                routerLinkActive="bg-accent text-accent-foreground"
                [routerLinkActiveOptions]="{ exact: false }"
                class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
              >
                Fechamentos
              </a>
              @if (authService.user()?.isAdmin) {
                <a
                  routerLink="/admin/dashboard"
                  routerLinkActive="bg-accent text-accent-foreground"
                  class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Dashboard Admin
                </a>
                <a
                  routerLink="/configuracoes"
                  routerLinkActive="bg-accent text-accent-foreground"
                  class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                >
                  Configurações
                </a>
              }
            </nav>
          </div>

          <!-- User Info e Actions Desktop -->
          <div class="hidden md:flex items-center gap-3">
            @if (authService.user(); as user) {
              <button
                class="flex items-center gap-3 rounded-lg border px-3 py-2 bg-muted/50 hover:bg-muted transition-colors"
                [brnMenuTriggerFor]="userMenu"
              >
                <hlm-avatar size="sm">
                  <img hlmAvatarImage [src]="user.avatar || ''" [alt]="user.nome" />
                  <span hlmAvatarFallback>{{ getInitials(user.nome) }}</span>
                </hlm-avatar>
                <div class="text-sm text-left">
                  <p class="font-medium leading-none">{{ user.nome }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ user.cargo }}</p>
                </div>
                <ng-icon hlm name="lucideChevronDown" size="sm" class="text-muted-foreground" />
              </button>

              <ng-template #userMenu>
                <hlm-menu class="w-48" align="end">
                  <button hlmMenuItem (click)="changePIN()">
                    <ng-icon hlm name="lucideSettings" size="sm" class="mr-2" />
                    <span>Trocar PIN</span>
                  </button>

                  <hlm-menu-separator />

                  <button hlmMenuItem (click)="logout()">
                    <ng-icon hlm name="lucideLogOut" size="sm" class="mr-2" />
                    <span>Sair</span>
                    <hlm-menu-shortcut>⇧⌘Q</hlm-menu-shortcut>
                  </button>
                </hlm-menu>
              </ng-template>
            }
          </div>

          <!-- Mobile Menu Button -->
          <button
            hlmBtn
            variant="ghost"
            size="icon"
            class="md:hidden"
            brnSheetTrigger
          >
            <ng-icon hlm name="lucideMenu" size="sm" />
          </button>

          <!-- Mobile Sheet -->
          <hlm-sheet side="right">
            <hlm-sheet-content *brnSheetContent="let ctx">
              <hlm-sheet-header>
                <button
                  hlmBtn
                  variant="ghost"
                  size="icon"
                  class="absolute right-4 top-4"
                  (click)="ctx.close()"
                >
                  <ng-icon hlm name="lucideX" size="sm" />
                </button>
                <h3 hlmSheetTitle>Menu</h3>
                <p hlmSheetDescription>Navegação e configurações</p>
              </hlm-sheet-header>

              <div class="flex flex-col gap-4 py-4">
                <!-- User Info Mobile -->
                @if (authService.user(); as user) {
                  <div class="flex items-center gap-3 rounded-lg border p-4 bg-muted/50">
                    <hlm-avatar>
                      <img hlmAvatarImage [src]="user.avatar || ''" [alt]="user.nome" />
                      <span hlmAvatarFallback>{{ getInitials(user.nome) }}</span>
                    </hlm-avatar>
                    <div>
                      <p class="font-medium">{{ user.nome }}</p>
                      <p class="text-sm text-muted-foreground">{{ user.cargo }}</p>
                      <p class="text-xs text-muted-foreground">{{ user.email }}</p>
                    </div>
                  </div>
                }

                <!-- Nav Links Mobile -->
                <div class="flex flex-col gap-1">
                  <a
                    routerLink="/registro-ponto"
                    routerLinkActive="bg-accent text-accent-foreground"
                    (click)="ctx.close()"
                    class="inline-flex items-center justify-start rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <ng-icon hlm name="lucideUser" size="sm" class="mr-2" />
                    Registrar Ponto
                  </a>
                  <a
                    routerLink="/fechamento-ponto"
                    routerLinkActive="bg-accent text-accent-foreground"
                    [routerLinkActiveOptions]="{ exact: false }"
                    (click)="ctx.close()"
                    class="inline-flex items-center justify-start rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <ng-icon hlm name="lucideClock" size="sm" class="mr-2" />
                    Fechamentos de Ponto
                  </a>
                  @if (authService.user()?.isAdmin) {
                    <a
                      routerLink="/admin/dashboard"
                      routerLinkActive="bg-accent text-accent-foreground"
                      (click)="ctx.close()"
                      class="inline-flex items-center justify-start rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <ng-icon hlm name="lucideDollarSign" size="sm" class="mr-2" />
                      Dashboard Admin
                    </a>
                    <a
                      routerLink="/configuracoes"
                      routerLinkActive="bg-accent text-accent-foreground"
                      (click)="ctx.close()"
                      class="inline-flex items-center justify-start rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <ng-icon hlm name="lucideSettings" size="sm" class="mr-2" />
                      Configurações
                    </a>
                  }
                </div>

                <!-- Logout Button Mobile -->
                <button
                  hlmBtn
                  variant="outline"
                  class="w-full gap-2 mt-auto"
                  (click)="logout(); ctx.close()"
                >
                  <ng-icon hlm name="lucideLogOut" size="sm" />
                  Sair
                </button>
              </div>
            </hlm-sheet-content>
          </hlm-sheet>
        </div>
      </header>
    }
  `,
  styles: ``,
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  getInitials(nome: string): string {
    return nome
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  changePIN(): void {
    // TODO: Implementar mudança de PIN
    toast.info('Trocar PIN', {
      description: 'Funcionalidade em desenvolvimento',
    });
  }

  logout(): void {
    this.authService.logout();
    toast.success('Logout realizado', {
      description: 'Até logo!',
    });
  }
}
