import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  HlmCard,
  HlmCardHeader,
  HlmCardTitle,
  HlmCardDescription,
  HlmCardContent,
  HlmCardFooter,
} from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideClock, lucideArrowRight, lucideFilter, lucideX, lucideRefreshCcw, lucidePlus } from '@ng-icons/lucide';
import { FechamentoPontoService } from '../../core/services/fechamento-ponto.service';
import { AuthService } from '../../core/services/auth.service';
import {
  PeriodoFechamento,
  StatusFechamento,
} from '../../core/models/periodo-fechamento.model';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { CriarPeriodoDialogComponent } from './criar-periodo-dialog.component';
import { toast } from 'ngx-sonner';

@Component({
  selector: 'app-fechamento-lista',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardDescription,
    HlmCardContent,
    HlmCardFooter,
    HlmButton,
    HlmBadge,
    HlmIcon,
    HlmInput,
    HlmLabel,
    HlmSkeletonImports,
    HlmEmptyImports,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideCalendar,
      lucideClock,
      lucideArrowRight,
      lucideFilter,
      lucideX,
      lucideRefreshCcw,
      lucidePlus,
    }),
  ],
  template: `
    <div class="py-8 px-4 max-w-screen-2xl mx-auto">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Fechamento de Ponto</h1>
          <p class="text-muted-foreground mt-2">
            Gerencie e visualize os períodos de fechamento
          </p>
        </div>
        
        @if (authService.user()?.isAdmin) {
          <button
            hlmBtn
            (click)="abrirDialogCriarPeriodo()"
            class="gap-2"
          >
            <ng-icon hlm name="lucidePlus" size="sm" />
            Criar Período
          </button>
        }
      </div>

      <!-- Filtros -->
      <div hlmCard class="mb-6">
        <div hlmCardHeader>
          <h3 hlmCardTitle class="flex items-center gap-2">
            <ng-icon hlm name="lucideFilter" size="sm" />
            Filtros
          </h3>
        </div>
        <div hlmCardContent>
          <div class="grid gap-4 md:grid-cols-4">
            <!-- Filtro por Mês/Ano -->
            <div class="space-y-2">
              <label hlmLabel for="mes">Mês/Ano</label>
              <input
                hlmInput
                type="month"
                id="mes"
                name="mes"
                [(ngModel)]="filtroMes"
                (ngModelChange)="aplicarFiltros()"
                class="w-full"
              />
            </div>

            <!-- Filtro por Usuário (apenas admin) -->
            @if (authService.user()?.isAdmin) {
              <div class="space-y-2">
                <label hlmLabel for="usuario">Usuário</label>
                <select
                  hlmInput
                  id="usuario"
                  name="usuario"
                  [(ngModel)]="filtroUsuario"
                  (ngModelChange)="aplicarFiltros()"
                  class="w-full"
                >
                  <option value="">Todos os usuários</option>
                  @for (usuario of usuarios(); track usuario.id) {
                    <option [value]="usuario.id">{{ usuario.nome }}</option>
                  }
                </select>
              </div>
            }

            <!-- Filtro por Status -->
            <div class="space-y-2">
              <label hlmLabel for="status">Status</label>
              <select
                hlmInput
                id="status"
                name="status"
                [(ngModel)]="filtroStatus"
                (ngModelChange)="aplicarFiltros()"
                class="w-full"
              >
                <option value="">Todos os status</option>
                <option value="ABERTO">Aberto</option>
                <option value="EM_ANALISE">Em Análise</option>
                <option value="APROVADO">Aprovado</option>
                <option value="FECHADO">Fechado</option>
              </select>
            </div>

            <!-- Botão Limpar -->
            <div class="space-y-2 flex items-end">
              <button
                hlmBtn
                variant="outline"
                (click)="limparFiltros()"
                class="w-full"
              >
                <ng-icon hlm name="lucideX" size="sm" class="mr-2" />
                Limpar
              </button>
            </div>
          </div>

          <!-- Info de resultados -->
          <div class="mt-4 text-sm text-muted-foreground">
            Exibindo {{ periodosFiltrados().length }} de {{ periodos().length }} períodos
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div hlmCard>
              <div hlmCardHeader>
                <div class="flex items-start justify-between">
                  <div class="flex-1 space-y-2">
                    <hlm-skeleton class="h-6 w-48" />
                    <hlm-skeleton class="h-4 w-40" />
                    <hlm-skeleton class="h-3 w-32" />
                  </div>
                  <hlm-skeleton class="h-6 w-20" />
                </div>
              </div>
              <div hlmCardContent class="space-y-3">
                <hlm-skeleton class="h-4 w-full" />
                <hlm-skeleton class="h-4 w-3/4" />
                <hlm-skeleton class="h-4 w-2/3" />
              </div>
              <div hlmCardFooter>
                <hlm-skeleton class="h-10 w-full" />
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          @for (periodo of periodosFiltrados(); track periodo.id) {
            <div hlmCard>
              <div hlmCardHeader>
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 hlmCardTitle class="flex items-center gap-2">
                      <ng-icon hlm name="lucideCalendar" size="sm" />
                      {{ formatPeriodo(periodo) }}
                    </h3>
                    <p hlmCardDescription class="mt-1">
                      {{ periodo.dataInicio | date: 'dd/MM/yyyy' }} -
                      {{ periodo.dataFim | date: 'dd/MM/yyyy' }}
                    </p>
                    @if (periodo.user) {
                      <p class="text-xs text-muted-foreground mt-2">
                        {{ periodo.user.nome }}
                      </p>
                    }
                  </div>
                  <span
                    hlmBadge
                    [variant]="getStatusVariant(periodo.status)"
                  >
                    {{ getStatusLabel(periodo.status) }}
                  </span>
                </div>
              </div>

              <div hlmCardContent>
                <div class="space-y-3">
                  @if (periodo._count) {
                    <div class="flex items-center justify-between text-sm pb-2 border-b">
                      <span class="text-muted-foreground">Registros</span>
                      <span class="font-semibold">
                        {{ periodo._count.registros }}
                      </span>
                    </div>
                  }
                  
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground">Horas Trabalhadas</span>
                    <span class="font-semibold">
                      {{ periodo.totalHorasTrabalhadas | number: '1.1-1' }}h
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground">Horas Extras</span>
                    <span
                      class="font-semibold"
                      [class.text-green-600]="periodo.totalHorasExtras > 0"
                    >
                      +{{ periodo.totalHorasExtras | number: '1.1-1' }}h
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground">Horas Devidas</span>
                    <span
                      class="font-semibold"
                      [class.text-red-600]="periodo.totalHorasDevidas > 0"
                    >
                      {{ periodo.totalHorasDevidas > 0 ? '-' : '' }}{{ periodo.totalHorasDevidas | number: '1.1-1' }}h
                    </span>
                  </div>

                  @if (periodo.observacoes) {
                    <div class="pt-2 border-t">
                      <p class="text-xs text-muted-foreground">
                        {{ periodo.observacoes }}
                      </p>
                    </div>
                  }
                </div>
              </div>

              <div hlmCardFooter>
                <button
                  hlmBtn
                  variant="outline"
                  class="w-full"
                  (click)="verDetalhes(periodo.id)"
                >
                  Ver Detalhes
                  <ng-icon hlm name="lucideArrowRight" size="sm" class="ml-2" />
                </button>
              </div>
            </div>
          }
        </div>

        @if (periodosFiltrados().length === 0 && !loading()) {
          <div hlmEmpty class="from-muted/50 to-background h-full w-full bg-gradient-to-b from-30% min-h-[400px]">
            <div hlmEmptyHeader>
              <div hlmEmptyMedia variant="icon">
                <ng-icon name="lucideCalendar" />
              </div>
              <div hlmEmptyTitle>
                @if (periodos().length === 0) {
                  Nenhum período de fechamento encontrado
                } @else {
                  Nenhum período encontrado com os filtros
                }
              </div>
              <div hlmEmptyDescription>
                @if (periodos().length === 0) {
                  Ainda não há períodos de fechamento cadastrados. Os períodos são criados automaticamente ao registrar ponto.
                } @else {
                  Tente ajustar os filtros para encontrar o período desejado ou limpe os filtros para ver todos os períodos.
                }
              </div>
            </div>
            <div hlmEmptyContent>
              @if (periodos().length > 0) {
                <button hlmBtn variant="outline" (click)="limparFiltros()">
                  <ng-icon hlm name="lucideX" />
                  Limpar Filtros
                </button>
              } @else {
                <button hlmBtn (click)="carregarPeriodos()">
                  <ng-icon hlm name="lucideRefreshCcw" />
                  Recarregar
                </button>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: ``,
})
export class FechamentoListaComponent implements OnInit {
  private readonly service = inject(FechamentoPontoService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  private readonly dialogService = inject(HlmDialogService);

  readonly periodos = signal<PeriodoFechamento[]>([]);
  readonly usuarios = signal<Array<{ id: string; nome: string }>>([]);
  readonly loading = signal(true);

  // Filtros
  filtroMes = '';
  filtroUsuario = '';
  filtroStatus = '';
  
  // Signal auxiliar para forçar recálculo
  private filtrosAtualizados = signal(0);

  // Computed para períodos filtrados
  periodosFiltrados = computed(() => {
    // Força reatividade quando filtros mudam
    this.filtrosAtualizados();
    
    let resultado = this.periodos();

    // Filtro por mês
    if (this.filtroMes) {
      const [ano, mesNumero] = this.filtroMes.split('-').map(Number);
      resultado = resultado.filter((p) => {
        const data = new Date(p.dataInicio);
        return data.getFullYear() === ano && data.getMonth() === mesNumero - 1;
      });
    }

    // Filtro por usuário
    if (this.filtroUsuario) {
      resultado = resultado.filter((p) => p.userId === this.filtroUsuario);
    }

    // Filtro por status
    if (this.filtroStatus) {
      resultado = resultado.filter((p) => p.status === this.filtroStatus);
    }

    return resultado;
  });

  ngOnInit() {
    this.carregarPeriodos();
    this.carregarUsuarios();
  }

  carregarPeriodos(): void {
    this.loading.set(true);
    this.service.getPeriodos().subscribe({
      next: (periodos) => {
        this.periodos.set(periodos);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Erro ao carregar períodos:', error);
        this.loading.set(false);
      },
    });
  }

  carregarUsuarios(): void {
    // Carregar usuários da API
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.usuarios.set(
          users.map((u) => ({
            id: u.id,
            nome: u.nome,
          }))
        );
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        // Fallback para mock em caso de erro
        const users = this.authService.getMockUsers();
        this.usuarios.set(
          users.map((u) => ({
            id: u.id,
            nome: u.nome,
          }))
        );
      },
    });
  }

  aplicarFiltros(): void {
    // Atualiza o signal auxiliar para forçar recálculo do computed
    this.filtrosAtualizados.update(v => v + 1);
  }

  limparFiltros(): void {
    this.filtroMes = '';
    this.filtroUsuario = '';
    this.filtroStatus = '';
    this.aplicarFiltros();
  }

  verDetalhes(periodoId: string): void {
    this.router.navigate(['/fechamento-ponto', periodoId]);
  }

  formatPeriodo(periodo: PeriodoFechamento): string {
    const dataInicio = new Date(periodo.dataInicio);
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return `${meses[dataInicio.getMonth()]} ${dataInicio.getFullYear()}`;
  }

  getStatusLabel(status: StatusFechamento): string {
    const labels: Record<StatusFechamento, string> = {
      [StatusFechamento.ABERTO]: 'Aberto',
      [StatusFechamento.EM_ANALISE]: 'Em Análise',
      [StatusFechamento.APROVADO]: 'Aprovado',
      [StatusFechamento.FECHADO]: 'Fechado',
    };
    return labels[status];
  }

  getStatusVariant(status: StatusFechamento): 'default' | 'secondary' | 'outline' | 'destructive' {
    const variants: Record<StatusFechamento, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      [StatusFechamento.ABERTO]: 'default',
      [StatusFechamento.EM_ANALISE]: 'secondary',
      [StatusFechamento.APROVADO]: 'outline',
      [StatusFechamento.FECHADO]: 'destructive',
    };
    return variants[status];
  }

  abrirDialogCriarPeriodo(): void {
    const dialogRef = this.dialogService.open(CriarPeriodoDialogComponent);

    dialogRef.closed$.subscribe((resultado) => {
      if (resultado) {
        // Recarregar lista
        this.carregarPeriodos();
      }
    });
  }
}
