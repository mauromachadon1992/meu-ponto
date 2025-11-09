export interface RegistroPonto {
  id: string;
  userId?: string;
  data: Date;
  horario?: string; // HH:mm - horário do registro
  tipoHorario?: TipoHorario; // ENTRADA, SAIDA, SAIDA_ALMOCO, RETORNO_ALMOCO
  entrada?: string; // HH:mm - Mantido para compatibilidade
  saidaAlmoco?: string;
  retornoAlmoco?: string;
  saida?: string;
  observacao?: string;
  tipo: TipoRegistro;
  status: StatusRegistro;
  horasNoturnas?: number; // Horas trabalhadas no período noturno (22h-05h)
  fotoUrl?: string; // URL ou base64 da foto do registro
  localizacao?: string; // JSON com {latitude, longitude, precisao}
}

export enum TipoHorario {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  SAIDA_ALMOCO = 'SAIDA_ALMOCO',
  RETORNO_ALMOCO = 'RETORNO_ALMOCO'
}

export enum TipoRegistro {
  NORMAL = 'NORMAL',
  FERIADO = 'FERIADO',
  FALTA = 'FALTA',
  ATESTADO = 'ATESTADO',
  FERIAS = 'FERIAS'
}

export enum StatusRegistro {
  PENDENTE = 'PENDENTE',
  COMPLETO = 'COMPLETO',
  INCOMPLETO = 'INCOMPLETO'
}
