import { Injectable, signal } from '@angular/core';
import { ConfiguracoesTrabalhistas, CONFIGURACOES_PADRAO } from '../models/configuracoes.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ConfiguracoesService {
  private readonly STORAGE_KEY = 'configuracoes_trabalhistas';
  
  // Signal com as configurações atuais
  private configuracoesState = signal<ConfiguracoesTrabalhistas>(this.carregarConfiguracoes());

  // Getter público
  readonly configuracoes = this.configuracoesState.asReadonly();

  constructor() {
    // Carrega configurações do localStorage ao iniciar
    const config = this.carregarConfiguracoes();
    this.configuracoesState.set(config);
  }

  /**
   * Carrega configurações do localStorage ou retorna padrão
   */
  private carregarConfiguracoes(): ConfiguracoesTrabalhistas {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const config = JSON.parse(stored);
        return { ...CONFIGURACOES_PADRAO, ...config };
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        return CONFIGURACOES_PADRAO;
      }
    }
    return CONFIGURACOES_PADRAO;
  }

  /**
   * Salva configurações no localStorage e sincroniza com backend
   */
  salvarConfiguracoes(config: ConfiguracoesTrabalhistas): void {
    const configComTimestamp = {
      ...config,
      atualizadoEm: new Date(),
    };
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configComTimestamp));
    this.configuracoesState.set(configComTimestamp);
    
    // Sincronizar com backend
    const apiUrl = environment.apiUrl || '/api';
    fetch(`${apiUrl}/configuracoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(err => console.error('Erro ao sincronizar configurações com backend:', err));
  }

  /**
   * Reseta configurações para o padrão
   */
  resetarParaPadrao(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.configuracoesState.set(CONFIGURACOES_PADRAO);
  }

  /**
   * Obtém o percentual de hora extra baseado nas configurações
   */
  getPercentualHoraExtra(ehDomingoOuFeriado: boolean = false): number {
    const config = this.configuracoesState();
    
    if (ehDomingoOuFeriado && config.usarHoraExtra100) {
      return config.percentualHoraExtra100;
    }
    
    // Retorna o primeiro percentual habilitado
    if (config.usarHoraExtra40) return 40;
    if (config.usarHoraExtra50) return 50;
    if (config.usarHoraExtra80) return 80;
    
    return 50; // Padrão CLT
  }

  /**
   * Verifica se deve calcular adicional noturno
   */
  deveCalcularAdicionalNoturno(): boolean {
    return this.configuracoesState().calcularAdicionalNoturno;
  }

  /**
   * Verifica se deve calcular DSR
   */
  deveCalcularDSR(): boolean {
    return this.configuracoesState().calcularDSR;
  }

  /**
   * Obtém o número de dias úteis por mês
   */
  getDiasUteisPorMes(): number {
    return this.configuracoesState().diasUteisPorMes;
  }
}
