export interface PeriodoFechamento {
  id: string;
  userId: string; // ID do usuário dono do período
  dataInicio: Date;
  dataFim: Date;
  totalHorasTrabalhadas: number;
  totalHorasExtras: number;
  totalHorasDevidas: number;
  totalHorasNoturnas?: number; // Horas trabalhadas no período noturno (22h-05h)
  cargaHorariaMensal: number;
  status: StatusFechamento;
  observacoes?: string;
  user?: {
    id: string;
    nome: string;
    email: string;
  };
  _count?: {
    registros: number;
  };
}

export enum StatusFechamento {
  ABERTO = 'ABERTO',
  EM_ANALISE = 'EM_ANALISE',
  APROVADO = 'APROVADO',
  FECHADO = 'FECHADO'
}

export interface ResumoPeriodo {
  // Dados básicos
  diasTrabalhados: number;
  diasFaltados: number;
  diasFeriados: number;
  diasUteisEsperados?: number;
  horasMedias: number;
  totalHorasTrabalhadas?: number;
  totalHorasExtras: number;
  totalHorasDevidas: number;
  
  // Dados avançados
  totalHorasNoturnas?: number;
  totalMinutosAtraso?: number;
  horasDSR?: number;
  percentualHorasExtrasAplicado?: number;
  
  // Valores financeiros
  valorHora?: number;
  valorHorasExtras?: number;
  valorAdicionalNoturno?: number;
  valorDSR?: number;
  descontoAtraso?: number;
  descontoFaltas?: number;
  totalProventos?: number;
  totalDescontos?: number;
}
