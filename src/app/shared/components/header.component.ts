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
import { 
  lucideLogOut, 
  lucideUser, 
  lucideMenu, 
  lucideClock, 
  lucideX, 
  lucideDollarSign, 
  lucideSettings, 
  lucideChevronDown,
  lucideFingerprint,
  lucideCalendarClock,
  lucideLayoutDashboard,
  lucideMail,
  lucideBriefcase,
  lucideShield
} from '@ng-icons/lucide';
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
      lucideFingerprint,
      lucideCalendarClock,
      lucideLayoutDashboard,
      lucideMail,
      lucideBriefcase,
      lucideShield,
    }),
  ],
  template: `
    @if (authService.isAuthenticated()) {
      <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div class="flex h-16 items-center justify-between px-4 lg:px-6 max-w-screen-2xl mx-auto">
          <!-- Logo -->

          <a routerLink="/fechamento-ponto" class="flex items-center gap-2.5 transition-transform hover:scale-105 select-none">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ng-icon hlm name="lucideFingerprint" size="md" />
            </div>
            <div class="hidden sm:block">
              <span class="font-bold text-lg">Meu Ponto</span>
              <p class="text-xs text-muted-foreground leading-none">Controle de Ponto</p>
            </div>
          </a>

          <!-- Desktop Navigation -->
          <nav class="hidden md:flex items-center gap-1">
            <a
              routerLink="/registro-ponto"
              routerLinkActive="active-link"
              #regLink="routerLinkActive"
              class="inline-flex items-center gap-2 justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ng-icon hlm name="lucideFingerprint" size="xs" [ngClass]="{'text-accent-foreground': regLink.isActive}" />
              <span>Registrar</span>
            </a>
            <a
              routerLink="/fechamento-ponto"
              routerLinkActive="active-link"
              [routerLinkActiveOptions]="{ exact: false }"
              #fechLink="routerLinkActive"
              class="inline-flex items-center gap-2 justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ng-icon hlm name="lucideCalendarClock" size="xs" [ngClass]="{'text-accent-foreground': fechLink.isActive}" />
              <span>Fechamentos</span>
            </a>
            @if (authService.user()?.isAdmin) {
              <div class="h-6 w-px bg-border mx-2"></div>
              <a
                routerLink="/admin/dashboard"
                routerLinkActive="active-link"
                #dashLink="routerLinkActive"
                class="inline-flex items-center gap-2 justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ng-icon hlm name="lucideLayoutDashboard" size="xs" [ngClass]="{'text-accent-foreground': dashLink.isActive}" />
                <span>Dashboard</span>
              </a>
              <a
                routerLink="/configuracoes"
                routerLinkActive="active-link"
                #confLink="routerLinkActive"
                class="inline-flex items-center gap-2 justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <ng-icon hlm name="lucideSettings" size="xs" [ngClass]="{'text-accent-foreground': confLink.isActive}" />
                <span>Config</span>
              </a>
            }
          </nav>

          <!-- Desktop User Menu -->
          <div class="hidden md:flex items-center gap-3">
            @if (authService.user(); as user) {
              <button
                class="flex items-center gap-3 rounded-lg border px-3 py-2 hover:bg-accent transition-colors"
                [brnMenuTriggerFor]="userMenu"
              >
                <hlm-avatar size="sm">
                  <img hlmAvatarImage [src]="user.avatar || ''" [alt]="user.nome" />
                  <span hlmAvatarFallback>{{ getInitials(user.nome) }}</span>
                </hlm-avatar>
                <div class="text-sm text-left max-w-[150px]">
                  <p class="font-medium leading-none truncate">{{ user.nome }}</p>
                  <p class="text-xs text-muted-foreground mt-0.5 truncate">{{ user.cargo }}</p>
                </div>
                <ng-icon hlm name="lucideChevronDown" size="xs" class="text-muted-foreground" />
              </button>

              <ng-template #userMenu>
                <hlm-menu class="w-56">
                  <div class="px-2 py-1.5 text-sm font-semibold">
                    Minha Conta
                  </div>
                  <hlm-menu-separator />
                  
                  <button hlmMenuItem>
                    <ng-icon hlm name="lucideUser" size="sm" class="mr-2" />
                    <span>Perfil</span>
                  </button>

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

          <!-- Mobile Menu -->
          <hlm-sheet side="right">
            <button hlmBtn variant="ghost" size="icon" brnSheetTrigger class="md:hidden select-none">
              <ng-icon hlm name="lucideMenu" size="sm" />
            </button>
            
            <hlm-sheet-content *brnSheetContent="let ctx" class="w-full sm:max-w-sm p-0">
              <div class="flex flex-col h-full">
                <!-- Header -->
                <div class="flex items-center justify-between p-6 border-b">
                  <div class="flex items-center gap-2.5">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <ng-icon hlm name="lucideFingerprint" size="sm" />
                    </div>
                    <div>
                      <p class="font-bold text-base">Meu Ponto</p>
                      <p class="text-xs text-muted-foreground">Menu de navegação</p>
                    </div>
                  </div>
                </div>

                <!-- User Profile -->
                @if (authService.user(); as user) {
                  <div class="p-6 border-b bg-muted/30">
                    <div class="flex items-center gap-4">
                      <hlm-avatar size="lg" class="h-14 w-14">
                        <img hlmAvatarImage [src]="user.avatar || ''" [alt]="user.nome" />
                        <span hlmAvatarFallback class="text-base">{{ getInitials(user.nome) }}</span>
                      </hlm-avatar>
                      <div class="flex-1 min-w-0">
                        <p class="font-semibold text-base truncate">{{ user.nome }}</p>
                        <div class="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <ng-icon hlm name="lucideBriefcase" size="xs" />
                          <span class="truncate">{{ user.cargo }}</span>
                        </div>
                        @if (user.isAdmin) {
                          <div class="flex items-center gap-1.5 mt-2">
                            <span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                              <ng-icon hlm name="lucideShield" size="xs" />
                              Admin
                            </span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }

                <!-- Navigation -->
                <nav class="flex-1 p-6 overflow-y-auto">
                  <div class="space-y-6">
                    <!-- Main Actions -->
                    <div>
                      <h3 class="mb-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Principal
                      </h3>
                      <div class="space-y-1">
                        <a
                          routerLink="/registro-ponto"
                          routerLinkActive="active-mobile"
                          #regMobile="routerLinkActive"
                          (click)="ctx.close()"
                          class="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                          [ngClass]="{'bg-primary text-primary-foreground': regMobile.isActive}"
                        >
                          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-background border"
                               [ngClass]="{'bg-primary text-primary-foreground': regMobile.isActive}">
                            <ng-icon hlm name="lucideFingerprint" size="sm" [ngClass]="{'text-primary-foreground': regMobile.isActive}" />
                          </div>
                          <div class="flex-1 text-left">
                            <div class="font-semibold">Registrar Ponto</div>
                            <div class="text-xs opacity-70">Bater ponto agora</div>
                          </div>
                        </a>
                        <a
                          routerLink="/fechamento-ponto"
                          routerLinkActive="active-mobile"
                          [routerLinkActiveOptions]="{ exact: false }"
                          #fechMobile="routerLinkActive"
                          (click)="ctx.close()"
                          class="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                          [ngClass]="{'bg-primary text-primary-foreground': fechMobile.isActive}"
                        >
                          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-background border"
                               [ngClass]="{'bg-primary text-primary-foreground': fechMobile.isActive}">
                            <ng-icon hlm name="lucideCalendarClock" size="sm" [ngClass]="{'text-primary-foreground': fechMobile.isActive}" />
                          </div>
                          <div class="flex-1 text-left">
                            <div class="font-semibold">Fechamentos</div>
                            <div class="text-xs opacity-70">Histórico mensal</div>
                          </div>
                        </a>
                      </div>
                    </div>

                    <!-- Admin Section -->
                    @if (authService.user()?.isAdmin) {
                      <div>
                        <h3 class="mb-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Administração
                        </h3>
                        <div class="space-y-1">
                          <a
                            routerLink="/admin/dashboard"
                            routerLinkActive="active-mobile"
                            #dashMobile="routerLinkActive"
                            (click)="ctx.close()"
                            class="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                            [ngClass]="{'bg-primary text-primary-foreground': dashMobile.isActive}"
                          >
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-background border"
                                 [ngClass]="{'bg-primary text-primary-foreground': dashMobile.isActive}">
                              <ng-icon hlm name="lucideLayoutDashboard" size="sm" [ngClass]="{'text-primary-foreground': dashMobile.isActive}" />
                            </div>
                            <div class="flex-1 text-left">
                              <div class="font-semibold">Dashboard</div>
                              <div class="text-xs opacity-70">Visão geral</div>
                            </div>
                          </a>
                          <a
                            routerLink="/configuracoes"
                            routerLinkActive="active-mobile"
                            #confMobile="routerLinkActive"
                            (click)="ctx.close()"
                            class="flex items-center gap-3 rounded-lg px-3 py-3.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
                            [ngClass]="{'bg-primary text-primary-foreground': confMobile.isActive}"
                          >
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-background border"
                                 [ngClass]="{'bg-primary text-primary-foreground': confMobile.isActive}">
                              <ng-icon hlm name="lucideSettings" size="sm" [ngClass]="{'text-primary-foreground': confMobile.isActive}" />
                            </div>
                            <div class="flex-1 text-left">
                              <div class="font-semibold">Configurações</div>
                              <div class="text-xs opacity-70">Parâmetros</div>
                            </div>
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                </nav>

                <!-- Footer -->
                <div class="border-t p-4 space-y-2 bg-muted/20">
                  <button
                    hlmBtn
                    variant="outline"
                    class="w-full justify-start gap-3 h-11"
                    (click)="changePIN(); ctx.close()"
                  >
                    <ng-icon hlm name="lucideSettings" size="sm" />
                    <span>Trocar PIN</span>
                  </button>
                  <button
                    hlmBtn
                    variant="destructive"
                    class="w-full justify-start gap-3 h-11"
                    (click)="logout(); ctx.close()"
                  >
                    <ng-icon hlm name="lucideLogOut" size="sm" />
                    <span>Sair</span>
                  </button>
                </div>
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
