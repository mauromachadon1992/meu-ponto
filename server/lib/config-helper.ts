// Configurações padrão (sincronizado com frontend)
export interface ConfiguracoesTrabalhistas {
  // Horas Extras
  percentualHoraExtra50: number;
  percentualHoraExtra100: number;
  usarHoraExtra40: boolean;
  usarHoraExtra50: boolean;
  usarHoraExtra80: boolean;
  usarHoraExtra100: boolean;
  
  // Adicional Noturno
  calcularAdicionalNoturno: boolean;
  percentualAdicionalNoturno: number;
  horarioInicioNoturno: string;
  horarioFimNoturno: string;
  
  // DSR
  calcularDSR: boolean;
  
  // Configurações Gerais
  diasUteisPorMes: number;
  horasSemanaisLegais: number;
  
  // Descontos
  aplicarDescontoPorAtraso: boolean;
  aplicarDescontoPorFalta: boolean;
  
  // Sistema
  fusoHorario: string;
  limitarRegistrosPorDia: boolean;
  quantidadeMaximaRegistrosPorDia: number;
  permitirRegistroSemAlmoco: boolean;
}

export const CONFIGURACOES_PADRAO: ConfiguracoesTrabalhistas = {
  percentualHoraExtra50: 50,
  percentualHoraExtra100: 100,
  usarHoraExtra40: false,
  usarHoraExtra50: true,
  usarHoraExtra80: false,
  usarHoraExtra100: true,
  calcularAdicionalNoturno: true,
  percentualAdicionalNoturno: 20,
  horarioInicioNoturno: '22:00',
  horarioFimNoturno: '05:00',
  calcularDSR: true,
  diasUteisPorMes: 22,
  horasSemanaisLegais: 44,
  aplicarDescontoPorAtraso: true,
  aplicarDescontoPorFalta: true,
  fusoHorario: 'America/Sao_Paulo',
  limitarRegistrosPorDia: true,
  quantidadeMaximaRegistrosPorDia: 4,
  permitirRegistroSemAlmoco: true,
};

// Cache em memória das configurações (em produção, usar Redis)
let configCache: ConfiguracoesTrabalhistas = CONFIGURACOES_PADRAO;

export function setConfiguracoes(config: ConfiguracoesTrabalhistas) {
  configCache = { ...CONFIGURACOES_PADRAO, ...config };
}

export function getConfiguracoes(): ConfiguracoesTrabalhistas {
  return configCache;
}

/**
 * Obtém o percentual de hora extra baseado nas configurações
 */
export function getPercentualHoraExtra(ehDomingoOuFeriado: boolean = false): number {
  const config = getConfiguracoes();
  
  if (ehDomingoOuFeriado && config.usarHoraExtra100) {
    return 100;
  }
  
  // Retorna o primeiro percentual habilitado
  if (config.usarHoraExtra40) return 40;
  if (config.usarHoraExtra50) return 50;
  if (config.usarHoraExtra80) return 80;
  
  return 50; // Padrão CLT
}

/**
 * Calcula horas noturnas (22h-5h) em um período de trabalho
 */
export function calcularHorasNoturnas(horaInicio: string, horaFim: string): number {
  const config = getConfiguracoes();
  
  if (!config.calcularAdicionalNoturno) return 0;
  
  const [hInicioNoturno, mInicioNoturno] = config.horarioInicioNoturno.split(':').map(Number);
  const [hFimNoturno, mFimNoturno] = config.horarioFimNoturno.split(':').map(Number);
  
  const [h1, m1] = horaInicio.split(':').map(Number);
  const [h2, m2] = horaFim.split(':').map(Number);
  
  // Converter para minutos desde meia-noite
  const inicioMinutos = h1 * 60 + m1;
  const fimMinutos = h2 * 60 + m2;
  const noturnoInicioMinutos = hInicioNoturno * 60 + mInicioNoturno;
  const noturnoFimMinutos = (hFimNoturno < hInicioNoturno ? hFimNoturno + 24 : hFimNoturno) * 60 + mFimNoturno;
  
  let horasNoturnas = 0;
  
  // Verificar se trabalhou após 22h
  if (inicioMinutos <= noturnoInicioMinutos && fimMinutos >= noturnoInicioMinutos) {
    const fim = Math.min(fimMinutos, 24 * 60);
    horasNoturnas += (fim - noturnoInicioMinutos) / 60;
  } else if (inicioMinutos > noturnoInicioMinutos) {
    const fim = Math.min(fimMinutos, 24 * 60);
    horasNoturnas += (fim - inicioMinutos) / 60;
  }
  
  // Verificar se trabalhou antes das 5h (madrugada)
  if (h1 < hFimNoturno || (h1 === hFimNoturno && m1 < mFimNoturno)) {
    const inicio = 0;
    const fim = Math.min(h2 < hFimNoturno ? (h2 * 60 + m2) : noturnoFimMinutos, noturnoFimMinutos);
    horasNoturnas += (fim - inicio) / 60;
  }
  
  return Math.max(0, horasNoturnas);
}

/**
 * Calcula minutos de atraso baseado no horário esperado de entrada
 */
export function calcularMinutosAtraso(horarioEsperado: string, horarioReal: string): number {
  const config = getConfiguracoes();
  
  if (!config.aplicarDescontoPorAtraso) return 0;
  
  const [h1, m1] = horarioEsperado.split(':').map(Number);
  const [h2, m2] = horarioReal.split(':').map(Number);
  
  const esperado = h1 * 60 + m1;
  const real = h2 * 60 + m2;
  
  return Math.max(0, real - esperado);
}

/**
 * Calcula DSR (Descanso Semanal Remunerado) sobre horas extras
 * DSR = (Horas Extras / Dias Úteis da Semana) = Horas Extras / 6
 */
export function calcularDSR(horasExtras: number): number {
  const config = getConfiguracoes();
  
  if (!config.calcularDSR || horasExtras <= 0) return 0;
  
  return horasExtras / 6;
}

/**
 * Verifica se uma data é domingo ou sábado
 */
export function ehFimDeSemana(data: Date): boolean {
  const dia = data.getDay();
  return dia === 0 || dia === 6;
}

/**
 * Verifica se uma data é domingo
 */
export function ehDomingo(data: Date): boolean {
  return data.getDay() === 0;
}
