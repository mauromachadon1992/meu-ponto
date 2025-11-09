import { Injectable, inject } from '@angular/core';
import { ConfiguracoesService } from './configuracoes.service';

/**
 * Serviço para cálculos trabalhistas conforme CLT (Consolidação das Leis do Trabalho)
 */
@Injectable({
  providedIn: 'root',
})
export class CalculosTrabalhistasService {
  private readonly configService = inject(ConfiguracoesService);
  /**
   * Calcula o valor do salário por hora
   * Fórmula CLT: (salário mensal / 220) para jornada de 44h semanais
   * Ajustável para outras cargas horárias
   */
  calcularSalarioPorHora(salarioMensal: number, cargaHorariaDiaria: number = 8): number {
    // Dias úteis por mês configurável (padrão: 22)
    const diasUteisMes = this.configService.getDiasUteisPorMes();
    const horasMensais = diasUteisMes * cargaHorariaDiaria;
    return salarioMensal / horasMensais;
  }

  /**
   * Calcula o valor das horas extras
   * CLT Art. 59: Mínimo 50% de acréscimo (1.5x)
   * CLT Art. 59-A: Domingos e feriados 100% de acréscimo (2x)
   * Percentuais customizáveis: 40%, 50%, 80%, 100%
   */
  calcularValorHorasExtras(
    salarioMensal: number,
    horasExtras: number,
    cargaHorariaDiaria: number = 8,
    ehDomingoOuFeriado: boolean = false
  ): number {
    const salarioPorHora = this.calcularSalarioPorHora(salarioMensal, cargaHorariaDiaria);
    const percentual = this.configService.getPercentualHoraExtra(ehDomingoOuFeriado);
    const multiplicador = 1 + (percentual / 100);
    return horasExtras * salarioPorHora * multiplicador;
  }

  /**
   * Calcula DSR (Descanso Semanal Remunerado) sobre horas extras
   * DSR = (Horas extras da semana / Dias úteis da semana) * Domingos e feriados do mês
   * Simplificado: DSR = Valor horas extras / 6 (média de 1 domingo por semana)
   */
  calcularDSRSobreHorasExtras(valorHorasExtras: number): number {
    if (!this.configService.deveCalcularDSR()) {
      return 0;
    }
    // Proporção simplificada: 1 domingo/feriado para cada 6 dias úteis
    return valorHorasExtras / 6;
  }

  /**
   * Calcula adicional noturno conforme CLT Art. 73
   * Adicional de no mínimo 20% sobre a hora diurna
   */
  calcularAdicionalNoturno(
    salarioMensal: number,
    horasNoturnas: number,
    cargaHorariaDiaria: number = 8
  ): number {
    if (!this.configService.deveCalcularAdicionalNoturno()) {
      return 0;
    }
    
    const config = this.configService.configuracoes();
    const salarioPorHora = this.calcularSalarioPorHora(salarioMensal, cargaHorariaDiaria);
    const percentual = config.percentualAdicionalNoturno;
    const multiplicador = percentual / 100;
    
    return horasNoturnas * salarioPorHora * multiplicador;
  }

  /**
   * Calcula desconto por horas não trabalhadas (faltas)
   * CLT Art. 130: Faltas injustificadas podem ser descontadas
   */
  calcularDescontoHorasDevidas(
    salarioMensal: number,
    horasDevidas: number,
    cargaHorariaDiaria: number = 8
  ): number {
    const salarioPorHora = this.calcularSalarioPorHora(salarioMensal, cargaHorariaDiaria);
    return horasDevidas * salarioPorHora;
  }

  /**
   * Calcula o salário líquido do período considerando:
   * - Salário base (proporcional aos dias trabalhados)
   * - Horas extras
   * - DSR sobre horas extras
   * - Descontos por horas não trabalhadas
   */
  calcularSalarioLiquidoPeriodo(params: {
    salarioMensal: number;
    diasTrabalhados: number;
    diasUteisPeriodo: number;
    horasExtras: number;
    horasDevidas: number;
    cargaHorariaDiaria: number;
  }): {
    salarioBase: number;
    valorHorasExtras: number;
    valorDSR: number;
    descontoHorasDevidas: number;
    total: number;
  } {
    const { salarioMensal, diasTrabalhados, diasUteisPeriodo, horasExtras, horasDevidas, cargaHorariaDiaria } = params;

    // Salário proporcional ao período
    const salarioBase = (salarioMensal / 22) * diasUteisPeriodo;

    // Valor das horas extras (50% adicional)
    const valorHorasExtras = this.calcularValorHorasExtras(salarioMensal, horasExtras, cargaHorariaDiaria);

    // DSR sobre horas extras
    const valorDSR = this.calcularDSRSobreHorasExtras(valorHorasExtras);

    // Desconto por horas não trabalhadas
    const descontoHorasDevidas = this.calcularDescontoHorasDevidas(salarioMensal, horasDevidas, cargaHorariaDiaria);

    // Total líquido
    const total = salarioBase + valorHorasExtras + valorDSR - descontoHorasDevidas;

    return {
      salarioBase,
      valorHorasExtras,
      valorDSR,
      descontoHorasDevidas,
      total,
    };
  }

