import {
  getConfiguracoes,
  setConfiguracoes,
  type ConfiguracoesTrabalhistas,
} from '../../lib/config-helper';

// Service para lógica de negócio de Configurações
export abstract class ConfiguracoesService {
  static get(): ConfiguracoesTrabalhistas {
    return getConfiguracoes();
  }

  static update(data: Partial<ConfiguracoesTrabalhistas>): ConfiguracoesTrabalhistas {
    setConfiguracoes(data as ConfiguracoesTrabalhistas);
    return getConfiguracoes();
  }
}
