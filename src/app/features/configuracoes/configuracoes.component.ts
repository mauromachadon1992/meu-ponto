import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';

import { HlmCard, HlmCardHeader, HlmCardTitle, HlmCardDescription, HlmCardContent } from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmSwitch } from '@spartan-ng/helm/switch';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSettings, lucideSave, lucideRotateCcw, lucideInfo, lucideMapPin, lucideLoader } from '@ng-icons/lucide';

import { ConfiguracoesService } from '../../core/services/configuracoes.service';
import { ConfiguracoesTrabalhistas } from '../../core/models/configuracoes.model';

@Component({
  selector: 'app-configuracoes',
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
    HlmIcon,
    HlmInput,
    HlmLabel,
    HlmSeparator,
    HlmSwitch,
    NgIcon,
  ],
  providers: [provideIcons({ lucideSettings, lucideSave, lucideRotateCcw, lucideInfo, lucideMapPin, lucideLoader })],
  template: `
    <div class="w-full max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ng-icon hlm name="lucideSettings" size="lg" />
            Configurações Trabalhistas
          </h1>
          <p class="text-muted-foreground mt-1">
            Personalize os cálculos conforme convenções coletivas e CLT
          </p>
        </div>
        
        <div class="flex gap-2">
          <button hlmBtn variant="outline" (click)="resetar()" class="gap-2">
            <ng-icon hlm name="lucideRotateCcw" size="sm" />
            Restaurar Padrão
          </button>
          <button hlmBtn (click)="salvar()" class="gap-2">
            <ng-icon hlm name="lucideSave" size="sm" />
            Salvar
          </button>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Horas Extras -->
        <div hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Horas Extras</h3>
            <p hlmCardDescription>Configure os percentuais de acréscimo sobre a hora normal</p>
          </div>
          <div hlmCardContent class="space-y-3">
            <!-- Hora Extra 40% -->
            <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="text-sm font-medium">Hora Extra 40%</div>
                <p class="text-xs text-muted-foreground">Para categorias específicas (ex: bancários)</p>
              </div>
              <hlm-switch [(ngModel)]="config().usarHoraExtra40" />
            </label>

            <!-- Hora Extra 50% -->
            <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="text-sm font-medium">Hora Extra 50% (Padrão CLT)</div>
                <p class="text-xs text-muted-foreground">CLT Art. 59 - Acréscimo mínimo de 50%</p>
              </div>
              <hlm-switch [(ngModel)]="config().usarHoraExtra50" />
            </label>

            <!-- Hora Extra 80% -->
            <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="text-sm font-medium">Hora Extra 80%</div>
                <p class="text-xs text-muted-foreground">Para categorias com convenção específica</p>
              </div>
              <hlm-switch [(ngModel)]="config().usarHoraExtra80" />
            </label>

            <!-- Hora Extra 100% -->
            <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="text-sm font-medium">Hora Extra 100%</div>
                <p class="text-xs text-muted-foreground">Domingos e feriados (CLT Art. 59-A)</p>
              </div>
              <hlm-switch [(ngModel)]="config().usarHoraExtra100" />
            </label>

            <div hlmSeparator></div>

            <div class="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 flex gap-2">
              <ng-icon hlm name="lucideInfo" size="sm" class="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p class="text-xs text-blue-900 dark:text-blue-100">
                O sistema utilizará o percentual configurado. Para múltiplos percentuais, será aplicado o primeiro habilitado.
              </p>
            </div>
          </div>
        </div>

        <!-- Adicional Noturno -->
        <div hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Adicional Noturno</h3>
            <p hlmCardDescription>CLT Art. 73 - Trabalho entre 22h e 5h</p>
          </div>
          <div hlmCardContent class="space-y-4">
            <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="text-sm font-medium">Calcular Adicional Noturno</div>
                <p class="text-xs text-muted-foreground">Ativar cálculo de horas noturnas</p>
              </div>
              <hlm-switch [(ngModel)]="config().calcularAdicionalNoturno" />
            </label>

            @if (config().calcularAdicionalNoturno) {
              <div class="space-y-2">
                <label hlmLabel for="percentualNoturno">Percentual Adicional</label>
                <div class="flex items-center gap-2">
                  <input
                    hlmInput
                    type="number"
                    id="percentualNoturno"
                    [(ngModel)]="config().percentualAdicionalNoturno"
                    min="0"
                    max="100"
                    class="flex-1"
                  />
                  <span class="text-sm text-muted-foreground">%</span>
                </div>
                <p class="text-xs text-muted-foreground">CLT: mínimo 20%</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <label hlmLabel for="inicioNoturno">Início Período Noturno</label>
                  <input
                    hlmInput
                    type="time"
                    id="inicioNoturno"
                    [(ngModel)]="config().horarioInicioNoturno"
                    step="1"
                    class="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
                <div class="space-y-2">
                  <label hlmLabel for="fimNoturno">Fim Período Noturno</label>
                  <input
                    hlmInput
                    type="time"
                    id="fimNoturno"
                    [(ngModel)]="config().horarioFimNoturno"
                    step="1"
                    class="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                </div>
              </div>
            }
          </div>
        </div>

        <!-- DSR e Configurações Gerais -->
        <div hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Configurações Gerais</h3>
            <p hlmCardDescription>Parâmetros gerais dos cálculos trabalhistas</p>
          </div>
          <div hlmCardContent class="space-y-4">
            <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="text-sm font-medium">Calcular DSR</div>
                <p class="text-xs text-muted-foreground">Descanso Semanal Remunerado sobre horas extras</p>
              </div>
              <hlm-switch [(ngModel)]="config().calcularDSR" />
            </label>

            <div hlmSeparator></div>

            <div class="space-y-2">
              <label hlmLabel for="diasUteis">Dias Úteis por Mês</label>
              <input
                hlmInput
                type="number"
                id="diasUteis"
                [(ngModel)]="config().diasUteisPorMes"
                min="20"
                max="23"
              />
              <p class="text-xs text-muted-foreground">Usado para cálculo do salário/hora (geralmente 22)</p>
            </div>

            <div class="space-y-2">
              <label hlmLabel for="horasSemanais">Horas Semanais Legais</label>
              <input
                hlmInput
                type="number"
                id="horasSemanais"
                [(ngModel)]="config().horasSemanaisLegais"
                min="36"
                max="44"
              />
              <p class="text-xs text-muted-foreground">CLT Art. 7º: máximo 44 horas semanais</p>
            </div>
          </div>
        </div>

        <!-- Descontos -->
        <div hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Descontos</h3>
            <p hlmCardDescription>Configure os descontos aplicáveis</p>
          </div>
          <div hlmCardContent class="space-y-4">
            <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="text-sm font-medium">Aplicar Desconto por Atraso</div>
                <p class="text-xs text-muted-foreground">Descontar minutos de atraso do salário</p>
              </div>
              <hlm-switch [(ngModel)]="config().aplicarDescontoPorAtraso" />
            </label>

            <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="text-sm font-medium">Aplicar Desconto por Falta</div>
                <p class="text-xs text-muted-foreground">Descontar dias não trabalhados (CLT Art. 130)</p>
              </div>
              <hlm-switch [(ngModel)]="config().aplicarDescontoPorFalta" />
            </label>

            <div hlmSeparator></div>

            <div class="bg-yellow-50 dark:bg-yellow-950 rounded-lg p-3 flex gap-2">
              <ng-icon hlm name="lucideInfo" size="sm" class="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <p class="text-xs text-yellow-900 dark:text-yellow-100">
                Os descontos serão aplicados conforme permitido pela CLT e convenções coletivas.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Configurações de Sistema -->
      <div hlmCard>
        <div hlmCardHeader>
          <h3 hlmCardTitle>Configurações de Sistema</h3>
          <p hlmCardDescription>Ajustes de fuso horário e limites de registro</p>
        </div>
        <div hlmCardContent class="space-y-4">
          <!-- Fuso Horário -->
          <div class="space-y-2">
            <label hlmLabel for="fusoHorario">Fuso Horário</label>
            <select
              hlmInput
              id="fusoHorario"
              [(ngModel)]="config().fusoHorario"
              class="w-full"
            >
              <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
              <option value="America/Fortaleza">Fortaleza (UTC-3)</option>
              <option value="America/Manaus">Manaus (UTC-4)</option>
              <option value="America/Rio_Branco">Rio Branco (UTC-5)</option>
              <option value="America/Noronha">Fernando de Noronha (UTC-2)</option>
            </select>
            <p class="text-xs text-muted-foreground">
              Define o fuso horário usado para calcular datas e horários no sistema
            </p>
          </div>

          <div hlmSeparator></div>

          <!-- Limitar Registros -->
          <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
            <div class="flex-1">
              <div class="text-sm font-medium">Limitar Quantidade de Registros por Dia</div>
              <p class="text-xs text-muted-foreground">Impede que funcionários façam mais registros que o permitido</p>
            </div>
            <hlm-switch [(ngModel)]="config().limitarRegistrosPorDia" />
          </label>

          @if (config().limitarRegistrosPorDia) {
            <div class="space-y-3 pl-3 border-l-2 border-primary/20">
              <div class="space-y-2">
                <label hlmLabel for="quantidadeMaxima">Quantidade Máxima de Registros por Dia</label>
                <input
                  hlmInput
                  type="number"
                  id="quantidadeMaxima"
                  [(ngModel)]="config().quantidadeMaximaRegistrosPorDia"
                  min="2"
                  max="10"
                  class="w-full"
                />
                <p class="text-xs text-muted-foreground">
                  Exemplo: 4 registros = Entrada + Saída Almoço + Retorno Almoço + Saída
                </p>
              </div>

              <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
                <div class="flex-1">
                  <div class="text-sm font-medium">Permitir Registro sem Pausa para Almoço</div>
                  <p class="text-xs text-muted-foreground">
                    Permite jornadas sem intervalo (somente Entrada + Saída)
                  </p>
                </div>
                <hlm-switch [(ngModel)]="config().permitirRegistroSemAlmoco" />
              </label>
            </div>
          }
        </div>
      </div>

      <!-- Registro de Ponto com Localização -->
      <div hlmCard>
        <div hlmCardHeader>
          <h3 hlmCardTitle>Registro de Ponto - Geolocalização</h3>
          <p hlmCardDescription>Configure a verificação de localização no registro de ponto</p>
        </div>
        <div hlmCardContent class="space-y-4">
          <!-- Ativar Localização -->
          <label class="flex items-center justify-between space-x-2 p-3 rounded-lg hover:bg-accent/50 transition-colors" hlmLabel>
            <div class="flex-1">
              <div class="text-sm font-medium">Exigir Localização</div>
              <p class="text-xs text-muted-foreground">Ativa verificação de GPS no registro de ponto</p>
            </div>
            <hlm-switch [(ngModel)]="config().localizacao.ativa" />
          </label>

          @if (config().localizacao.ativa) {
            <div class="space-y-3 pl-3 border-l-2 border-primary/20">
              <!-- Nome do Local -->
              <div class="space-y-2">
                <label hlmLabel for="nomeLocal">Nome do Local</label>
                <input
                  hlmInput
                  type="text"
                  id="nomeLocal"
                  [(ngModel)]="config().localizacao.localizacaoBase.nome"
                  placeholder="Ex: Escritório Principal"
                  class="w-full"
                />
              </div>

              <!-- Raio Máximo -->
              <div class="space-y-2">
                <label hlmLabel for="raioMaximo">Raio Máximo Permitido (metros)</label>
                <input
                  hlmInput
                  type="number"
                  id="raioMaximo"
                  [(ngModel)]="config().localizacao.raioMaximo"
                  min="10"
                  step="10"
                  placeholder="Ex: 100"
                  class="w-full"
                />
                <p class="text-xs text-muted-foreground">
                  Distância máxima permitida do ponto de referência
                </p>
              </div>

              <!-- Coordenadas -->
              <div class="grid gap-3 md:grid-cols-2">
                <div class="space-y-2">
                  <label hlmLabel for="latitude">Latitude</label>
                  <input
                    hlmInput
                    type="number"
                    id="latitude"
                    [(ngModel)]="config().localizacao.localizacaoBase.latitude"
                    step="0.000001"
                    placeholder="-23.5505"
                    class="w-full"
                  />
                </div>
                <div class="space-y-2">
                  <label hlmLabel for="longitude">Longitude</label>
                  <input
                    hlmInput
                    type="number"
                    id="longitude"
                    [(ngModel)]="config().localizacao.localizacaoBase.longitude"
                    step="0.000001"
                    placeholder="-46.6333"
                    class="w-full"
                  />
                </div>
              </div>

              <button
                hlmBtn
                variant="outline"
                size="sm"
                type="button"
                [disabled]="obtendoLocalizacao()"
                (click)="obterLocalizacaoAtual()"
                class="w-full gap-2"
              >
                @if (obtendoLocalizacao()) {
                  <ng-icon hlm name="lucideLoader" size="sm" class="animate-spin" />
                  Obtendo localização...
                } @else {
                  <ng-icon hlm name="lucideMapPin" size="sm" />
                  Usar Minha Localização Atual
                }
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Informações Legais -->
      <div hlmCard class="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
        <div hlmCardHeader>
          <h3 hlmCardTitle class="text-blue-900 dark:text-blue-100">Base Legal</h3>
        </div>
        <div hlmCardContent class="text-sm text-blue-900 dark:text-blue-100 space-y-2">
          <p><strong>CLT Art. 7º, XIII:</strong> Duração do trabalho normal não superior a 8 horas diárias e 44 semanais.</p>
          <p><strong>CLT Art. 59:</strong> Horas extras com acréscimo de no mínimo 50% sobre o valor da hora normal.</p>
          <p><strong>CLT Art. 59-A:</strong> Trabalho em domingos e feriados com acréscimo de 100%.</p>
          <p><strong>CLT Art. 73:</strong> Adicional noturno de no mínimo 20% para trabalho entre 22h e 5h.</p>
          <p><strong>Convenções Coletivas:</strong> Podem estabelecer percentuais superiores aos previstos na CLT.</p>
        </div>
      </div>
    </div>
  `,
})
export class ConfiguracoesComponent implements OnInit {
  private readonly configService = inject(ConfiguracoesService);
  
