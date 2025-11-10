import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { toast } from 'ngx-sonner';
import {
  HlmCard,
  HlmCardHeader,
  HlmCardTitle,
  HlmCardDescription,
  HlmCardContent,
} from '@spartan-ng/helm/card';
import { HlmButton} from '@spartan-ng/helm/button';
import { HlmIcon} from '@spartan-ng/helm/icon';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideUser,
  lucideSave,
  lucideLoader,
  lucideMail,
  lucideBriefcase,
  lucideBuilding,
  lucideClock,
  lucideDollarSign,
  lucideCreditCard,
  lucideShield,
  lucideCamera,
  lucideX,
} from '@ng-icons/lucide';
import { AuthService } from '../../core/services/auth.service';
import { PerfilService } from '../../core/services/profile.service';

interface UserProfile {
  id: string;
  nome: string;
  email: string;
  avatar: string | null;
  cargo: string;
  departamento: string;
  cargaHorariaDiaria: number;
  salarioMensal: number;
  chavePix: string | null;
  isAdmin: boolean;
}

@Component({
  selector: 'app-perfil',
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
    HlmSeparator,
    HlmAlert,
    HlmAlertDescription,
    NgIcon,
  ],
  providers: [
    provideIcons({
      lucideUser,
      lucideSave,
      lucideLoader,
      lucideMail,
      lucideBriefcase,
      lucideBuilding,
      lucideClock,
      lucideDollarSign,
      lucideCreditCard,
      lucideShield,
      lucideCamera,
      lucideX,
    }),
  ],
  template: `
    <div class="container mx-auto max-w-4xl p-4 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">Meu Perfil</h1>
          <p class="text-muted-foreground mt-1">
            Gerencie suas informações pessoais
          </p>
        </div>
      </div>

      <!-- Loading State -->
      @if (carregando()) {
        <div class="flex items-center justify-center py-12">
          <ng-icon name="lucideLoader" class="animate-spin" size="32" />
        </div>
      }

      <!-- Profile Content -->
      @if (!carregando() && perfil()) {
        <!-- Avatar Section -->
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Foto de Perfil</h3>
            <p hlmCardDescription>
              Sua foto será exibida no sistema de ponto
            </p>
          </div>
          <div hlmCardContent>
            <div class="flex items-center gap-6">
              <!-- Avatar Preview -->
              <div class="relative">
                @if (avatarPreview()) {
                  <img
                    [src]="avatarPreview()"
                    alt="Avatar"
                    class="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                } @else {
                  <div
                    class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center"
                  >
                    <ng-icon
                      name="lucideUser"
                      size="40"
                      class="text-gray-500"
                    />
                  </div>
                }
                @if (avatarPreview()) {
                  <button
                    (click)="removerAvatar()"
                    class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    type="button"
                  >
                    <ng-icon name="lucideX" size="16" />
                  </button>
                }
              </div>

              <!-- Upload Button -->
              <div class="flex-1">
                <input
                  #fileInput
                  type="file"
                  accept="image/*"
                  (change)="onAvatarChange($event)"
                  class="hidden"
                />
                <button
                  hlmBtn
                  variant="outline"
                  (click)="fileInput.click()"
                  type="button"
                >
                  <ng-icon name="lucideCamera" class="mr-2" size="16" />
                  Alterar Foto
                </button>
                <p class="text-sm text-muted-foreground mt-2">
                  JPG, PNG ou GIF. Máximo 2MB.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Personal Information -->
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Informações Pessoais</h3>
            <p hlmCardDescription>
              Atualize seus dados cadastrais
            </p>
          </div>
          <div hlmCardContent>
            <form (ngSubmit)="salvarPerfil()" class="space-y-4">
              <!-- Nome -->
              <div class="space-y-2">
                <label hlmLabel for="nome" class="flex items-center gap-2">
                  <ng-icon name="lucideUser" size="16" />
                  Nome Completo
                </label>
                <input
                  hlmInput
                  type="text"
                  id="nome"
                  [(ngModel)]="perfil()!.nome"
                  name="nome"
                  required
                  placeholder="Seu nome completo"
                />
              </div>

              <!-- Email -->
              <div class="space-y-2">
                <label hlmLabel for="email" class="flex items-center gap-2">
                  <ng-icon name="lucideMail" size="16" />
                  E-mail
                </label>
                <input
                  hlmInput
                  type="email"
                  id="email"
                  [(ngModel)]="perfil()!.email"
                  name="email"
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <div hlmSeparator></div>

              <!-- Professional Information -->
              <h3 class="text-lg font-semibold">Informações Profissionais</h3>

              <!-- Cargo -->
              <div class="space-y-2">
                <label hlmLabel for="cargo" class="flex items-center gap-2">
                  <ng-icon name="lucideBriefcase" size="16" />
                  Cargo
                </label>
                <input
                  hlmInput
                  type="text"
                  id="cargo"
                  [(ngModel)]="perfil()!.cargo"
                  name="cargo"
                  required
                  placeholder="Ex: Desenvolvedor"
                />
              </div>

              <!-- Departamento -->
              <div class="space-y-2">
                <label
                  hlmLabel
                  for="departamento"
                  class="flex items-center gap-2"
                >
                  <ng-icon name="lucideBuilding" size="16" />
                  Departamento
                </label>
                <input
                  hlmInput
                  type="text"
                  id="departamento"
                  [(ngModel)]="perfil()!.departamento"
                  name="departamento"
                  required
                  placeholder="Ex: TI"
                />
              </div>

              <!-- Carga Horária Diária -->
              <div class="space-y-2">
                <label
                  hlmLabel
                  for="cargaHoraria"
                  class="flex items-center gap-2"
                >
                  <ng-icon name="lucideClock" size="16" />
                  Carga Horária Diária
                </label>
                <input
                  hlmInput
                  type="number"
                  id="cargaHoraria"
                  [(ngModel)]="perfil()!.cargaHorariaDiaria"
                  name="cargaHoraria"
                  min="4"
                  max="12"
                  step="0.5"
                  required
                />
                <p class="text-sm text-muted-foreground">
                  Horas de trabalho por dia (entre 4 e 12 horas)
                </p>
              </div>

              <div hlmSeparator></div>

              <!-- Financial Information -->
              <h3 class="text-lg font-semibold">Informações Financeiras</h3>

              @if (perfil()?.isAdmin) {
                <!-- Salário Mensal -->
                <div class="space-y-2">
                  <label hlmLabel for="salario" class="flex items-center gap-2">
                    <ng-icon name="lucideDollarSign" size="16" />
                    Salário Mensal
                  </label>
                  <input
                    hlmInput
                    type="number"
                    id="salario"
                    [(ngModel)]="perfil()!.salarioMensal"
                    name="salario"
                    min="1320"
                    step="0.01"
                    required
                  />
                </div>
              } @else {
                <div hlmAlert>
                  <div hlmAlertDescription>
                    <div class="flex items-center gap-2">
                      <ng-icon name="lucideShield" size="16" />
                      <span>
                        Salário: R$
                        {{ perfil()!.salarioMensal.toFixed(2) }}
                      </span>
                    </div>
                    <p class="text-xs mt-1">
                      Somente administradores podem alterar informações salariais
                    </p>
                  </div>
                </div>
              }

              <!-- Chave PIX -->
              <div class="space-y-2">
                <label hlmLabel for="chavePix" class="flex items-center gap-2">
                  <ng-icon name="lucideCreditCard" size="16" />
                  Chave PIX
                </label>
                <input
                  hlmInput
                  type="text"
                  id="chavePix"
                  [(ngModel)]="perfil()!.chavePix"
                  name="chavePix"
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                />
                <p class="text-sm text-muted-foreground">
                  Usado para recebimento de pagamentos
                </p>
              </div>

              <!-- Submit Button -->
              <div class="flex justify-end gap-4 pt-4">
                <button
                  hlmBtn
                  variant="outline"
                  type="button"
                  (click)="cancelar()"
                >
                  Cancelar
                </button>
                <button hlmBtn type="submit" [disabled]="salvando()">
                  @if (salvando()) {
                    <ng-icon name="lucideLoader" class="animate-spin mr-2" />
                  } @else {
                    <ng-icon name="lucideSave" class="mr-2" />
                  }
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </section>

        <!-- Admin Badge -->
        @if (perfil()?.isAdmin) {
          <div hlmAlert>
            <div hlmAlertDescription>
              <div class="flex items-center gap-2">
                <ng-icon name="lucideShield" size="20" class="text-blue-600" />
                <span class="font-semibold">Administrador do Sistema</span>
              </div>
              <span class="text-sm mt-1">
                Você possui privilégios administrativos
              </span>
            </div>
          </div>
        }
      }
    </div>
  `,
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private perfilService = inject(PerfilService);
  private router = inject(Router);

  carregando = signal(true);
  salvando = signal(false);
  perfil = signal<UserProfile | null>(null);
  perfilOriginal = signal<UserProfile | null>(null);
  avatarPreview = signal<string | null>(null);
  avatarFile = signal<File | null>(null);

  async ngOnInit() {
    await this.carregarPerfil();
  }

  async carregarPerfil() {
    try {
      this.carregando.set(true);
      
      // Obter usuário do AuthService - ajustar conforme sua implementação
      // Exemplo: const userId = this.authService.currentUser?.id;
      // Por enquanto, vou usar localStorage como nos outros componentes
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        toast.error('Usuário não autenticado');
        this.router.navigate(['/login']);
        return;
      }

      const user = JSON.parse(userStr);
      const data = await this.perfilService.obterPerfil(user.id);
      this.perfil.set(data);
      this.perfilOriginal.set({ ...data });
      this.avatarPreview.set(data.avatar);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      this.carregando.set(false);
    }
  }

  onAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    // Validar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 2MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return;
    }

    this.avatarFile.set(file);

    // Gerar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.avatarPreview.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  removerAvatar() {
    this.avatarFile.set(null);
    this.avatarPreview.set(null);
    if (this.perfil()) {
      this.perfil()!.avatar = null;
    }
  }

  async salvarPerfil() {
    try {
      this.salvando.set(true);
      const perfilAtual = this.perfil();

      if (!perfilAtual) return;

      // Validações
      if (!perfilAtual.nome || perfilAtual.nome.length < 3) {
        toast.error('Nome deve ter pelo menos 3 caracteres');
        return;
      }

      if (!perfilAtual.email || !perfilAtual.email.includes('@')) {
        toast.error('E-mail inválido');
        return;
      }

      // Preparar dados
      const dadosAtualizacao: any = {
        nome: perfilAtual.nome,
        email: perfilAtual.email,
        cargo: perfilAtual.cargo,
        departamento: perfilAtual.departamento,
        cargaHorariaDiaria: perfilAtual.cargaHorariaDiaria,
        chavePix: perfilAtual.chavePix || null,
      };

      // Adicionar salário apenas se for admin
      if (perfilAtual.isAdmin) {
        dadosAtualizacao.salarioMensal = perfilAtual.salarioMensal;
      }

      // Processar avatar se houver
      if (this.avatarFile()) {
        const avatarBase64 = await this.fileToBase64(this.avatarFile()!);
        dadosAtualizacao.avatar = avatarBase64;
      } else if (this.avatarPreview() === null && perfilAtual.avatar) {
        // Avatar foi removido
        dadosAtualizacao.avatar = null;
      }

      await this.perfilService.atualizarPerfil(perfilAtual.id, dadosAtualizacao);

      toast.success('Perfil atualizado com sucesso!');
      this.perfilOriginal.set({ ...perfilAtual });
      this.avatarFile.set(null);

      // Atualizar localStorage se necessário
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, ...dadosAtualizacao };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast.error(error?.message || 'Erro ao salvar perfil');
    } finally {
      this.salvando.set(false);
    }
  }

  cancelar() {
    const original = this.perfilOriginal();
    if (original) {
      this.perfil.set({ ...original });
      this.avatarPreview.set(original.avatar);
      this.avatarFile.set(null);
      toast.info('Alterações descartadas');
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
