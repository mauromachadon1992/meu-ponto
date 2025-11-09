import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { toast } from 'ngx-sonner';

import { HlmCard, HlmCardHeader, HlmCardTitle, HlmCardDescription, HlmCardContent } from '@spartan-ng/helm/card';
import { HlmBadge } from '@spartan-ng/helm/badge';
import { HlmTable, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd, HlmCaption } from '@spartan-ng/helm/table';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmEmptyImports } from '@spartan-ng/helm/empty';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideTrendingUp, lucideTrendingDown, lucideDollarSign, lucideUsers, lucideCalendar, lucideTriangleAlert, lucideDownload, lucideFileText, lucideFileSpreadsheet, lucideUserPlus, lucideRefreshCcw } from '@ng-icons/lucide';

import { CalculosTrabalhistasService } from '../../core/services/calculos-trabalhistas.service';
import { ConfiguracoesService } from '../../core/services/configuracoes.service';
import { RelatorioService, UserFinancialData } from '../../core/services/relatorio.service';
import { User } from '../../core/models/auth.model';
import { PeriodoFechamento } from '../../core/models/periodo-fechamento.model';
import { environment } from '../../../environments/environment';
import { HlmButton } from '@spartan-ng/helm/button';
import { BrnMenuImports } from '@spartan-ng/brain/menu';
import { HlmMenuImports } from '@spartan-ng/helm/menu';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardDescription,
    HlmCardContent,
    HlmBadge,
    HlmTHead,
    HlmTBody,
    HlmTr,
    HlmTh,
    HlmTd,
    HlmCaption,
    HlmIcon,
    HlmSkeletonImports,
    HlmEmptyImports,
    NgIcon,
    HlmButton,
    BrnMenuImports,
    HlmMenuImports,
  ],
  providers: [provideIcons({ lucideTrendingUp, lucideTrendingDown, lucideDollarSign, lucideUsers, lucideCalendar, lucideTriangleAlert, lucideDownload, lucideFileText, lucideFileSpreadsheet, lucideUserPlus, lucideRefreshCcw })],
  template: `
    <div class="w-full max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Dashboard Administrativa</h1>
          <p class="text-muted-foreground">Visão financeira e cálculos trabalhistas conforme CLT</p>
        </div>
        
        <!-- Botões de Ação -->
        <div class="flex items-center gap-3">
          <button hlmBtn variant="outline" (click)="cadastrarUsuario()" class="gap-2">
            <ng-icon hlm name="lucideUserPlus" size="sm" />
            Cadastrar Usuário
          </button>
          
          <div [brnMenuTriggerFor]="menu">
            <button hlmBtn variant="default" class="gap-2">
              <ng-icon hlm name="lucideDownload" size="sm" />
              Gerar Relatório
            </button>
          </div>
        </div>

        <ng-template #menu>
          <hlm-menu class="w-56">
            <button hlmMenuItem (click)="gerarRelatorioCompleto()">
              <ng-icon hlm name="lucideFileText" size="sm" class="mr-2" />
              <span>Relatório Completo</span>
            </button>
            <button hlmMenuItem (click)="gerarRelatorioSimples()">
              <ng-icon hlm name="lucideFileSpreadsheet" size="sm" class="mr-2" />
              <span>Relatório Simplificado</span>
            </button>
            <hlm-menu-separator />
            <hlm-menu-label>Tipos de Relatório</hlm-menu-label>
            <div class="px-2 py-1.5 text-xs text-muted-foreground">
              <p class="mb-1"><strong>Completo:</strong> Detalhes de horas, valores e cálculos por funcionário</p>
              <p><strong>Simplificado:</strong> Apenas valores totais a receber</p>
            </div>
          </hlm-menu>
        </ng-template>
      </div>

      <!-- Cards de Resumo -->
      @if (isLoading()) {
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div hlmCard>
              <div hlmCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
                <hlm-skeleton class="h-4 w-32" />
                <hlm-skeleton class="h-4 w-4 rounded-full" />
              </div>
              <div hlmCardContent class="space-y-2">
                <hlm-skeleton class="h-8 w-24" />
                <hlm-skeleton class="h-3 w-20" />
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div hlmCard>
            <div hlmCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 hlmCardTitle class="text-sm font-medium">Total Folha de Pagamento</h3>
              <ng-icon hlm name="lucideDollarSign" size="sm" class="text-muted-foreground" />
            </div>
            <div hlmCardContent>
              <div class="text-2xl font-bold">{{ formatarMoeda(resumoGeral().totalFolha) }}</div>
              <p class="text-xs text-muted-foreground">Período atual</p>
            </div>
          </div>

        <div hlmCard>
          <div hlmCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 hlmCardTitle class="text-sm font-medium">Presença</h3>
            <ng-icon hlm name="lucideCalendar" size="sm" class="text-muted-foreground" />
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-bold">{{ resumoGeral().totalDiasTrabalhados }}</div>
            @if (resumoGeral().totalFaltas > 0) {
              <p class="text-xs text-red-600">{{ resumoGeral().totalFaltas }} falta(s)</p>
            } @else {
              <p class="text-xs text-green-600">Sem faltas</p>
            }
          </div>
        </div>

        <div hlmCard>
          <div hlmCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 hlmCardTitle class="text-sm font-medium">Horas Extras + DSR</h3>
            <ng-icon hlm name="lucideTrendingUp" size="sm" class="text-green-600" />
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-bold">{{ formatarMoeda(resumoGeral().totalHorasExtras) }}</div>
            <p class="text-xs text-muted-foreground">{{ resumoGeral().horasExtrasQtd.toFixed(1) }}h trabalhadas</p>
          </div>
        </div>

        <div hlmCard>
          <div hlmCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 hlmCardTitle class="text-sm font-medium">Adicional Noturno</h3>
            <ng-icon hlm name="lucideCalendar" size="sm" class="text-blue-600" />
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-bold">{{ formatarMoeda(resumoGeral().totalAdicionalNoturno) }}</div>
            <p class="text-xs text-muted-foreground">{{ resumoGeral().horasNoturnasQtd.toFixed(1) }}h noturnas</p>
          </div>
        </div>

        <div hlmCard>
          <div hlmCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 hlmCardTitle class="text-sm font-medium">Descontos</h3>
            <ng-icon hlm name="lucideTrendingDown" size="sm" class="text-red-600" />
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-bold">{{ formatarMoeda(resumoGeral().totalDescontos) }}</div>
            <p class="text-xs text-muted-foreground">{{ resumoGeral().horasDevidasQtd.toFixed(1) }}h não trabalhadas</p>
          </div>
        </div>

        <div hlmCard>
          <div hlmCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 hlmCardTitle class="text-sm font-medium">Funcionários</h3>
            <ng-icon hlm name="lucideUsers" size="sm" class="text-muted-foreground" />
          </div>
          <div hlmCardContent>
            <div class="text-2xl font-bold">{{ usuariosFinanceiros().length }}</div>
            <p class="text-xs text-muted-foreground">Colaboradores ativos</p>
          </div>
        </div>
        </div>
      }

      <!-- Tabela de Funcionários - Loading -->
      @if (isLoading()) {
        <div hlmCard>
          <div hlmCardHeader>
            <hlm-skeleton class="h-6 w-64 mb-2" />
            <hlm-skeleton class="h-4 w-96" />
          </div>
          <div hlmCardContent class="space-y-3">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="flex items-center space-x-4">
                <hlm-skeleton class="h-12 w-12 rounded-full" />
                <div class="space-y-2 flex-1">
                  <hlm-skeleton class="h-4 w-full" />
                  <hlm-skeleton class="h-3 w-3/4" />
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Tabela de Funcionários -->
      @if (!isLoading() && usuariosFinanceiros().length > 0) {
        <div hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Detalhamento por Funcionário</h3>
            <p hlmCardDescription>Cálculos conforme CLT - Consolidação das Leis do Trabalho</p>
          </div>
          <div hlmCardContent>
            <table hlm class="w-full">
              <caption hlmCaption>Valores referentes ao período atual com períodos em aberto</caption>
              <thead hlmTHead>
                <tr hlmTr>
                  <th hlmTh class="w-[200px]">Funcionário</th>
                  <th hlmTh>Cargo</th>
                  <th hlmTh class="text-right">Dias</th>
                  <th hlmTh class="text-right">Salário Base</th>
                  <th hlmTh class="text-right">H. Extras</th>
                  <th hlmTh class="text-right">DSR</th>
                  <th hlmTh class="text-right">Adic. Noturno</th>
                  <th hlmTh class="text-right">Descontos</th>
                  <th hlmTh class="text-right">Total Líquido</th>
                </tr>
              </thead>
              <tbody hlmTBody>
                @for (userFinancial of usuariosFinanceiros(); track userFinancial.user.id) {
                  <tr hlmTr>
                    <td hlmTd class="font-medium">
                      <div class="flex flex-col">
                        <span>{{ userFinancial.user.nome }}</span>
                        <span class="text-xs text-muted-foreground">{{ userFinancial.user.email }}</span>
                      </div>
                    </td>
                    <td hlmTd>
                      <span hlmBadge variant="outline">{{ userFinancial.user.cargo || 'Não informado' }}</span>
                    </td>
                    <td hlmTd class="text-right">
                      <div class="flex flex-col items-end">
                        <span class="font-semibold">{{ userFinancial.diasTrabalhados }}</span>
                        @if (userFinancial.diasFaltados > 0) {
                          <span class="text-xs text-red-600">{{ userFinancial.diasFaltados }} falta(s)</span>
                        } @else {
                          <span class="text-xs text-muted-foreground">trabalhados</span>
                        }
                      </div>
                    </td>
                    <td hlmTd class="text-right">{{ formatarMoeda(userFinancial.user.salarioMensal || 0) }}</td>
                    <td hlmTd class="text-right">
                      <div class="flex flex-col items-end">
                        <span class="text-green-600 font-semibold">{{ formatarMoeda(userFinancial.valorHorasExtras) }}</span>
                        <span class="text-xs text-muted-foreground">{{ userFinancial.totalHorasExtras.toFixed(1) }}h</span>
                      </div>
                    </td>
                    <td hlmTd class="text-right">
                      <span class="text-green-600">{{ formatarMoeda(userFinancial.valorDSR) }}</span>
                    </td>
                    <td hlmTd class="text-right">
                      <div class="flex flex-col items-end">
                        <span class="text-blue-600 font-semibold">{{ formatarMoeda(userFinancial.valorAdicionalNoturno) }}</span>
                        <span class="text-xs text-muted-foreground">{{ userFinancial.totalHorasNoturnas.toFixed(1) }}h</span>
                      </div>
                    </td>
                    <td hlmTd class="text-right">
                      <div class="flex flex-col items-end">
                        <span class="text-red-600 font-semibold">{{ formatarMoeda(userFinancial.descontoHorasDevidas) }}</span>
                        <span class="text-xs text-muted-foreground">{{ userFinancial.totalHorasDevidas.toFixed(1) }}h</span>
                      </div>
                    </td>
                    <td hlmTd class="text-right">
                      <span class="font-bold text-lg">{{ formatarMoeda(userFinancial.totalLiquido) }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Informações Legais -->
        <div hlmCard class="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <div hlmCardHeader>
            <div class="flex items-center gap-2">
              <ng-icon hlm name="lucideTriangleAlert" size="sm" class="text-yellow-600" />
              <h3 hlmCardTitle class="text-yellow-900 dark:text-yellow-100">Base Legal dos Cálculos</h3>
            </div>
          </div>
          <div hlmCardContent class="text-sm text-yellow-900 dark:text-yellow-100 space-y-2">
            <p><strong>Horas Extras (CLT Art. 59):</strong> Percentuais ativos: <span class="font-semibold">{{ getPercentuaisAtivos() }}</span></p>
            <p><strong>DSR - Descanso Semanal Remunerado:</strong> {{ configService.deveCalcularDSR() ? 'Ativado' : 'Desativado' }} - Reflexo das horas extras sobre domingos e feriados.</p>
            <p><strong>Adicional Noturno (CLT Art. 73):</strong> {{ configService.deveCalcularAdicionalNoturno() ? 'Ativado (' + configService.configuracoes().percentualAdicionalNoturno + '%)' : 'Desativado' }}</p>
            <p><strong>Salário/Hora:</strong> Calculado considerando {{ configService.getDiasUteisPorMes() }} dias úteis por mês e a carga horária diária de cada funcionário.</p>
            <p><strong>Descontos:</strong> Horas não trabalhadas podem ser descontadas conforme CLT Art. 130.</p>
            <p class="pt-2 border-t border-yellow-300"><strong>💡 Dica:</strong> Acesse <span class="font-semibold">Configurações</span> para personalizar todos os cálculos trabalhistas.</p>
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (!isLoading() && usuariosFinanceiros().length === 0) {
        <div hlmEmpty class="from-muted/50 to-background h-full w-full bg-gradient-to-b from-30% min-h-[400px]">
          <div hlmEmptyHeader>
            <div hlmEmptyMedia variant="icon">
              <ng-icon name="lucideDollarSign" />
            </div>
            <div hlmEmptyTitle>Nenhum dado financeiro encontrado</div>
            <div hlmEmptyDescription>
              Não há períodos registrados ou usuários com salário configurado. Cadastre funcionários e registre pontos para visualizar dados.
            </div>
          </div>
          <div hlmEmptyContent>
            <button hlmBtn (click)="carregarDados()">
              <ng-icon hlm name="lucideRefreshCcw" />
              Recarregar
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly calculosService = inject(CalculosTrabalhistasService);
  private readonly relatorioService = inject(RelatorioService);
  private readonly router = inject(Router);
  readonly configService = inject(ConfiguracoesService);
  private readonly apiUrl = environment.apiUrl;

  isLoading = signal(false);
  usuariosFinanceiros = signal<UserFinancialData[]>([]);

  resumoGeral = computed(() => {
    const dados = this.usuariosFinanceiros();
    return {
      totalFolha: dados.reduce((sum, u) => sum + u.totalLiquido, 0),
      totalHorasExtras: dados.reduce((sum, u) => sum + u.valorHorasExtras + u.valorDSR, 0),
      horasExtrasQtd: dados.reduce((sum, u) => sum + u.totalHorasExtras, 0),
      totalAdicionalNoturno: dados.reduce((sum, u) => sum + u.valorAdicionalNoturno, 0),
      horasNoturnasQtd: dados.reduce((sum, u) => sum + u.totalHorasNoturnas, 0),
      totalDescontos: dados.reduce((sum, u) => sum + u.descontoHorasDevidas, 0),
      horasDevidasQtd: dados.reduce((sum, u) => sum + u.totalHorasDevidas, 0),
      totalDiasTrabalhados: dados.reduce((sum, u) => sum + u.diasTrabalhados, 0),
      totalFaltas: dados.reduce((sum, u) => sum + u.diasFaltados, 0),
    };
  });

  async ngOnInit() {
    await this.carregarDadosFinanceiros();
  }

  async carregarDados() {
    await this.carregarDadosFinanceiros();
  }

  private async carregarDadosFinanceiros() {
    this.isLoading.set(true);
    try {
      // Busca usuários
      const users = await firstValueFrom(this.http.get<User[]>(`${this.apiUrl}/users`));

      // Busca períodos (incluindo user e _count)
      const periodos = await firstValueFrom(this.http.get<PeriodoFechamento[]>(`${this.apiUrl}/periodos`));

      // Calcula dados financeiros para cada usuário
      const dadosFinanceiros: UserFinancialData[] = users
        .filter(user => user.salarioMensal && user.salarioMensal > 0) // Somente usuários com salário
        .map(user => {
          const periodosUsuario = periodos.filter(p => p.userId === user.id && p.status === 'ABERTO');

          // Agregar valores dos períodos (já calculados corretamente no backend)
          const totalHorasTrabalhadas = periodosUsuario.reduce((sum, p) => sum + (p.totalHorasTrabalhadas || 0), 0);
          const totalHorasExtras = periodosUsuario.reduce((sum, p) => sum + (p.totalHorasExtras || 0), 0);
          const totalHorasDevidas = periodosUsuario.reduce((sum, p) => sum + (p.totalHorasDevidas || 0), 0);
          const totalHorasNoturnas = periodosUsuario.reduce((sum, p) => sum + (p.totalHorasNoturnas || 0), 0);

          // Buscar resumos dos períodos para obter dias trabalhados e faltados corretos
          // Nota: Os valores totalHorasTrabalhadas/Extras/Devidas já foram recalculados
          // quando o endpoint de resumo foi chamado, então estão atualizados
          
          const cargaDiaria = user.cargaHorariaDiaria || 8;
          
          // Calcular dias trabalhados de forma mais precisa
          // Considerando que cada período já tem seus totais calculados corretamente
          const diasTrabalhados = totalHorasTrabalhadas > 0 
            ? Math.round(totalHorasTrabalhadas / cargaDiaria) 
            : 0;
          
          // Calcular dias esperados baseado nos dias úteis de cada período
          const diasEsperados = periodosUsuario.reduce((sum, p) => {
            const inicio = new Date(p.dataInicio);
            const fim = new Date(p.dataFim);
            
            // Contar dias úteis (segunda a sexta)
            let count = 0;
            const current = new Date(inicio);
            while (current <= fim) {
              const diaSemana = current.getDay();
              if (diaSemana !== 0 && diaSemana !== 6) { // Não é sábado nem domingo
                count++;
              }
              current.setDate(current.getDate() + 1);
            }
            return sum + count;
          }, 0);
          
          const diasFaltados = Math.max(0, diasEsperados - diasTrabalhados);

          const salarioPorHora = this.calculosService.calcularSalarioPorHora(
            user.salarioMensal!,
            cargaDiaria
          );

          const valorHorasExtras = this.calculosService.calcularValorHorasExtras(
            user.salarioMensal!,
            totalHorasExtras,
            cargaDiaria
          );

          const valorDSR = this.calculosService.calcularDSRSobreHorasExtras(valorHorasExtras);

          const valorAdicionalNoturno = this.calculosService.calcularAdicionalNoturno(
            user.salarioMensal!,
            totalHorasNoturnas,
            cargaDiaria
          );

          const descontoHorasDevidas = this.calculosService.calcularDescontoHorasDevidas(
            user.salarioMensal!,
            totalHorasDevidas,
            cargaDiaria
          );

          const totalLiquido = user.salarioMensal! + valorHorasExtras + valorDSR + valorAdicionalNoturno - descontoHorasDevidas;

          return {
            user,
            periodos: periodosUsuario,
            salarioPorHora,
            totalHorasTrabalhadas,
            totalHorasExtras,
            valorHorasExtras,
            valorDSR,
            totalHorasNoturnas,
            valorAdicionalNoturno,
            totalHorasDevidas,
            descontoHorasDevidas,
            totalLiquido,
            diasTrabalhados,
            diasFaltados,
          };
        });

      this.usuariosFinanceiros.set(dadosFinanceiros);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast.error('Erro ao carregar dados', {
        description: 'Não foi possível carregar os dados financeiros.',
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  formatarMoeda(valor: number): string {
    return this.calculosService.formatarMoeda(valor);
  }

  getPercentuaisAtivos(): string {
    const config = this.configService.configuracoes();
    const percentuais: string[] = [];
    
    if (config.usarHoraExtra40) percentuais.push('40%');
    if (config.usarHoraExtra50) percentuais.push('50%');
    if (config.usarHoraExtra80) percentuais.push('80%');
    if (config.usarHoraExtra100) percentuais.push('100%');
    
    return percentuais.length > 0 ? percentuais.join(', ') : 'Nenhum';
  }

  gerarRelatorioCompleto(): void {
    const dados = this.usuariosFinanceiros();
    
    if (dados.length === 0) {
      toast.error('Nenhum dado disponível', {
        description: 'Não há dados financeiros para gerar o relatório.',
      });
      return;
    }

    try {
      this.relatorioService.gerarRelatorioCompleto(dados);
      toast.success('Relatório gerado!', {
        description: 'O relatório completo foi baixado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório', {
        description: 'Não foi possível gerar o relatório completo.',
      });
    }
  }

  gerarRelatorioSimples(): void {
    const dados = this.usuariosFinanceiros();
    
    if (dados.length === 0) {
      toast.error('Nenhum dado disponível', {
        description: 'Não há dados financeiros para gerar o relatório.',
      });
      return;
    }

    try {
      this.relatorioService.gerarRelatorioSimples(dados);
      toast.success('Relatório gerado!', {
        description: 'O relatório simplificado foi baixado com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório', {
        description: 'Não foi possível gerar o relatório simplificado.',
      });
    }
  }

  cadastrarUsuario(): void {
    this.router.navigate(['/cadastro-usuario']);
  }
}