  /**
   * Calcula proporção de 13º salário para o período
   * 13º Salário = (Salário mensal / 12) * meses trabalhados
   */
  calcularProporcao13Salario(salarioMensal: number, mesesTrabalhados: number): number {
    return (salarioMensal / 12) * mesesTrabalhados;
  }

  /**
   * Calcula proporção de férias para o período
   * Férias = Salário mensal + 1/3 (abono constitucional)
   */
  calcularProporcaoFerias(salarioMensal: number, mesesTrabalhados: number): number {
    const feriasIntegral = salarioMensal + salarioMensal / 3; // Salário + 1/3
    return (feriasIntegral / 12) * mesesTrabalhados;
  }

  /**
   * Calcula horas noturnas em um intervalo de trabalho
   * CLT Art. 73: Período noturno entre 22h e 5h (configurável)
   */
  calcularHorasNoturnas(entrada: string, saida: string): number {
    const config = this.configService.configuracoes();
    
    // Se adicional noturno está desativado, retorna 0
    if (!config.calcularAdicionalNoturno) {
      return 0;
    }

    const inicioNoturno = this.parseHorario(config.horarioInicioNoturno);
    const fimNoturno = this.parseHorario(config.horarioFimNoturno);
    const entradaMinutos = this.parseHorario(entrada);
    const saidaMinutos = this.parseHorario(saida);

    // Se saída é no dia seguinte (madrugada)
    const saidaAjustada = saidaMinutos < entradaMinutos ? saidaMinutos + 1440 : saidaMinutos;
    
    let horasNoturnas = 0;

    // Período noturno 1: 22:00 até meia-noite (até 1440 minutos)
    if (entradaMinutos <= 1440 && saidaAjustada >= inicioNoturno) {
      const inicioCalculo = Math.max(entradaMinutos, inicioNoturno);
      const fimCalculo = Math.min(saidaAjustada, 1440);
      horasNoturnas += Math.max(0, fimCalculo - inicioCalculo);
    }

    // Período noturno 2: Meia-noite até 05:00 (0 até fimNoturno)
    if (saidaAjustada > 1440 || (entradaMinutos < fimNoturno && saidaAjustada >= 0)) {
      const inicioCalculo = saidaAjustada > 1440 ? 1440 : Math.max(0, entradaMinutos);
      const fimCalculo = saidaAjustada > 1440 
        ? Math.min(saidaAjustada, 1440 + fimNoturno)
        : Math.min(saidaAjustada, fimNoturno);
      
      const minutosNoturnosMadrugada = Math.max(0, fimCalculo - inicioCalculo);
      horasNoturnas += minutosNoturnosMadrugada;
    }

    // Converte minutos para horas
    return horasNoturnas / 60;
  }

  /**
   * Converte horário string (HH:mm) para minutos desde meia-noite
   */
  private parseHorario(horario: string): number {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas * 60 + minutos;
  }

  /**
   * Calcula total de horas noturnas considerando intervalos (almoço)
   */
  calcularHorasNoturnasDia(entrada?: string, saidaAlmoco?: string, retornoAlmoco?: string, saida?: string): number {
    if (!entrada || !saida) return 0;

    let totalHorasNoturnas = 0;

    // Período da manhã (entrada até saída almoço)
    if (saidaAlmoco) {
      totalHorasNoturnas += this.calcularHorasNoturnas(entrada, saidaAlmoco);
    }

    // Período da tarde (retorno almoço até saída)
    if (retornoAlmoco && saida) {
      totalHorasNoturnas += this.calcularHorasNoturnas(retornoAlmoco, saida);
    }

    // Se não tem intervalo de almoço, calcula direto
    if (!saidaAlmoco && !retornoAlmoco) {
      totalHorasNoturnas = this.calcularHorasNoturnas(entrada, saida);
    }

    return totalHorasNoturnas;
  }

  /**
   * Formata valor em Real (R$)
   */
  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }
}
