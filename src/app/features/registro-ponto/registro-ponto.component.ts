import { Component, signal, computed, inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import { HlmCard, HlmCardHeader, HlmCardTitle, HlmCardContent } from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmAlert, HlmAlertDescription, HlmAlertIcon } from '@spartan-ng/helm/alert';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCamera,
  lucideMapPin,
  lucideClock,
  lucideUser,
  lucideCircleCheck,
  lucideCircleAlert,
  lucideRefreshCw,
  lucideX,
  lucideLoader,
} from '@ng-icons/lucide';
import { AuthService } from '../../core/services/auth.service';
import { FechamentoPontoService } from '../../core/services/fechamento-ponto.service';
import { ConfiguracoesService } from '../../core/services/configuracoes.service';
import { RegistroPontoService } from '../../core/services/registro-ponto.service';
import { TipoRegistro } from '../../core/models';

interface Localizacao {
  latitude: number;
  longitude: number;
  precisao: number;
  timestamp: number;
}

@Component({
  selector: 'app-registro-ponto',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HlmCard,
    HlmCardHeader,
    HlmCardTitle,
    HlmCardContent,
    HlmButton,
    HlmInput,
    HlmAlert,
    HlmAlertDescription,
    HlmAlertIcon,
    HlmIcon,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideCamera,
      lucideMapPin,
      lucideClock,
      lucideUser,
      lucideCircleCheck,
      lucideCircleAlert,
      lucideRefreshCw,
      lucideX,
      lucideLoader,
    }),
  ],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <!-- Container Centralizado -->
      <div class="w-full max-w-2xl space-y-6">
        <!-- Logo Animado -->
        <div class="flex justify-center mb-4">
          <img 
            src="/logo-animated.svg" 
            alt="Meu Ponto - Logo Animado" 
            class="w-24 h-24 md:w-32 md:h-32 animate-[fade-in_0.8s_ease-out] drop-shadow-lg" 
          />
        </div>
        
        <!-- Header com Data/Hora -->
        <div class="text-center">
          <div class="text-6x1 md:text-8xl font-bold mb-2">{{ horaAtual() }}</div>
          <div class="text-sm text-muted-foreground">{{ dataAtual() }}</div>
        </div>

      <!-- Status de Localização (se ativo) -->
      @if (configuracaoLocalizacao().ativa) {
        <div hlmCard class="mb-6">
          <div hlmCardContent class="pt-6">
            <div class="flex items-start gap-3">
              <ng-icon hlm name="lucideMapPin" class="text-muted-foreground mt-1" />
              <div class="flex-1 min-w-0">
                @if (localizacaoCarregando()) {
                  <div class="flex items-center gap-2 text-sm">
                    <ng-icon hlm name="lucideLoader" size="sm" class="animate-spin" />
                    <span class="text-muted-foreground">Obtendo localização...</span>
                  </div>
                } @else if (localizacaoAtual()) {
                  <div class="space-y-2">
                    <div class="text-sm font-medium">{{ configuracaoLocalizacao().localizacaoBase.nome }}</div>
                    @if (dentroDoRaio()) {
                      <div class="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <ng-icon hlm name="lucideCircleCheck" size="sm" />
                        <span>Dentro do raio permitido</span>
                      </div>
                    } @else {
                      <div class="flex items-center gap-2 text-sm text-destructive">
                        <ng-icon hlm name="lucideCircleAlert" size="sm" />
                        <span>Fora do raio ({{ distanciaDoLocal().toFixed(0) }}m / {{ configuracaoLocalizacao().raioMaximo }}m)</span>
                      </div>
                    }
                    <div class="text-xs text-muted-foreground">
                      Precisão: {{ localizacaoAtual()!.precisao.toFixed(0) }}m
                    </div>
                  </div>
                } @else if (erroLocalizacao()) {
                  <div class="text-sm text-destructive">{{ erroLocalizacao() }}</div>
                }
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Card Principal -->
      <div hlmCard>
        <div hlmCardHeader>
          <h3 hlmCardTitle class="text-center">
            @if (!usuarioVerificado()) {
              Digite seu PIN
            } @else {
              Capture sua Foto
            }
          </h3>
        </div>
        <div hlmCardContent class="space-y-4">
          <!-- Etapa 1: PIN -->
          @if (!usuarioVerificado()) {
            <div class="space-y-4">
              <div class="space-y-2">
                <input
                  hlmInput
                  type="password"
                  inputmode="numeric"
                  placeholder="••••"
                  maxlength="4"
                  [(ngModel)]="pin"
                  [disabled]="processando()"
                  (keyup.enter)="verificarUsuario()"
                  class="text-center text-4xl tracking-[1rem] font-bold h-16"
                  autofocus
                />
                <p class="text-xs text-center text-muted-foreground">
                  Digite seu PIN de 4 dígitos
                </p>
              </div>

              <button
                hlmBtn
                class="w-full"
                size="lg"
                [disabled]="pin.length !== 4 || processando()"
                (click)="verificarUsuario()"
              >
                @if (processando()) {
                  <ng-icon hlm name="lucideLoader" size="sm" class="animate-spin" />
                  Verificando...
                } @else {
                  <ng-icon hlm name="lucideUser" size="sm" />
                  Verificar PIN
                }
              </button>

              <!-- Botão Área Administrativa -->
              <button
                hlmBtn
                variant="outline"
                size="lg"
                (click)="irParaLogin()"
                class="w-full text-muted-foreground hover:text-foreground"
              >
                <ng-icon hlm name="lucideUser" size="sm" />
                Área Administrativa
              </button>
            </div>
          }

          <!-- Etapa 2: Captura de Foto -->
          @if (usuarioVerificado()) {
            <div class="space-y-4">
              <!-- Info do Usuário -->
              <div hlmAlert>
                <ng-icon hlm hlmAlertIcon name="lucideCircleCheck" />
                <div hlmAlertDescription>
                  <div class="font-semibold">{{ usuarioVerificado()!.nome }}</div>
                  <div class="text-sm">{{ usuarioVerificado()!.cargo }}</div>
                </div>
              </div>

              <!-- Seleção de Tipo de Horário -->
              <div class="space-y-2">
                <label class="text-sm font-medium">Tipo de Registro</label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    hlmBtn
                    [variant]="tipoHorarioSelecionado() === 'ENTRADA' ? 'default' : 'outline'"
                    size="sm"
                    (click)="tipoHorarioSelecionado.set('ENTRADA')"
                    type="button"
                  >
                    Entrada
                  </button>
                  <button
                    hlmBtn
                    [variant]="tipoHorarioSelecionado() === 'SAIDA_ALMOCO' ? 'default' : 'outline'"
                    size="sm"
                    (click)="tipoHorarioSelecionado.set('SAIDA_ALMOCO')"
                    type="button"
                  >
                    Saída Almoço
                  </button>
                  <button
                    hlmBtn
                    [variant]="tipoHorarioSelecionado() === 'RETORNO_ALMOCO' ? 'default' : 'outline'"
                    size="sm"
                    (click)="tipoHorarioSelecionado.set('RETORNO_ALMOCO')"
                    type="button"
                  >
                    Retorno Almoço
                  </button>
                  <button
                    hlmBtn
                    [variant]="tipoHorarioSelecionado() === 'SAIDA' ? 'default' : 'outline'"
                    size="sm"
                    (click)="tipoHorarioSelecionado.set('SAIDA')"
                    type="button"
                  >
                    Saída
                  </button>
                </div>
              </div>

              <!-- Vídeo/Foto -->
              <div class="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                <video
                  #videoElement
                  class="w-full h-full object-cover"
                  [class.hidden]="fotoCapturada()"
                  autoplay
                  playsinline
                ></video>
                <canvas #canvasElement class="hidden"></canvas>
                
                @if (fotoCapturada()) {
                  <img 
                    [src]="fotoCapturada()" 
                    class="w-full h-full object-cover" 
                    alt="Foto capturada" 
                  />
                }

                @if (!cameraAtiva() && !fotoCapturada()) {
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="text-center text-muted-foreground">
                      <ng-icon hlm name="lucideLoader" size="lg" class="animate-spin" />
                      <div class="text-sm mt-2">Iniciando câmera...</div>
                    </div>
                  </div>
                }
              </div>

              <!-- Último Registro -->
              @if (ultimoRegistro()) {
                <div class="text-sm text-center text-muted-foreground">
                  Último registro: {{ ultimoRegistro() }}
                </div>
              }

              <!-- Botões de Ação -->
              @if (!fotoCapturada()) {
                <div class="grid grid-cols-2 gap-3">
                  <button
                    hlmBtn
                    variant="default"
                    size="lg"
                    [disabled]="!cameraAtiva() || processando()"
                    (click)="capturarFoto()"
                    class="w-full"
                  >
                    <ng-icon hlm name="lucideCamera" size="sm" />
                    Capturar
                  </button>
                  <button
                    hlmBtn
                    variant="outline"
                    size="lg"
                    [disabled]="processando()"
                    (click)="cancelar()"
                    class="w-full"
                  >
                    <ng-icon hlm name="lucideX" size="sm" />
                    Cancelar
                  </button>
                </div>
              } @else {
                <div class="space-y-3">
                  @if (configuracaoLocalizacao().ativa && !dentroDoRaio()) {
                    <div hlmAlert variant="destructive">
                      <ng-icon hlm hlmAlertIcon name="lucideCircleAlert" />
                      <p hlmAlertDescription class="text-sm">
                        Você está fora do raio permitido para registrar o ponto
                      </p>
                    </div>
                  }

                  <div class="grid grid-cols-2 gap-3">
                    <button
                      hlmBtn
                      variant="default"
                      size="lg"
                      [disabled]="processando() || (configuracaoLocalizacao().ativa && !dentroDoRaio())"
                      (click)="registrarPonto()"
                      class="w-full"
                    >
                      @if (processando()) {
                        <ng-icon hlm name="lucideLoader" size="sm" class="animate-spin" />
                        Registrando...
                      } @else {
                        <ng-icon hlm name="lucideCircleCheck" size="sm" />
                        Confirmar
                      }
                    </button>
                    <button
                      hlmBtn
                      variant="outline"
                      size="lg"
                      [disabled]="processando()"
                      (click)="descartarFoto()"
                      class="w-full"
                    >
                      <ng-icon hlm name="lucideRefreshCw" size="sm" />
                      Refazer
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Histórico do Dia -->
      @if (usuarioVerificado() && registrosHoje().length > 0) {
        <div hlmCard class="mt-6">
          <div hlmCardHeader>
            <h3 hlmCardTitle class="text-lg">Registros de Hoje</h3>
          </div>
          <div hlmCardContent>
            <div class="space-y-3">
              @for (registro of registrosHoje(); track registro.id) {
                <div class="flex items-center gap-3 p-3 rounded-lg border">
                  @if (registro.fotoUrl) {
                    <img 
                      [src]="registro.fotoUrl" 
                      alt="Foto do registro"
                      class="w-12 h-12 rounded-full object-cover"
                    />
                  }
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-semibold">{{ registro.horario }}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {{ getTipoHorarioLabel(registro.tipoHorario) }}
                      </span>
                    </div>
                    @if (registro.localizacao) {
                      <div class="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <ng-icon hlm name="lucideMapPin" size="xs" />
                        <span>Com localização</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
      </div>
    </div>
  `,
})
export class RegistroPontoComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  readonly authService = inject(AuthService);
  private readonly pontoService = inject(FechamentoPontoService);
  readonly configService = inject(ConfiguracoesService);
  private readonly registroService = inject(RegistroPontoService);
  readonly router = inject(Router);

  // Estado
  pin = '';
  tipoHorarioSelecionado = signal<string>('ENTRADA');
  horaAtual = signal('00:00:00');
  dataAtual = signal('');
  usuarioVerificado = signal<any>(null);
  localizacaoAtual = signal<Localizacao | null>(null);
  localizacaoCarregando = signal(false);
  erroLocalizacao = signal<string | null>(null);
  cameraAtiva = signal(false);
  fotoCapturada = signal<string | null>(null);
  processando = signal(false);
  ultimoRegistro = signal<string | null>(null);
  registrosHoje = signal<any[]>([]);

  private mediaStream: MediaStream | null = null;
  private relogioInterval?: number;
  private watchPositionId?: number;

  // Usar configurações do serviço
  configuracaoLocalizacao = computed(() => this.configService.configuracoes().localizacao);

  dentroDoRaio = computed(() => {
    if (!this.configuracaoLocalizacao().ativa) return true;
    if (!this.localizacaoAtual()) return false;
    return this.distanciaDoLocal() <= this.configuracaoLocalizacao().raioMaximo;
  });

  distanciaDoLocal = computed(() => {
    if (!this.localizacaoAtual()) return Infinity;
    
    const loc = this.localizacaoAtual()!;
    const base = this.configuracaoLocalizacao().localizacaoBase;
    
    return this.calcularDistancia(
      loc.latitude,
      loc.longitude,
      base.latitude,
      base.longitude
    );
  });

  ngOnInit() {
    this.iniciarRelogio();
    this.atualizarData();
    
    if (this.configuracaoLocalizacao().ativa) {
      this.iniciarMonitoramentoLocalizacao();
    }
  }

  ngOnDestroy() {
    this.pararRelogio();
    this.pararMonitoramentoLocalizacao();
    this.pararCamera();
  }

  carregarHistorico() {
    const usuario = this.usuarioVerificado();
    if (!usuario) return;

    this.registroService.obterRegistrosHoje(usuario.id).subscribe({
      next: (registros) => {
        this.registrosHoje.set(registros);
      },
      error: (error) => {
        console.error('Erro ao carregar histórico:', error);
      },
    });
  }

  private iniciarRelogio() {
    this.atualizarHora();
    this.relogioInterval = window.setInterval(() => {
      this.atualizarHora();
    }, 1000);
  }

  private pararRelogio() {
    if (this.relogioInterval) {
      clearInterval(this.relogioInterval);
    }
  }

  private atualizarHora() {
    const agora = new Date();
    this.horaAtual.set(agora.toLocaleTimeString('pt-BR'));
  }

  private atualizarData() {
    const agora = new Date();
    const opcoes: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    this.dataAtual.set(agora.toLocaleDateString('pt-BR', opcoes));
  }

  private iniciarMonitoramentoLocalizacao() {
    if (!navigator.geolocation) {
      this.erroLocalizacao.set('Geolocalização não suportada pelo navegador');
      return;
    }

    this.localizacaoCarregando.set(true);

    this.watchPositionId = navigator.geolocation.watchPosition(
      (position) => {
        this.localizacaoAtual.set({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precisao: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        this.localizacaoCarregando.set(false);
        this.erroLocalizacao.set(null);
      },
      (error) => {
        this.localizacaoCarregando.set(false);
        // Não mostrar erro de timeout como crítico, manter última localização
        if (error.code !== error.TIMEOUT) {
          this.erroLocalizacao.set(this.getErroLocalizacao(error));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // 30 segundos - mais tempo para obter localização
        maximumAge: 60000, // Aceita localização com até 1 minuto de idade
      }
    );
  }

  private pararMonitoramentoLocalizacao() {
    if (this.watchPositionId !== undefined) {
      navigator.geolocation.clearWatch(this.watchPositionId);
    }
  }

  private getErroLocalizacao(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Permissão de localização negada';
      case error.POSITION_UNAVAILABLE:
        return 'Localização indisponível';
      case error.TIMEOUT:
        return 'Tempo limite excedido';
      default:
        return 'Erro ao obter localização';
    }
  }

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  async verificarUsuario() {
    if (this.pin.length !== 4) return;

    this.processando.set(true);

    this.authService.loginWithPin({ pin: this.pin }).subscribe({
      next: (user) => {
        this.usuarioVerificado.set(user);
        this.processando.set(false);
        this.iniciarCamera();
        this.carregarHistorico();
        toast.success('Usuário verificado', {
          description: `Olá, ${user.nome}!`,
        });
      },
      error: () => {
        toast.error('PIN inválido', {
          description: 'Verifique o PIN e tente novamente.',
        });
        this.processando.set(false);
        this.pin = '';
      },
    });
  }

  private async iniciarCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      setTimeout(() => {
        if (this.videoElement?.nativeElement) {
          this.videoElement.nativeElement.srcObject = this.mediaStream;
          this.cameraAtiva.set(true);
        }
      }, 100);
    } catch (error) {
      toast.error('Erro ao acessar câmera', {
        description: 'Verifique as permissões do navegador.',
      });
      console.error('Erro ao iniciar câmera:', error);
    }
  }

  private pararCamera() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.cameraAtiva.set(false);
  }

  capturarFoto() {
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);

    this.fotoCapturada.set(canvas.toDataURL('image/jpeg', 0.8));
    this.pararCamera();
  }

  descartarFoto() {
    this.fotoCapturada.set(null);
    this.iniciarCamera();
  }

  async registrarPonto() {
    if (!this.usuarioVerificado() || !this.fotoCapturada()) return;

    if (this.configuracaoLocalizacao().ativa && !this.dentroDoRaio()) {
      toast.error('Localização inválida', {
        description: 'Você está fora do raio permitido.',
      });
      return;
    }

    const agora = new Date();
    const horario = agora.toTimeString().slice(0, 5);
    const tipoHorario = this.tipoHorarioSelecionado();

    // Validar limite de registros por dia
    const registrosHoje = this.registrosHoje();
    const config = this.configService.configuracoes();
    
    if (config.limitarRegistrosPorDia) {
      if (registrosHoje.length >= config.quantidadeMaximaRegistrosPorDia) {
        toast.error('Limite de registros atingido', {
          description: `Você já atingiu o limite de ${config.quantidadeMaximaRegistrosPorDia} registros por dia.`,
        });
        return;
      }
    }

    // Validar ordem dos registros
    if (registrosHoje.length > 0) {
      const ultimoRegistro = registrosHoje[registrosHoje.length - 1];
      const ultimoHorario = ultimoRegistro.horario || '00:00';
      
      // Verificar se o horário atual é posterior ao último registro
      if (horario <= ultimoHorario) {
        toast.error('Horário inválido', {
          description: `O horário deve ser posterior ao último registro (${ultimoHorario}).`,
        });
        return;
      }
      
      // Verificar ordem lógica dos tipos
      const ordemTipos: Record<string, number> = {
        'ENTRADA': 1,
        'SAIDA_ALMOCO': 2,
        'RETORNO_ALMOCO': 3,
        'SAIDA': 4,
      };
      
      const ultimoTipo = ultimoRegistro.tipoHorario || '';
      const ordemUltimo = ordemTipos[ultimoTipo] || 0;
      const ordemAtual = ordemTipos[tipoHorario] || 0;
      
      if (ordemAtual <= ordemUltimo) {
        toast.error('Tipo de registro inválido', {
          description: `Você já registrou "${this.getTipoHorarioLabel(ultimoTipo)}". Selecione o próximo tipo na sequência.`,
        });
        return;
      }
    }

    this.processando.set(true);

    const registro = {
      userId: this.usuarioVerificado()!.id,
      data: agora.toISOString(),
      horario,
      tipoHorario,
      fotoBase64: this.fotoCapturada() || undefined,
      localizacao: this.localizacaoAtual() ? {
        latitude: this.localizacaoAtual()!.latitude,
        longitude: this.localizacaoAtual()!.longitude,
        precisao: this.localizacaoAtual()!.precisao,
      } : undefined,
      tipo: TipoRegistro.NORMAL,
    };

    this.registroService.registrarPonto(registro).subscribe({
      next: (response) => {
        toast.success('Ponto registrado!', {
          description: `Registrado às ${horario}`,
        });
        this.processando.set(false);
        this.ultimoRegistro.set(`${horario} - ${agora.toLocaleDateString('pt-BR')}`);
        
        // Recarregar histórico
        this.carregarHistorico();
        
        setTimeout(() => {
          this.resetar();
        }, 2000);
      },
      error: (error) => {
        console.error('Erro ao registrar ponto:', error);
        toast.error('Erro ao registrar ponto', {
          description: 'Tente novamente.',
        });
        this.processando.set(false);
      },
    });
  }

  cancelar() {
    this.resetar();
  }

  irParaLogin() {
    this.router.navigate(['/login']);
  }

  getTipoHorarioLabel(tipo: string): string {
    const labels: Record<string, string> = {
      'ENTRADA': 'Entrada',
      'SAIDA': 'Saída',
      'SAIDA_ALMOCO': 'Saída Almoço',
      'RETORNO_ALMOCO': 'Retorno Almoço',
    };
    return labels[tipo] || tipo;
  }

  private resetar() {
    this.pin = '';
    this.tipoHorarioSelecionado.set('ENTRADA');
    this.usuarioVerificado.set(null);
    this.fotoCapturada.set(null);
    this.pararCamera();
  }
}
