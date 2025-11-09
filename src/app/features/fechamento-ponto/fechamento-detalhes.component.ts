import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { environment } from '../../../environments/environment';
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
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCalendar,
  lucideClock,
  lucideCircleCheckBig,
  lucideCircleX,
  lucideCircleAlert,
  lucidePlus,
  lucideTrash2,
  lucideMapPin,
} from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { BrnAlertDialogImports } from '@spartan-ng/brain/alert-dialog';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { AdicionarRegistroDialogComponent, NovoRegistroData } from './adicionar-registro-dialog.component';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { FechamentoPontoService } from '../../core/services/fechamento-ponto.service';
import {
  PeriodoFechamento,
  StatusFechamento,
  ResumoPeriodo,
} from '../../core/models/periodo-fechamento.model';
import {
  RegistroPonto,
  TipoRegistro,
  StatusRegistro,
} from '../../core/models/registro-ponto.model';

@Component({
  selector: 'app-fechamento-detalhes',
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
    HlmBadge,
    HlmIcon,
    NgIcon,
    HlmSeparator,
    BrnAlertDialogImports,
    HlmAlertDialogImports,
  ],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideCalendar,
      lucideClock,
      lucideCircleCheckBig,
      lucideCircleX,
      lucideCircleAlert,
      lucidePlus,
      lucideTrash2,
    }),
  ],
  template: `
    <div class="py-8 px-4 max-w-screen-2xl mx-auto">
      @if (loading()) {
        <div class="text-center py-12">
          <p class="text-muted-foreground">Carregando detalhes...</p>
        </div>
      } @else if (periodo()) {
        <!-- Header -->
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
            <div class="flex items-center gap-3">
              <span hlmBadge [variant]="getStatusVariant(periodo()!.status)">
                {{ getStatusLabel(periodo()!.status) }}
              </span>
              
              <!-- Botões de mudança de status -->
              <div class="flex gap-2">
                @if (periodo()!.status === StatusFechamento.ABERTO) {
                  <button hlmBtn variant="outline" size="sm" (click)="enviarParaAnalise()">
                    Enviar para Análise
                  </button>
                }
                @if (periodo()!.status === StatusFechamento.EM_ANALISE) {
                  <button hlmBtn variant="default" size="sm" (click)="aprovar()">
                    Aprovar
                  </button>
                  <button hlmBtn variant="outline" size="sm" (click)="reabrir()">
                    Reabrir
                  </button>
                }
                @if (periodo()!.status === StatusFechamento.APROVADO) {
                  <button hlmBtn variant="destructive" size="sm" (click)="fechar()">
                    Fechar Período
                  </button>
                  <button hlmBtn variant="outline" size="sm" (click)="reabrir()">
                    Reabrir
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Resumo do Período -->
        <div class="grid gap-4 md:grid-cols-5 mb-8">
          <div hlmCard>
            <div hlmCardHeader class="pb-2">
              <p hlmCardDescription>Dias Trabalhados</p>
            </div>
            <div hlmCardContent>
              <div class="text-2xl font-bold">{{ diasTrabalhadosCount() }}</div>
              @if (resumo()?.diasUteisEsperados) {
                <p class="text-xs text-muted-foreground mt-1">
                  de {{ resumo()!.diasUteisEsperados }} úteis
                </p>
              }
            </div>
          </div>

          <div hlmCard>
            <div hlmCardHeader class="pb-2">
              <p hlmCardDescription>Faltas</p>
            </div>
            <div hlmCardContent>
              <div class="text-2xl font-bold" [class.text-red-600]="(resumo()?.diasFaltados || 0) > 0">
                {{ resumo()?.diasFaltados || 0 }}
              </div>
              @if ((resumo()?.diasFaltados || 0) > 0) {
                <p class="text-xs text-destructive mt-1">
                  Dias não trabalhados
                </p>
              }
            </div>
          </div>

          <div hlmCard>
            <div hlmCardHeader class="pb-2">
              <p hlmCardDescription>Horas Trabalhadas</p>
            </div>
            <div hlmCardContent>
              <div class="text-2xl font-bold">
                {{ totalHorasTrabalhadas() | number: '1.1-1' }}h
              </div>
            </div>
          </div>

          <div hlmCard>
            <div hlmCardHeader class="pb-2">
              <p hlmCardDescription>Horas Extras</p>
            </div>
            <div hlmCardContent>
              <div class="text-2xl font-bold text-green-600">
                +{{ horasExtras() | number: '1.1-1' }}h
              </div>
              @if (horasDevidas() > 0) {
                <p class="text-xs text-destructive mt-1">
                  -{{ horasDevidas() | number: '1.1-1' }}h devidas
                </p>
              }
            </div>
          </div>

          <div hlmCard>
            <div hlmCardHeader class="pb-2">
              <p hlmCardDescription>Média Diária</p>
            </div>
            <div hlmCardContent>
              <div class="text-2xl font-bold">
                {{ mediaHorasDiarias() | number: '1.1-1' }}h
              </div>
              @if (usuarioPeriodo()?.cargaHorariaDiaria) {
                <p class="text-xs text-muted-foreground mt-1">
                  Meta: {{ usuarioPeriodo()!.cargaHorariaDiaria }}h/dia
                </p>
              }
            </div>
          </div>
        </div>

        <div hlmSeparator class="my-8"></div>

        <!-- Tabela de Registros -->
        <div hlmCard>
          <div hlmCardHeader>
            <div class="flex items-center justify-between">
              <div>
                <h3 hlmCardTitle>Registros de Ponto</h3>
                <p hlmCardDescription>
                  Clique nos horários para editar
                </p>
              </div>
              <button hlmBtn size="sm" (click)="adicionarRegistro()">
                <ng-icon hlm name="lucidePlus" size="sm" class="mr-2" />
                Adicionar Registro
              </button>
            </div>
          </div>
          <div hlmCardContent>
            @if (registrosAgrupados().length > 0) {
              <div class="space-y-6">
                @for (grupo of registrosAgrupados(); track grupo[0]) {
                  <div class="border rounded-lg overflow-hidden">
                    <!-- Cabeçalho do Dia -->
                    <div class="bg-muted px-4 py-3 font-semibold flex items-center justify-between">
                      <span>{{ grupo[1][0].data | date: 'EEEE, dd/MM/yyyy' }}</span>
                      <span class="text-sm text-muted-foreground">{{ grupo[1].length }} registro(s)</span>
                    </div>
                    
                    <!-- Lista de Registros do Dia -->
                    <div class="divide-y">
                      @for (registro of grupo[1]; track registro.id) {
                        <div class="p-4 hover:bg-muted/50 transition-colors group">
                          <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                              <!-- Foto (se existir) -->
                              @if (registro.fotoUrl) {
                                <img 
                                  [src]="registro.fotoUrl" 
                                  alt="Foto"
                                  class="w-10 h-10 rounded-full object-cover"
                                />
                              }
                              
                              <!-- Horário e Tipo -->
                              <div class="flex items-center gap-3">
                                <span class="text-lg font-semibold">
                                  {{ registro.horario || registro.entrada || registro.saida || '-' }}
                                </span>
                                <span 
                                  class="px-3 py-1 rounded-full text-xs font-medium"
                                  [class]="getTipoHorarioBadgeClass(registro.tipoHorario)"
                                >
                                  {{ getTipoHorarioLabel(registro.tipoHorario) }}
                                </span>
                                @if (registro.localizacao) {
                                  <span class="text-xs text-muted-foreground flex items-center gap-1">
                                    <ng-icon hlm name="lucideMapPin" size="xs" />
                                    GPS
                                  </span>
                                }
                              </div>
                            </div>
                            
                            <!-- Ações -->
                            <div class="flex items-center gap-2">
                              @if (registro.observacao) {
                                <span class="text-xs text-muted-foreground italic">{{ registro.observacao }}</span>
                              }
                              <hlm-alert-dialog>
                                <button
                                  hlmBtn
                                  brnAlertDialogTrigger
                                  variant="ghost"
                                  size="icon"
                                  class="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <ng-icon hlm name="lucideTrash2" size="sm" class="text-destructive" />
                                </button>
                                <hlm-alert-dialog-content *brnAlertDialogContent="let ctx">
                                  <hlm-alert-dialog-header>
                                    <h3 hlmAlertDialogTitle>Confirmar Exclusão</h3>
                                    <p hlmAlertDialogDescription>
                                      Tem certeza que deseja excluir este registro?
                                      Esta ação não pode ser desfeita.
                                    </p>
                                  </hlm-alert-dialog-header>
                                  <hlm-alert-dialog-footer>
                                    <button hlmAlertDialogCancel (click)="ctx.close()">Cancelar</button>
                                    <button hlmAlertDialogAction (click)="excluirRegistro(registro); ctx.close()">Excluir</button>
                                  </hlm-alert-dialog-footer>
                                </hlm-alert-dialog-content>
                              </hlm-alert-dialog>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-8">
                <p class="text-muted-foreground">Nenhum registro encontrado</p>
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
          <ng-icon
            hlm
            name="lucideCircleAlert"
            size="lg"
            class="mx-auto mb-4 text-muted-foreground"
          />
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
export class FechamentoDetalhesComponent implements OnInit {
  private readonly service = inject(FechamentoPontoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialogService = inject(HlmDialogService);
  private readonly http = inject(HttpClient);

  readonly periodo = signal<PeriodoFechamento | undefined>(undefined);
  readonly registros = signal<RegistroPonto[]>([]);
  readonly resumo = signal<ResumoPeriodo | undefined>(undefined);
  readonly loading = signal(true);
  readonly usuarioPeriodo = signal<{cargaHorariaDiaria?: number} | undefined>(undefined);
  
  readonly editandoCampo = signal<string>('');
  valorEdicao = '';
  private valorAnterior = '';

  // Enum StatusFechamento para uso no template
  readonly StatusFechamento = StatusFechamento;

  // Agrupar registros por data
  readonly registrosAgrupados = computed(() => {
    const registros = this.registros();
    const grupos = new Map<string, RegistroPonto[]>();
    
    registros.forEach(registro => {
      // Usar horário local ao invés de UTC
      const data = new Date(registro.data);
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      const dataKey = `${ano}-${mes}-${dia}`;
      
      if (!grupos.has(dataKey)) {
        grupos.set(dataKey, []);
      }
      grupos.get(dataKey)!.push(registro);
    });
    
    // Ordenar registros dentro de cada grupo por horário
    grupos.forEach(registrosDia => {
      registrosDia.sort((a, b) => {
        const horarioA = a.horario || a.entrada || a.saidaAlmoco || a.retornoAlmoco || a.saida || '00:00';
        const horarioB = b.horario || b.entrada || b.saidaAlmoco || b.retornoAlmoco || b.saida || '00:00';
        return horarioA.localeCompare(horarioB);
      });
    });
    
    return Array.from(grupos.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  });

  // Computed para totais calculados dinamicamente
  readonly totalHorasTrabalhadas = computed(() => {
    const grupos = this.registrosAgrupados();
    let totalHoras = 0;
    
    grupos.forEach(([data, registros]) => {
      // Para cada dia, calcular horas trabalhadas
      const registrosOrdenados = registros
        .filter(r => r.horario) // Apenas registros com horário
        .sort((a, b) => {
          const horarioA = a.horario || '00:00';
          const horarioB = b.horario || '00:00';
          return horarioA.localeCompare(horarioB);
        });
      
      // Calcular total do dia: diferença entre último e primeiro registro
      if (registrosOrdenados.length >= 2) {
        const primeiro = registrosOrdenados[0].horario!;
        const ultimo = registrosOrdenados[registrosOrdenados.length - 1].horario!;
        
        const [h1, m1] = primeiro.split(':').map(Number);
        const [h2, m2] = ultimo.split(':').map(Number);
        
        const minutosPrimeiro = h1 * 60 + m1;
        const minutosUltimo = h2 * 60 + m2;
        
        let totalMinutos = minutosUltimo - minutosPrimeiro;
        
        // Descontar intervalo de almoço se houver
        const saidaAlmoco = registrosOrdenados.find(r => r.tipoHorario === 'SAIDA_ALMOCO');
        const retornoAlmoco = registrosOrdenados.find(r => r.tipoHorario === 'RETORNO_ALMOCO');
        
        if (saidaAlmoco?.horario && retornoAlmoco?.horario) {
          const [h3, m3] = saidaAlmoco.horario.split(':').map(Number);
          const [h4, m4] = retornoAlmoco.horario.split(':').map(Number);
          const intervalo = (h4 * 60 + m4) - (h3 * 60 + m3);
          totalMinutos -= intervalo;
        }
        
        totalHoras += totalMinutos / 60;
      }
    });
    
    return totalHoras;
  });

  readonly diasTrabalhadosCount = computed(() => {
    return this.registrosAgrupados().length;
  });

  readonly mediaHorasDiarias = computed(() => {
    const dias = this.diasTrabalhadosCount();
    const total = this.totalHorasTrabalhadas();
    return dias > 0 ? total / dias : 0;
  });

  readonly horasExtras = computed(() => {
    const cargaHorariaDiaria = this.usuarioPeriodo()?.cargaHorariaDiaria || 8;
    const diasTrabalhados = this.diasTrabalhadosCount();
    const horasEsperadas = diasTrabalhados * cargaHorariaDiaria;
    const horasTrabalhadas = this.totalHorasTrabalhadas();
    const extras = horasTrabalhadas - horasEsperadas;
    return extras > 0 ? extras : 0;
  });

  readonly horasDevidas = computed(() => {
    const cargaHorariaDiaria = this.usuarioPeriodo()?.cargaHorariaDiaria || 8;
    const diasTrabalhados = this.diasTrabalhadosCount();
    const horasEsperadas = diasTrabalhados * cargaHorariaDiaria;
    const horasTrabalhadas = this.totalHorasTrabalhadas();
    const devidas = horasEsperadas - horasTrabalhadas;
    return devidas > 0 ? devidas : 0;
  });

  ngOnInit(): void {
    const periodoId = this.route.snapshot.paramMap.get('id');
    if (periodoId) {
      this.carregarDados(periodoId);
    } else {
      this.loading.set(false);
    }
  }

  carregarDados(periodoId: string): void {
    this.loading.set(true);

    // Carregar período
    this.service.getPeriodoById(periodoId).subscribe({
      next: (periodo) => {
        this.periodo.set(periodo);
        if (periodo) {
          // Carregar dados do usuário do período
          const userId = (periodo as any).userId;
          if (userId) {
            this.http.get<any>(`${environment.apiUrl}/users/${userId}`).subscribe({
              next: (user) => {
                this.usuarioPeriodo.set(user);
              },
              error: () => {
                this.usuarioPeriodo.set({ cargaHorariaDiaria: 8 }); // Fallback
              }
            });
          }

          // Carregar registros
          this.service.getRegistrosPorPeriodo(periodoId).subscribe({
            next: (registros) => {
              this.registros.set(registros);
            },
          });

          // Carregar resumo
          this.service.calcularResumoPeriodo(periodoId).subscribe({
            next: (resumo) => {
              this.resumo.set(resumo);
            },
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/fechamento-ponto']);
  }

  calcularHoras(registro: RegistroPonto): string {
    const horas = this.service.calcularHorasTrabalhadas(registro);
    return horas.toFixed(1);
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

  getStatusVariant(
    status: StatusFechamento
  ): 'default' | 'secondary' | 'outline' | 'destructive' {
    const variants: Record<
      StatusFechamento,
      'default' | 'secondary' | 'outline' | 'destructive'
    > = {
      [StatusFechamento.ABERTO]: 'default',
      [StatusFechamento.EM_ANALISE]: 'secondary',
      [StatusFechamento.APROVADO]: 'outline',
      [StatusFechamento.FECHADO]: 'destructive',
    };
    return variants[status];
  }

  getStatusIcon(status: StatusRegistro): string {
    const icons: Record<StatusRegistro, string> = {
      [StatusRegistro.COMPLETO]: 'lucideCircleCheckBig',
      [StatusRegistro.INCOMPLETO]: 'lucideCircleX',
      [StatusRegistro.PENDENTE]: 'lucideCircleAlert',
    };
    return icons[status];
  }

  getStatusIconClass(status: StatusRegistro): string {
    const classes: Record<StatusRegistro, string> = {
      [StatusRegistro.COMPLETO]: 'text-green-600',
      [StatusRegistro.INCOMPLETO]: 'text-red-600',
      [StatusRegistro.PENDENTE]: 'text-yellow-600',
    };
    return classes[status];
  }

  // Métodos de edição inline
  iniciarEdicao(registro: RegistroPonto, campo: 'entrada' | 'saidaAlmoco' | 'retornoAlmoco' | 'saida'): void {
    this.editandoCampo.set(registro.id + '_' + campo);
    this.valorEdicao = (registro[campo] as string) || '';
    this.valorAnterior = this.valorEdicao;
  }

  salvarEdicao(registro: RegistroPonto, campo: 'entrada' | 'saidaAlmoco' | 'retornoAlmoco' | 'saida'): void {
    if (this.valorEdicao !== this.valorAnterior) {
      const dados: Partial<RegistroPonto> = {
        [campo]: this.valorEdicao || undefined,
      };

      this.service.atualizarRegistro(registro.id, dados).subscribe({
        next: () => {
          // Atualizar o registro localmente
          const registrosAtuais = this.registros();
          const index = registrosAtuais.findIndex(r => r.id === registro.id);
          if (index !== -1) {
            registrosAtuais[index] = {
              ...registrosAtuais[index],
              ...dados,
            };
            this.registros.set([...registrosAtuais]);
          }
          this.editandoCampo.set('');
          
          // Toast de sucesso
          toast.success('Registro atualizado', {
            description: 'O horário foi salvo com sucesso',
          });
        },
        error: (err) => {
          console.error('Erro ao atualizar registro:', err);
          this.cancelarEdicao();
          
          // Toast de erro
          toast.error('Erro ao atualizar', {
            description: 'Não foi possível salvar o horário',
          });
        }
      });
    } else {
      this.cancelarEdicao();
    }
  }

  cancelarEdicao(): void {
    this.editandoCampo.set('');
    this.valorEdicao = '';
  }

  // Adicionar novo registro
  adicionarRegistro(): void {
    const dialogRef = this.dialogService.open(AdicionarRegistroDialogComponent);

    dialogRef.closed$.subscribe((resultado: NovoRegistroData | null) => {
      if (resultado) {
        // Adicionar periodoId e userId ao registro
        const periodoId = this.route.snapshot.paramMap.get('id');
        const userId = this.periodo()?.userId;
        
        const registroCompleto: any = {
          ...resultado,
          periodoId: periodoId || undefined,
          userId: userId || undefined,
        };
        
        this.service.criarRegistro(registroCompleto).subscribe({
          next: (novoRegistro) => {
            this.registros.set([...this.registros(), novoRegistro]);
            
            // Recarregar dados para atualizar totais
            const periodoId = this.route.snapshot.paramMap.get('id');
            if (periodoId) {
              this.carregarDados(periodoId);
            }
            
            // Toast de sucesso
            toast.success('Registro criado', {
              description: 'Novo registro de ponto adicionado com sucesso',
            });
          },
          error: (err) => {
            console.error('Erro ao criar registro:', err);
            
            // Toast de erro
            toast.error('Erro ao criar registro', {
              description: 'Não foi possível adicionar o registro',
            });
          }
        });
      }
    });
  }

  // Método de exclusão
  excluirRegistro(registro: RegistroPonto): void {
    this.service.excluirRegistro(registro.id).subscribe({
      next: () => {
        // Remover o registro da lista local
        const registrosAtuais = this.registros();
        this.registros.set(registrosAtuais.filter(r => r.id !== registro.id));
        
        // Toast de sucesso
        toast.success('Registro excluído', {
          description: 'O registro foi removido com sucesso',
        });
      },
      error: (_err) => {
        console.error('Erro ao excluir registro:', _err);
        
        // Toast de erro
        toast.error('Erro ao excluir', {
          description: 'Não foi possível remover o registro',
        });
      }
    });
  }

  // Métodos para mudança de status
  enviarParaAnalise(): void {
    const periodoAtual = this.periodo();
    if (!periodoAtual) return;

    this.service.atualizarStatusPeriodo(periodoAtual.id, StatusFechamento.EM_ANALISE).subscribe({
      next: () => {
        this.periodo.set({ ...periodoAtual, status: StatusFechamento.EM_ANALISE });
        toast.success('Status atualizado', {
          description: 'Período enviado para análise',
        });
      },
      error: (err) => {
        console.error('Erro ao atualizar status:', err);
        toast.error('Erro ao atualizar status', {
          description: 'Não foi possível enviar para análise',
        });
      }
    });
  }

  aprovar(): void {
    const periodoAtual = this.periodo();
    if (!periodoAtual) return;

    this.service.atualizarStatusPeriodo(periodoAtual.id, StatusFechamento.APROVADO).subscribe({
      next: () => {
        this.periodo.set({ ...periodoAtual, status: StatusFechamento.APROVADO });
        toast.success('Período aprovado', {
          description: 'O período foi aprovado com sucesso',
        });
      },
      error: (err) => {
        console.error('Erro ao aprovar:', err);
        toast.error('Erro ao aprovar', {
          description: 'Não foi possível aprovar o período',
        });
      }
    });
  }

  fechar(): void {
    const periodoAtual = this.periodo();
    if (!periodoAtual) return;

    this.service.atualizarStatusPeriodo(periodoAtual.id, StatusFechamento.FECHADO).subscribe({
      next: () => {
        this.periodo.set({ ...periodoAtual, status: StatusFechamento.FECHADO });
        toast.success('Período fechado', {
          description: 'O período foi fechado definitivamente',
        });
      },
      error: (err) => {
        console.error('Erro ao fechar:', err);
        toast.error('Erro ao fechar', {
          description: 'Não foi possível fechar o período',
        });
      }
    });
  }

  reabrir(): void {
    const periodoAtual = this.periodo();
    if (!periodoAtual) return;

    this.service.atualizarStatusPeriodo(periodoAtual.id, StatusFechamento.ABERTO).subscribe({
      next: () => {
        this.periodo.set({ ...periodoAtual, status: StatusFechamento.ABERTO });
        toast.success('Período reaberto', {
          description: 'O período foi reaberto para edição',
        });
      },
      error: (err) => {
        console.error('Erro ao reabrir:', err);
        toast.error('Erro ao reabrir', {
          description: 'Não foi possível reabrir o período',
        });
      }
    });
  }

  getTipoHorarioLabel(tipo: string | undefined): string {
    if (!tipo) return '-';
    const labels: Record<string, string> = {
      'ENTRADA': 'Entrada',
      'SAIDA': 'Saída',
      'SAIDA_ALMOCO': 'Saída Almoço',
      'RETORNO_ALMOCO': 'Retorno Almoço',
    };
    return labels[tipo] || tipo;
  }

  getTipoHorarioBadgeClass(tipo: string | undefined): string {
    if (!tipo) return 'bg-muted';
    const classes: Record<string, string> = {
      'ENTRADA': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      'SAIDA': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      'SAIDA_ALMOCO': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      'RETORNO_ALMOCO': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    };
    return classes[tipo] || 'bg-muted';
  }
}
