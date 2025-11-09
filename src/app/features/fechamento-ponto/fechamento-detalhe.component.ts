import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  HlmCard,
  HlmCardHeader,
  HlmCardTitle,
  HlmCardDescription,
  HlmCardContent,
} from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import {
  HlmTHead,
  HlmTBody,
  HlmTr,
  HlmTh,
  HlmTd,
  HlmCaption,
} from '@spartan-ng/helm/table';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCalendar,
  lucideClock,
  lucideInbox,
} from '@ng-icons/lucide';
import { FechamentoPontoService } from '../../core/services/fechamento-ponto.service';
import {
  PeriodoFechamento,
  ResumoPeriodo,
  StatusFechamento,
} from '../../core/models/periodo-fechamento.model';
import { RegistroPonto, StatusRegistro } from '../../core/models/registro-ponto.model';

@Component({
  selector: 'app-fechamento-detalhe',
  standalone: true,
  imports: [
    CommonModule,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardDescription,
    HlmCardContent,
    HlmButton,
    HlmBadge,
    HlmIcon,
    NgIcon,
    HlmSeparator,
    HlmEmptyImports,
    HlmTHead,
    HlmTBody,
    HlmTr,
    HlmTh,
    HlmTd,
    HlmCaption,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideCalendar,
      lucideClock,
      lucideInbox,
    }),
  ],
  template: `
    <div class="container mx-auto py-8 px-4">
      @if (loading()) {
        <div class="text-center py-12">
          <p class="text-muted-foreground">Carregando detalhes...</p>
        </div>
      } @else if (periodo()) {
        <div class="mb-6">
          <button hlmBtn variant="ghost" (click)="voltar()" class="mb-4">
            <ng-icon hlm name="lucideArrowLeft" size="sm" class="mr-2" />
            Voltar
          </button>

          <div class="flex items-start justify-between">
            <div>
              <h1 class="text-3xl font-bold tracking-tight">
                {{ formatPeriodo(periodo()!) }}
              </h1>
              <p class="text-muted-foreground mt-2">
                {{ periodo()!.dataInicio | date: 'dd/MM/yyyy' }} -
                {{ periodo()!.dataFim | date: 'dd/MM/yyyy' }}
              </p>
            </div>
            <span hlmBadge [variant]="getStatusVariant(periodo()!.status)">
              {{ getStatusLabel(periodo()!.status) }}
            </span>
          </div>
        </div>

        <div hlmSeparator class="my-6"></div>

        <!-- Resumo do Período -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div hlmCard>
            <div hlmCardHeader>
              <p hlmCardDescription>Horas Trabalhadas</p>
              <h3 hlmCardTitle class="text-2xl">
                {{ periodo()!.totalHorasTrabalhadas }}h
              </h3>
            </div>
          </div>

          <div hlmCard>
            <div hlmCardHeader>
              <p hlmCardDescription>Horas Extras</p>
              <h3 hlmCardTitle class="text-2xl text-green-600">
                +{{ periodo()!.totalHorasExtras }}h
              </h3>
            </div>
          </div>

          <div hlmCard>
            <div hlmCardHeader>
              <p hlmCardDescription>Horas Devidas</p>
              <h3
                hlmCardTitle
                class="text-2xl"
                [class.text-red-600]="periodo()!.totalHorasDevidas > 0"
              >
                {{ periodo()!.totalHorasDevidas > 0 ? '-' : '' }}{{ periodo()!.totalHorasDevidas }}h
              </h3>
            </div>
          </div>

          <div hlmCard>
            <div hlmCardHeader>
              <p hlmCardDescription>Carga Horária</p>
              <h3 hlmCardTitle class="text-2xl">
                {{ periodo()!.cargaHorariaMensal }}h
              </h3>
            </div>
          </div>
        </div>

        @if (resumo()) {
          <div hlmCard class="mb-8">
            <div hlmCardHeader>
              <h3 hlmCardTitle>Estatísticas do Período</h3>
              <p hlmCardDescription>Resumo detalhado das marcações</p>
            </div>
            <div hlmCardContent>
              <div class="grid gap-4 md:grid-cols-3">
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <span class="text-sm text-muted-foreground">Dias Trabalhados</span>
                  <span class="text-2xl font-bold">{{ resumo()!.diasTrabalhados }}</span>
                </div>
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <span class="text-sm text-muted-foreground">Média de Horas/Dia</span>
                  <span class="text-2xl font-bold">{{ resumo()!.horasMedias | number: '1.1-1' }}h</span>
                </div>
                <div class="flex items-center justify-between p-4 border rounded-lg">
                  <span class="text-sm text-muted-foreground">Dias Faltados</span>
                  <span class="text-2xl font-bold">{{ resumo()!.diasFaltados }}</span>
                </div>
              </div>
            </div>
          </div>
          
          @if (resumo() && (resumo()!.valorHorasExtras || resumo()!.valorAdicionalNoturno || resumo()!.valorDSR)) {
            <div hlmCardContent class="border-t pt-4">
              <h4 class="text-sm font-semibold mb-4">Valores Financeiros</h4>
              <div class="grid gap-3 md:grid-cols-2 text-sm">
                <div class="flex justify-between p-2 rounded bg-muted/50">
                  <span>Valor/Hora:</span>
                  <span class="font-semibold">{{ formatarMoeda(resumo()!.valorHora || 0) }}</span>
                </div>
                @if (resumo()!.totalHorasExtras) {
                  <div class="flex justify-between p-2 rounded bg-green-50 dark:bg-green-950">
                    <span>Horas Extras ({{ resumo()!.percentualHorasExtrasAplicado }}%):</span>
                    <span class="font-semibold text-green-700 dark:text-green-400">
                      {{ formatarMoeda(resumo()!.valorHorasExtras || 0) }}
                    </span>
                  </div>
                }
                @if (resumo()!.totalHorasNoturnas) {
                  <div class="flex justify-between p-2 rounded bg-blue-50 dark:bg-blue-950">
                    <span>Adicional Noturno ({{ resumo()!.totalHorasNoturnas | number: '1.1-1' }}h):</span>
                    <span class="font-semibold text-blue-700 dark:text-blue-400">
                      {{ formatarMoeda(resumo()!.valorAdicionalNoturno || 0) }}
                    </span>
                  </div>
                }
                @if (resumo()!.horasDSR) {
                  <div class="flex justify-between p-2 rounded bg-purple-50 dark:bg-purple-950">
                    <span>DSR ({{ resumo()!.horasDSR | number: '1.1-1' }}h):</span>
                    <span class="font-semibold text-purple-700 dark:text-purple-400">
                      {{ formatarMoeda(resumo()!.valorDSR || 0) }}
                    </span>
                  </div>
                }
                @if (resumo()!.descontoAtraso) {
                  <div class="flex justify-between p-2 rounded bg-orange-50 dark:bg-orange-950">
                    <span>Desconto Atraso ({{ resumo()!.totalMinutosAtraso }}min):</span>
                    <span class="font-semibold text-orange-700 dark:text-orange-400">
                      -{{ formatarMoeda(resumo()!.descontoAtraso || 0) }}
                    </span>
                  </div>
                }
                @if (resumo()!.descontoFaltas) {
                  <div class="flex justify-between p-2 rounded bg-red-50 dark:bg-red-950">
                    <span>Desconto Faltas ({{ resumo()!.diasFaltados }} dia(s)):</span>
                    <span class="font-semibold text-red-700 dark:text-red-400">
                      -{{ formatarMoeda(resumo()!.descontoFaltas || 0) }}
                    </span>
                  </div>
                }
              </div>
              <div hlmSeparator class="my-4"></div>
              <div class="flex justify-between items-center p-4 rounded-lg bg-primary/10">
                <div>
                  <div class="text-sm text-muted-foreground">Total Proventos</div>
                  <div class="text-xl font-bold text-green-600">
                    {{ formatarMoeda(resumo()!.totalProventos || 0) }}
                  </div>
                </div>
                <div class="text-3xl text-muted-foreground">-</div>
                <div>
                  <div class="text-sm text-muted-foreground">Total Descontos</div>
                  <div class="text-xl font-bold text-red-600">
                    {{ formatarMoeda(resumo()!.totalDescontos || 0) }}
                  </div>
                </div>
                <div class="text-3xl text-muted-foreground">=</div>
                <div>
                  <div class="text-sm text-muted-foreground">Líquido</div>
                  <div class="text-2xl font-bold">
                    {{ formatarMoeda((resumo()!.totalProventos || 0) - (resumo()!.totalDescontos || 0)) }}
                  </div>
                </div>
              </div>
            </div>
          }
        }

        <!-- Tabela de Registros -->
        <div hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Registros de Ponto</h3>
            <p hlmCardDescription>Todas as marcações do período</p>
          </div>
          <div hlmCardContent>
            @if (registros().length > 0) {
              <table hlm>
                <caption hlmCaption>
                  {{ registros().length }} registro(s) encontrado(s)
                </caption>
                <thead hlmTHead>
                  <tr hlmTr>
                    <th hlmTh class="w-[120px]">Data</th>
                    <th hlmTh class="w-[80px]">Entrada</th>
                    <th hlmTh class="w-[80px]">Saída Almoço</th>
                    <th hlmTh class="w-[80px]">Retorno</th>
                    <th hlmTh class="w-[80px]">Saída</th>
                    <th hlmTh class="w-[100px]">Total</th>
                    <th hlmTh class="w-[100px]">Status</th>
                  </tr>
                </thead>
                <tbody hlmTBody>
                  @for (registro of registros(); track registro.id) {
                    <tr hlmTr>
                      <td hlmTd class="font-medium">
                        {{ registro.data | date: 'dd/MM/yyyy' }}
                      </td>
                      <td hlmTd>{{ registro.entrada }}</td>
                      <td hlmTd>{{ registro.saidaAlmoco || '-' }}</td>
                      <td hlmTd>{{ registro.retornoAlmoco || '-' }}</td>
                      <td hlmTd>{{ registro.saida || '-' }}</td>
                      <td hlmTd class="font-medium">
                        {{ calcularHoras(registro) | number: '1.1-1' }}h
                      </td>
                      <td hlmTd>
                        <span
                          hlmBadge
                          [variant]="getRegistroStatusVariant(registro.status)"
                        >
                          {{ getRegistroStatusLabel(registro.status) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div hlmEmpty class="from-muted/50 to-background bg-gradient-to-b from-30% min-h-[300px]">
                <div hlmEmptyHeader>
                  <div hlmEmptyMedia variant="icon">
                    <ng-icon name="lucideInbox" />
                  </div>
                  <div hlmEmptyTitle>Nenhum registro encontrado</div>
                  <div hlmEmptyDescription>
                    Este período não possui registros de ponto. Registros serão exibidos aqui quando adicionados.
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

        @if (periodo()!.observacoes) {
          <div hlmCard class="mt-6">
            <div hlmCardHeader>
              <h3 hlmCardTitle>Observações</h3>
            </div>
            <div hlmCardContent>
              <p class="text-sm">{{ periodo()!.observacoes }}</p>
            </div>
          </div>
        }
      } @else {
        <div class="text-center py-12">
          <p class="text-muted-foreground">Período não encontrado</p>
          <button hlmBtn variant="outline" (click)="voltar()" class="mt-4">
            Voltar para lista
          </button>
        </div>
      }
    </div>
  `,
  styles: ``,
})
export class FechamentoDetalheComponent implements OnInit {
  private readonly service = inject(FechamentoPontoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly periodo = signal<PeriodoFechamento | null>(null);
  readonly resumo = signal<ResumoPeriodo | null>(null);
  readonly registros = signal<RegistroPonto[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    const periodoId = this.route.snapshot.paramMap.get('id');
    if (periodoId) {
      this.carregarDados(periodoId);
    }
  }

  carregarDados(periodoId: string): void {
    this.loading.set(true);

    // Carregar período
    this.service.getPeriodoById(periodoId).subscribe({
      next: (periodo) => {
        this.periodo.set(periodo || null);
        this.loading.set(false);

        if (periodo) {
          // Carregar resumo
          this.service.calcularResumoPeriodo(periodoId).subscribe({
            next: (resumo) => this.resumo.set(resumo),
          });

          // Carregar registros
          this.service.getRegistrosPorPeriodo(periodoId).subscribe({
            next: (registros) => this.registros.set(registros),
          });
        }
      },
      error: (error) => {
        console.error('Erro ao carregar período:', error);
        this.loading.set(false);
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/fechamento-ponto']);
  }

  calcularHoras(registro: RegistroPonto): number {
    return this.service.calcularHorasTrabalhadas(registro);
  }

  formatPeriodo(periodo: PeriodoFechamento): string {
    const dataInicio = new Date(periodo.dataInicio);
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
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

  getRegistroStatusLabel(status: StatusRegistro): string {
    const labels: Record<StatusRegistro, string> = {
      [StatusRegistro.PENDENTE]: 'Pendente',
      [StatusRegistro.COMPLETO]: 'Completo',
      [StatusRegistro.INCOMPLETO]: 'Incompleto',
    };
    return labels[status];
  }

  getRegistroStatusVariant(
    status: StatusRegistro
  ): 'default' | 'secondary' | 'outline' | 'destructive' {
    const variants: Record<StatusRegistro, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      [StatusRegistro.PENDENTE]: 'secondary',
      [StatusRegistro.COMPLETO]: 'outline',
      [StatusRegistro.INCOMPLETO]: 'destructive',
    };
    return variants[status];
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }
}
