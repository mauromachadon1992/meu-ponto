export interface ConfiguracaoLocalizacao {
  ativa: boolean;
  raioMaximo: number; // em metros
  localizacaoBase: {
    latitude: number;
    longitude: number;
    nome: string;
  };
}

export interface ConfiguracoesTrabalhistas {
  id?: string;
  
  // Horas Extras
  percentualHoraExtra50: number; // CLT Art. 59 - padrão 50%
  percentualHoraExtra100: number; // Domingos/feriados - padrão 100%
  
  // Percentuais customizáveis
  usarHoraExtra40: boolean; // Para algumas categorias
  usarHoraExtra50: boolean; // Padrão CLT
  usarHoraExtra80: boolean; // Para categorias específicas
  usarHoraExtra100: boolean; // Domingos/feriados
  
  // Adicional Noturno
  calcularAdicionalNoturno: boolean;
  percentualAdicionalNoturno: number; // CLT Art. 73 - padrão 20%
  horarioInicioNoturno: string; // Padrão: 22:00
  horarioFimNoturno: string; // Padrão: 05:00
  
  // DSR (Descanso Semanal Remunerado)
  calcularDSR: boolean;
  
  // Configurações Gerais
  diasUteisPorMes: number; // Padrão: 22
  horasSemanaisLegais: number; // CLT Art. 7º - padrão 44h
  
  // Descontos
  aplicarDescontoPorAtraso: boolean;
  aplicarDescontoPorFalta: boolean;
  
  // Localização para Registro de Ponto
  localizacao: ConfiguracaoLocalizacao;
  
  // Sistema
  fusoHorario: string; // Ex: 'America/Sao_Paulo', 'America/Fortaleza'
  limitarRegistrosPorDia: boolean;
  quantidadeMaximaRegistrosPorDia: number; // Ex: 4 (entrada, saída almoço, retorno almoço, saída)
  permitirRegistroSemAlmoco: boolean; // Se true, permite só entrada e saída
  
  // Metadados
  criadoEm?: Date;
  atualizadoEm?: Date;
}

export const CONFIGURACOES_PADRAO: ConfiguracoesTrabalhistas = {
  // Horas Extras
  percentualHoraExtra50: 50,
  percentualHoraExtra100: 100,
  
  // Percentuais customizáveis
  usarHoraExtra40: false,
  usarHoraExtra50: true, // Padrão CLT
  usarHoraExtra80: false,
  usarHoraExtra100: true, // Domingos/feriados
  
  // Adicional Noturno
  calcularAdicionalNoturno: true,
  percentualAdicionalNoturno: 20,
  horarioInicioNoturno: '22:00',
  horarioFimNoturno: '05:00',
  
  // DSR
  calcularDSR: true,
  
  // Configurações Gerais
  diasUteisPorMes: 22,
  horasSemanaisLegais: 44,
  
  // Descontos
  aplicarDescontoPorAtraso: true,
  aplicarDescontoPorFalta: true,
  
  // Localização
  localizacao: {
    ativa: false,
    raioMaximo: 100,
    localizacaoBase: {
      latitude: -23.5505,
      longitude: -46.6333,
      nome: 'Escritório Principal',
    },
  },
  
  // Sistema
  fusoHorario: 'America/Sao_Paulo',
  limitarRegistrosPorDia: true,
  quantidadeMaximaRegistrosPorDia: 4, // Entrada, Saída Almoço, Retorno Almoço, Saída
  permitirRegistroSemAlmoco: true,
};