  config = signal<ConfiguracoesTrabalhistas>(this.configService.configuracoes());
  obtendoLocalizacao = signal(false);

  ngOnInit(): void {
    // Carrega configurações atuais
    this.config.set({ ...this.configService.configuracoes() });
  }

  salvar(): void {
    try {
      this.configService.salvarConfiguracoes(this.config());
      toast.success('Configurações salvas!', {
        description: 'As alterações foram aplicadas com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar', {
        description: 'Não foi possível salvar as configurações.',
      });
    }
  }

  resetar(): void {
    this.configService.resetarParaPadrao();
    this.config.set({ ...this.configService.configuracoes() });
    toast.success('Configurações restauradas!', {
      description: 'Os valores padrão foram restaurados.',
    });
  }

  obterLocalizacaoAtual(): void {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada', {
        description: 'Seu navegador não suporta geolocalização.',
      });
      return;
    }

    this.obtendoLocalizacao.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.config.update((config) => ({
          ...config,
          localizacao: {
            ...config.localizacao,
            localizacaoBase: {
              ...config.localizacao.localizacaoBase,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          },
        }));
        this.obtendoLocalizacao.set(false);
        toast.success('Localização obtida!', {
          description: 'Coordenadas atualizadas com sucesso.',
        });
      },
      (error) => {
        this.obtendoLocalizacao.set(false);
        let mensagem = 'Erro ao obter localização.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            mensagem = 'Permissão de localização negada.';
            break;
          case error.POSITION_UNAVAILABLE:
            mensagem = 'Localização indisponível.';
            break;
          case error.TIMEOUT:
            mensagem = 'Tempo limite excedido.';
            break;
        }
        toast.error('Erro', { description: mensagem });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }
}
