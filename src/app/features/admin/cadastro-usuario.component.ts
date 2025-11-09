import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';

import { HlmCard, HlmCardHeader, HlmCardTitle, HlmCardDescription, HlmCardContent } from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmSwitch } from '@spartan-ng/helm/switch';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideMail, lucideKey, lucideBriefcase, lucideBuilding, lucideClock, lucideDollarSign, lucideShield, lucideArrowLeft, lucideSave, lucideUserPlus } from '@ng-icons/lucide';

import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/auth.model';

interface NovoUsuario {
  nome: string;
  email: string;
  pin: string;
  cargo: string;
  departamento: string;
  cargaHorariaDiaria: number;
  salarioMensal: number;
  chavePix: string;
  isAdmin: boolean;
}

@Component({
  selector: 'app-cadastro-usuario',
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
    HlmInput,
    HlmLabel,
    HlmIcon,
    HlmSwitch,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideUser,
      lucideMail,
      lucideKey,
      lucideBriefcase,
      lucideBuilding,
      lucideClock,
      lucideDollarSign,
      lucideShield,
      lucideArrowLeft,
      lucideSave,
      lucideUserPlus,
    }),
  ],
  template: `
    <div class="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ng-icon hlm name="lucideUserPlus" size="lg" />
            Cadastro de Usuário
          </h1>
          <p class="text-muted-foreground mt-1">Cadastre funcionários ou administradores do sistema</p>
        </div>
        <button hlmBtn variant="outline" (click)="voltar()">
          <ng-icon hlm name="lucideArrowLeft" size="sm" class="mr-2" />
          Voltar
        </button>
      </div>

      <form (ngSubmit)="salvar()" #form="ngForm">
        <!-- Dados Pessoais -->
        <div hlmCard class="mb-6">
          <div hlmCardHeader>
            <h3 hlmCardTitle class="flex items-center gap-2">
              <ng-icon hlm name="lucideUser" size="sm" />
              Dados Pessoais
            </h3>
            <p hlmCardDescription>Informações básicas do colaborador</p>
          </div>
          <div hlmCardContent class="space-y-4">
            <!-- Nome -->
            <div class="space-y-2">
              <label hlmLabel for="nome">
                Nome Completo <span class="text-red-500">*</span>
              </label>
              <input
                hlmInput
                type="text"
                id="nome"
                name="nome"
                [(ngModel)]="usuario().nome"
                placeholder="Ex: João Silva Santos"
                required
                #nomeInput="ngModel"
              />
              @if (nomeInput.invalid && nomeInput.touched) {
                <p class="text-sm text-red-500">Nome é obrigatório</p>
              }
            </div>

            <!-- Email -->
            <div class="space-y-2">
              <label hlmLabel for="email">
                E-mail <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  hlmInput
                  type="email"
                  id="email"
                  name="email"
                  [(ngModel)]="usuario().email"
                  placeholder="exemplo@empresa.com"
                  required
                  email
                  #emailInput="ngModel"
                  class="pl-10"
                />
                <ng-icon hlm name="lucideMail" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              @if (emailInput.invalid && emailInput.touched) {
                <p class="text-sm text-red-500">E-mail válido é obrigatório</p>
              }
            </div>

            <!-- PIN -->
            <div class="space-y-2">
              <label hlmLabel for="pin">
                PIN de Acesso (4 dígitos) <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  hlmInput
                  type="text"
                  id="pin"
                  name="pin"
                  [(ngModel)]="usuario().pin"
                  placeholder="1234"
                  required
                  pattern="[0-9]{4}"
                  maxlength="4"
                  #pinInput="ngModel"
                  class="pl-10"
                />
                <ng-icon hlm name="lucideKey" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              @if (pinInput.invalid && pinInput.touched) {
                <p class="text-sm text-red-500">PIN deve ter exatamente 4 dígitos</p>
              }
            </div>
          </div>
        </div>

        <!-- Dados Profissionais -->
        <div hlmCard class="mb-6">
          <div hlmCardHeader>
            <h3 hlmCardTitle class="flex items-center gap-2">
              <ng-icon hlm name="lucideBriefcase" size="sm" />
              Dados Profissionais
            </h3>
            <p hlmCardDescription>Cargo, departamento e informações trabalhistas</p>
          </div>
          <div hlmCardContent class="space-y-4">
            <!-- Cargo -->
            <div class="space-y-2">
              <label hlmLabel for="cargo">
                Cargo <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  hlmInput
                  type="text"
                  id="cargo"
                  name="cargo"
                  [(ngModel)]="usuario().cargo"
                  placeholder="Ex: Desenvolvedor, Gerente, Analista"
                  required
                  #cargoInput="ngModel"
                  class="pl-10"
                />
                <ng-icon hlm name="lucideBriefcase" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              @if (cargoInput.invalid && cargoInput.touched) {
                <p class="text-sm text-red-500">Cargo é obrigatório</p>
              }
            </div>

            <!-- Departamento -->
            <div class="space-y-2">
              <label hlmLabel for="departamento">
                Departamento <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  hlmInput
                  type="text"
                  id="departamento"
                  name="departamento"
                  [(ngModel)]="usuario().departamento"
                  placeholder="Ex: TI, RH, Financeiro"
                  required
                  #departamentoInput="ngModel"
                  class="pl-10"
                />
                <ng-icon hlm name="lucideBuilding" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              @if (departamentoInput.invalid && departamentoInput.touched) {
                <p class="text-sm text-red-500">Departamento é obrigatório</p>
              }
            </div>

            <!-- Carga Horária -->
            <div class="space-y-2">
              <label hlmLabel for="cargaHoraria">
                Carga Horária Diária (horas) <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  hlmInput
                  type="number"
                  id="cargaHoraria"
                  name="cargaHoraria"
                  [(ngModel)]="usuario().cargaHorariaDiaria"
                  placeholder="8"
                  required
                  min="4"
                  max="12"
                  step="0.5"
                  #cargaHorariaInput="ngModel"
                  class="pl-10"
                />
                <ng-icon hlm name="lucideClock" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p class="text-xs text-muted-foreground">Horas de trabalho esperadas por dia (ex: 8h, 6h, 4h)</p>
              @if (cargaHorariaInput.invalid && cargaHorariaInput.touched) {
                <p class="text-sm text-red-500">Carga horária entre 4 e 12 horas</p>
              }
            </div>

            <!-- Salário -->
            <div class="space-y-2">
              <label hlmLabel for="salario">
                Salário Mensal (R$) <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  hlmInput
                  type="number"
                  id="salario"
                  name="salario"
                  [(ngModel)]="usuario().salarioMensal"
                  placeholder="5000.00"
                  required
                  min="1320"
                  step="0.01"
                  #salarioInput="ngModel"
                  class="pl-10"
                />
                <ng-icon hlm name="lucideDollarSign" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p class="text-xs text-muted-foreground">Valor utilizado para cálculos trabalhistas (mínimo R$ 1.320,00)</p>
              @if (salarioInput.invalid && salarioInput.touched) {
                <p class="text-sm text-red-500">Salário deve ser no mínimo R$ 1.320,00</p>
              }
            </div>

            <!-- Chave PIX -->
            <div class="space-y-2">
              <label hlmLabel for="chavePix">
                Chave PIX <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <input
                  hlmInput
                  type="text"
                  id="chavePix"
                  name="chavePix"
                  [(ngModel)]="usuario().chavePix"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  required
                  #chavePixInput="ngModel"
                  class="pl-10"
                />
                <ng-icon hlm name="lucideDollarSign" size="sm" class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>
              <p class="text-xs text-muted-foreground">Chave PIX para pagamento (CPF, e-mail, celular ou aleatória)</p>
              @if (chavePixInput.invalid && chavePixInput.touched) {
                <p class="text-sm text-red-500">Chave PIX é obrigatória</p>
              }
            </div>
          </div>
        </div>

        <!-- Permissões -->
        <div hlmCard class="mb-6">
          <div hlmCardHeader>
            <h3 hlmCardTitle class="flex items-center gap-2">
              <ng-icon hlm name="lucideShield" size="sm" />
              Permissões
            </h3>
            <p hlmCardDescription>Defina o nível de acesso do usuário</p>
          </div>
          <div hlmCardContent>
            <label class="flex items-center justify-between space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors" hlmLabel>
              <div class="flex-1">
                <div class="font-semibold flex items-center gap-2">
                  <ng-icon hlm name="lucideShield" size="sm" />
                  Administrador
                </div>
                <p class="text-sm text-muted-foreground mt-1">
                  Usuários administradores têm acesso ao dashboard financeiro, relatórios, configurações e cadastro de novos usuários.
                  Funcionários comuns podem apenas registrar ponto.
                </p>
              </div>
              <hlm-switch [(ngModel)]="usuario().isAdmin" name="isAdmin" id="isAdmin" />
            </label>
          </div>
        </div>

        <!-- Ações -->

        <!-- Ações -->
        <div class="flex items-center justify-end gap-3">
          <button type="button" hlmBtn variant="outline" (click)="voltar()">
            Cancelar
          </button>
          <button type="submit" hlmBtn [disabled]="form.invalid || isSalvando()">
            @if (isSalvando()) {
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            } @else {
              <ng-icon hlm name="lucideSave" size="sm" class="mr-2" />
              Salvar Usuário
            }
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CadastroUsuarioComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  usuario = signal<NovoUsuario>({
    nome: '',
    email: '',
    pin: '',
    cargo: '',
    departamento: '',
    cargaHorariaDiaria: 8,
    salarioMensal: 1320,
    chavePix: '',
    isAdmin: false,
  });

  isSalvando = signal(false);

  voltar() {
    this.router.navigate(['/dashboard-admin']);
  }

  async salvar() {
    if (this.isSalvando()) return;

    this.isSalvando.set(true);

    try {
      // Gerar ID único
      const novoId = Date.now().toString();

      // Gerar avatar usando DiceBear
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(this.usuario().nome)}`;

      const novoUsuario: User = {
        id: novoId,
        nome: this.usuario().nome,
        email: this.usuario().email,
        pin: this.usuario().pin,
        cargo: this.usuario().cargo,
        departamento: this.usuario().departamento,
        cargaHorariaDiaria: this.usuario().cargaHorariaDiaria,
        salarioMensal: this.usuario().salarioMensal,
        chavePix: this.usuario().chavePix,
        isAdmin: this.usuario().isAdmin,
        avatar,
      };

      // Cadastrar usuário através do AuthService
      await this.authService.cadastrarUsuario(novoUsuario);

      toast.success('Usuário cadastrado com sucesso!', {
        description: `${novoUsuario.nome} foi adicionado ao sistema.`,
      });

      // Redirecionar para o dashboard
      this.router.navigate(['/dashboard-admin']);
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      toast.error('Erro ao cadastrar usuário', {
        description: 'Ocorreu um erro ao salvar os dados. Tente novamente.',
      });
    } finally {
      this.isSalvando.set(false);
    }
  }
}
