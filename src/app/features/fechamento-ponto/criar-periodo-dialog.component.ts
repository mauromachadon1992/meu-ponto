import { Component, inject, signal, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toast } from 'ngx-sonner';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar, lucideLoader, lucideTriangleAlert } from '@ng-icons/lucide';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { FechamentoPontoService } from '../../core/services/fechamento-ponto.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-criar-periodo-dialog',
  standalone: true,
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmLabelImports,
    HlmInputImports,
    HlmIconImports,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideCalendar,
      lucideLoader,
      lucideTriangleAlert,
    }),
  ],
  template: `
    <div class="p-6 max-w-md w-full">
      <div class="mb-4">
        <h3 class="text-lg font-semibold flex items-center gap-2">
          <ng-icon hlm name="lucideCalendar" size="sm" />
          Criar Novo Período de Fechamento
        </h3>
        <p class="text-sm text-muted-foreground">
          Crie um período de fechamento para um usuário e mês específico.
        </p>
      </div>

      <div class="space-y-4">
        <!-- Seleção de Usuário -->
        <div class="space-y-2">
          <label hlmLabel for="usuario">Usuário *</label>
          <select
            hlmInput
            id="usuario"
            name="usuario"
            [ngModel]="usuarioSelecionado()"
            (ngModelChange)="usuarioSelecionado.set($event)"
            [disabled]="processando()"
            class="w-full"
            required
          >
            <option value="">Selecione um usuário</option>
            @for (usuario of usuarios(); track usuario.id) {
              <option [value]="usuario.id">{{ usuario.nome }}</option>
            }
          </select>
        </div>

        <!-- Seleção de Mês/Ano -->
        <div class="space-y-2">
          <label hlmLabel for="mesAno">Mês/Ano *</label>
          <input
            hlmInput
            type="month"
            id="mesAno"
            name="mesAno"
            [ngModel]="mesAno()"
            (ngModelChange)="mesAno.set($event)"
            [disabled]="processando()"
            class="w-full"
            required
          />
          <p class="text-xs text-muted-foreground">
            O período será criado do dia 1 ao último dia do mês selecionado.
          </p>
        </div>

        <!-- Mensagem de Erro -->
        @if (mensagemErro()) {
          <div class="flex items-start gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
            <ng-icon hlm name="lucideTriangleAlert" size="sm" class="mt-0.5 flex-shrink-0" />
            <span>{{ mensagemErro() }}</span>
          </div>
        }
      </div>

      <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
        <button
          hlmBtn
          variant="outline"
          [disabled]="processando()"
          (click)="cancelar()"
        >
          Cancelar
        </button>
        <button
          hlmBtn
          [disabled]="!podeEnviar() || processando()"
          (click)="criar()"
        >
          @if (processando()) {
            <ng-icon hlm name="lucideLoader" size="sm" class="mr-2 animate-spin" />
            Criando...
          } @else {
            <ng-icon hlm name="lucideCalendar" size="sm" class="mr-2" />
            Criar Período
          }
        </button>
      </div>
    </div>
  `,
  styles: ``,
})
export class CriarPeriodoDialogComponent {
  private readonly dialogRef = inject(BrnDialogRef);
  private readonly fechamentoService = inject(FechamentoPontoService);
  private readonly authService = inject(AuthService);

  readonly usuarios = signal<Array<{ id: string; nome: string }>>([]);
  readonly processando = signal(false);
  readonly mensagemErro = signal<string | null>(null);

  // Use signals para dados do formulário (mais reativo)
  readonly usuarioSelecionado = signal('');
  readonly mesAno = signal('');

  readonly podeEnviar = computed(() => {
    return this.usuarioSelecionado() && this.mesAno() && !this.processando();
  });

  constructor() {
    this.carregarUsuarios();
    
    // Limpar mensagem de erro quando formulário é alterado
    effect(() => {
      this.usuarioSelecionado();
      this.mesAno();
      this.mensagemErro.set(null);
    });
  }

  carregarUsuarios(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.usuarios.set(
          users.map((u) => ({
            id: u.id,
            nome: u.nome,
          }))
        );
      },
      error: (error) => {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários');
      },
    });
  }

  criar(): void {
    if (!this.podeEnviar()) return;

    // Parse mês e ano
    const [ano, mes] = this.mesAno().split('-').map(Number);

    if (!mes || !ano) {
      this.mensagemErro.set('Mês/Ano inválido');
      return;
    }

    this.processando.set(true);
    this.mensagemErro.set(null);

    this.fechamentoService.criarPeriodo(this.usuarioSelecionado(), mes, ano).subscribe({
      next: (periodo) => {
        toast.success('Período criado com sucesso!', {
          description: `Período de ${this.formatarMesAno(mes, ano)} criado.`,
        });
        this.dialogRef.close(periodo);
      },
      error: (error) => {
        console.error('Erro ao criar período:', error);
        const mensagem = error?.error?.message || error?.message || 'Erro ao criar período';
        
        if (mensagem.includes('Já existe')) {
          this.mensagemErro.set('Já existe um período de fechamento para este mês e usuário.');
        } else {
          this.mensagemErro.set(mensagem);
        }
        
        this.processando.set(false);
      },
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }

  private formatarMesAno(mes: number, ano: number): string {
    const meses = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];
    return `${meses[mes - 1]} ${ano}`;
  }
}
