import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import {
  PeriodoFechamento,
  StatusFechamento,
  ResumoPeriodo,
  RegistroPonto,
  TipoRegistro,
  StatusRegistro,
} from '../models';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class FechamentoPontoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;
  
  private periodos = signal<PeriodoFechamento[]>([]);
  private registros = signal<RegistroPonto[]>([]);

  // Computed signals para estatísticas
  readonly totalPeriodos = computed(() => this.periodos().length);
  readonly periodosAbertos = computed(
    () => this.periodos().filter((p) => p.status === StatusFechamento.ABERTO).length
  );
  readonly periodosAprovados = computed(
    () => this.periodos().filter((p) => p.status === StatusFechamento.APROVADO).length
  );

  constructor() {
    this.inicializarDadosMock();
  }

  /**
   * Popula o objeto user nos períodos com base no userId
   */
  private populateUserData(periodos: PeriodoFechamento[]): PeriodoFechamento[] {
    const users = this.authService.getMockUsers();
    return periodos.map(periodo => ({
      ...periodo,
      user: users.find(u => u.id === periodo.userId)
    }));
  }

  /**
   * Obtém todos os períodos de fechamento
   */
  getPeriodos(): Observable<PeriodoFechamento[]> {
    return this.http.get<PeriodoFechamento[]>(`${this.apiUrl}/periodos`).pipe(
      map((periodos) =>
        periodos.map((p) => ({
          ...p,
          dataInicio: new Date(p.dataInicio),
          dataFim: new Date(p.dataFim),
        }))
      ),
      map((periodos) => this.populateUserData(periodos)),
      tap((periodos) => this.periodos.set(periodos)),
      catchError(() => {
        // Fallback para dados mock se API não estiver disponível
        const periodosComUser = this.populateUserData(this.periodos());
        return of(periodosComUser);
      })
    );
  }

  /**
   * Obtém um período específico por ID
   */
  getPeriodoById(id: string): Observable<PeriodoFechamento | undefined> {
    return this.http.get<PeriodoFechamento>(`${this.apiUrl}/periodos/${id}`).pipe(
      map((periodo) => ({
        ...periodo,
        dataInicio: new Date(periodo.dataInicio),
        dataFim: new Date(periodo.dataFim),
      })),
      map((periodo) => {
        const users = this.authService.getMockUsers();
        return {
          ...periodo,
          user: users.find(u => u.id === periodo.userId)
        };
      }),
      catchError(() => {
        // Fallback para dados mock
        const periodo = this.periodos().find((p) => p.id === id);
        return of(periodo);
      })
    );
  }

  /**
   * Obtém registros de ponto de um período
   */
  getRegistrosPorPeriodo(periodoId: string): Observable<RegistroPonto[]> {
    return this.http.get<RegistroPonto[]>(`${this.apiUrl}/periodos/${periodoId}/registros`).pipe(
      map((registros) =>
        registros.map((r) => ({
          ...r,
          data: new Date(r.data),
        }))
      ),
      tap((registros) => this.registros.set(registros)),
      catchError(() => {
        // Fallback para dados mock
        const periodo = this.periodos().find((p) => p.id === periodoId);
        if (!periodo) return of([]);

        const registrosFiltrados = this.registros().filter((r) => {
          return r.data >= periodo.dataInicio && r.data <= periodo.dataFim;
        });
        return of(registrosFiltrados);
      })
    );
  }

  /**
   * Calcula o resumo de um período
   */
  calcularResumoPeriodo(periodoId: string): Observable<ResumoPeriodo> {
    return this.http.get<ResumoPeriodo>(`${this.apiUrl}/periodos/${periodoId}/resumo`).pipe(
      catchError(() => {
        // Fallback para cálculo local
        const periodo = this.periodos().find((p) => p.id === periodoId);
        if (!periodo) {
          return of({
            diasTrabalhados: 0,
            diasFaltados: 0,
            diasFeriados: 0,
            horasMedias: 0,
            totalHorasExtras: 0,
            totalHorasDevidas: 0,
          });
        }

        const registros = this.registros().filter(
          (r) => r.data >= periodo.dataInicio && r.data <= periodo.dataFim
        );

        const resumo: ResumoPeriodo = {
          diasTrabalhados: registros.filter((r) => r.tipo === TipoRegistro.NORMAL).length,
          diasFaltados: registros.filter((r) => r.tipo === TipoRegistro.FALTA).length,
          diasFeriados: registros.filter((r) => r.tipo === TipoRegistro.FERIADO).length,
          horasMedias: periodo.totalHorasTrabalhadas / registros.length || 0,
          totalHorasExtras: periodo.totalHorasExtras,
          totalHorasDevidas: periodo.totalHorasDevidas,
        };

        return of(resumo);
      })
    );
  }

  /**
   * Atualiza o status de um período
   */
  atualizarStatusPeriodo(
    periodoId: string,
    novoStatus: StatusFechamento
  ): Observable<PeriodoFechamento> {
    const periodosAtuais = this.periodos();
    const index = periodosAtuais.findIndex((p) => p.id === periodoId);

    if (index !== -1) {
      const periodoAtualizado = {
        ...periodosAtuais[index],
        status: novoStatus,
      };
      periodosAtuais[index] = periodoAtualizado;
      this.periodos.set([...periodosAtuais]);
      return of(periodoAtualizado).pipe(delay(300));
    }

    throw new Error('Período não encontrado');
  }

  /**
   * Cria um novo período de fechamento manualmente (admin)
   */
  criarPeriodo(userId: string, mes: number, ano: number): Observable<PeriodoFechamento> {
    return this.http.post<PeriodoFechamento>(`${this.apiUrl}/periodos`, {
      userId,
      mes,
      ano,
    });
  }

  /**
   * Cria um novo registro de ponto
   */
  criarRegistro(registro: Omit<RegistroPonto, 'id'>): Observable<RegistroPonto> {
    return this.http.post<RegistroPonto>(`${this.apiUrl}/registros`, registro).pipe(
      map((r) => ({
        ...r,
        data: new Date(r.data),
      })),
      tap((novoRegistro) => {
        this.registros.set([...this.registros(), novoRegistro]);
      }),
      catchError(() => {
        // Fallback para criação local
        const novoRegistro: RegistroPonto = {
          ...registro,
          id: `reg-${Date.now()}`,
        };
        this.registros.set([...this.registros(), novoRegistro]);
        return of(novoRegistro);
      })
    );
  }

  /**
   * Atualiza um registro de ponto existente
   */
  atualizarRegistro(id: string, dados: Partial<RegistroPonto>): Observable<RegistroPonto> {
    return this.http.patch<RegistroPonto>(`${this.apiUrl}/registros/${id}`, dados).pipe(
      map((r) => ({
        ...r,
        data: new Date(r.data),
      })),
      tap((registroAtualizado) => {
        const registrosAtuais = this.registros();
        const index = registrosAtuais.findIndex((r) => r.id === id);
        if (index !== -1) {
          registrosAtuais[index] = registroAtualizado;
          this.registros.set([...registrosAtuais]);
        }
      }),
      catchError(() => {
        // Fallback para atualização local
        const registrosAtuais = this.registros();
        const index = registrosAtuais.findIndex((r) => r.id === id);
        if (index !== -1) {
          const registroAtualizado = {
            ...registrosAtuais[index],
            ...dados,
          };
          registrosAtuais[index] = registroAtualizado;
          this.registros.set([...registrosAtuais]);
          return of(registroAtualizado);
        }
        throw new Error('Registro não encontrado');
      })
    );
  }

  /**
   * Exclui um registro de ponto
   */
  excluirRegistro(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/registros/${id}`).pipe(
      tap(() => {
        const registrosAtuais = this.registros();
        this.registros.set(registrosAtuais.filter((r) => r.id !== id));
      }),
      catchError(() => {
        // Fallback para exclusão local
        const registrosAtuais = this.registros();
        this.registros.set(registrosAtuais.filter((r) => r.id !== id));
        return of(void 0);
      })
    );
  }

  /**
   * Calcula horas trabalhadas de um registro
   */
  calcularHorasTrabalhadas(registro: RegistroPonto): number {
    if (!registro.entrada || !registro.saida) return 0;

    const entrada = this.parseTime(registro.entrada);
    const saida = this.parseTime(registro.saida);
    let total = saida - entrada;

    // Descontar intervalo de almoço
    if (registro.saidaAlmoco && registro.retornoAlmoco) {
      const saidaAlmoco = this.parseTime(registro.saidaAlmoco);
      const retornoAlmoco = this.parseTime(registro.retornoAlmoco);
      total -= retornoAlmoco - saidaAlmoco;
    }

    return total / 60; // Retorna em horas
  }

  // Métodos auxiliares privados

  private parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private gerarId(): string {
    return `periodo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private inicializarDadosMock(): void {
    // Dados mock para desenvolvimento
    const hoje = new Date();
    const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const fimMesPassado = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    const doisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
    const fimDoisMesesAtras = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 0);

    const periodosMock: PeriodoFechamento[] = [
      // Períodos de João Silva (id: '1')
      {
        id: '1',
        userId: '1',
        dataInicio: mesPassado,
        dataFim: fimMesPassado,
        totalHorasTrabalhadas: 176,
        totalHorasExtras: 12,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 176,
        status: StatusFechamento.APROVADO,
        observacoes: 'Mês fechado com horas extras',
      },
      {
        id: '2',
        userId: '1',
        dataInicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
        dataFim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
        totalHorasTrabalhadas: 88,
        totalHorasExtras: 4,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 176,
        status: StatusFechamento.ABERTO,
        observacoes: 'Mês atual em andamento',
      },
      // Períodos de Maria Santos (id: '2')
      {
        id: '3',
        userId: '2',
        dataInicio: doisMesesAtras,
        dataFim: fimDoisMesesAtras,
        totalHorasTrabalhadas: 176,
        totalHorasExtras: 8,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 176,
        status: StatusFechamento.FECHADO,
        observacoes: 'Período fechado',
      },
      {
        id: '4',
        userId: '2',
        dataInicio: mesPassado,
        dataFim: fimMesPassado,
        totalHorasTrabalhadas: 176,
        totalHorasExtras: 6,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 176,
        status: StatusFechamento.EM_ANALISE,
        observacoes: 'Em análise pela gestão',
      },
      {
        id: '5',
        userId: '2',
        dataInicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
        dataFim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
        totalHorasTrabalhadas: 92,
        totalHorasExtras: 2,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 176,
        status: StatusFechamento.ABERTO,
        observacoes: 'Mês em andamento',
      },
      // Períodos de Pedro Oliveira (id: '3')
      {
        id: '6',
        userId: '3',
        dataInicio: mesPassado,
        dataFim: fimMesPassado,
        totalHorasTrabalhadas: 132,
        totalHorasExtras: 0,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 132,
        status: StatusFechamento.APROVADO,
        observacoes: 'Carga horária reduzida',
      },
      {
        id: '7',
        userId: '3',
        dataInicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
        dataFim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0),
        totalHorasTrabalhadas: 66,
        totalHorasExtras: 0,
        totalHorasDevidas: 0,
        cargaHorariaMensal: 132,
        status: StatusFechamento.ABERTO,
        observacoes: 'Mês em andamento',
      },
    ];

    this.periodos.set(periodosMock);

    // Registros mock
    const registrosMock: RegistroPonto[] = this.gerarRegistrosMock(mesPassado, fimMesPassado);
    this.registros.set(registrosMock);
  }

  private gerarRegistrosMock(dataInicio: Date, dataFim: Date): RegistroPonto[] {
    const registros: RegistroPonto[] = [];
    const diasUteis = this.getDiasUteis(dataInicio, dataFim);

    diasUteis.forEach((dia, index) => {
      registros.push({
        id: `reg-${index}`,
        data: dia,
        entrada: '08:00',
        saidaAlmoco: '12:00',
        retornoAlmoco: '13:00',
        saida: '17:00',
        tipo: TipoRegistro.NORMAL,
        status: StatusRegistro.COMPLETO,
      });
    });

    return registros;
  }

  private getDiasUteis(dataInicio: Date, dataFim: Date): Date[] {
    const dias: Date[] = [];
    const atual = new Date(dataInicio);

    while (atual <= dataFim) {
      const diaSemana = atual.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        // Não é domingo nem sábado
        dias.push(new Date(atual));
      }
      atual.setDate(atual.getDate() + 1);
    }

    return dias;
  }
}
