import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmInput, HlmInputImports } from '@spartan-ng/helm/input';
import { HlmLabelImports } from '@spartan-ng/helm/label';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { TipoRegistro, StatusRegistro, TipoHorario } from '../../core/models';

export interface NovoRegistroData {
  data: Date;
  horario?: string;
  tipoHorario?: TipoHorario;
  entrada?: string;
  saidaAlmoco?: string;
  retornoAlmoco?: string;
  saida?: string;
  observacao?: string;
  tipo: TipoRegistro;
  status: StatusRegistro;
  periodoId?: string;
  userId?: string;
}

@Component({
  selector: 'app-adicionar-registro-dialog',
  standalone: true,
  imports: [
    FormsModule,
    HlmButtonImports,
    HlmInputImports,
    HlmLabelImports,
    HlmDatePickerImports,
  ],
  template: `
    <div class="p-6 max-w-md w-full">
      <div class="mb-4">
        <h3 class="text-lg font-semibold">Adicionar Registro de Ponto</h3>
        <p class="text-sm text-muted-foreground">Preencha o horário e tipo de registro</p>
      </div>

      <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
        <p class="text-sm text-blue-900 dark:text-blue-100">
          <strong>💡 Ordem dos registros:</strong> Entrada → Saída Almoço → Retorno Almoço → Saída
        </p>
      </div>

      @if (avisoOrdem) {
        <div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg">
          <p class="text-sm text-yellow-900 dark:text-yellow-100">
            <strong>⚠️ Atenção:</strong> {{ avisoOrdem }}
          </p>
        </div>
      }

      <div class="space-y-4">
      <div class="space-y-2">
        <label hlmLabel for="data">Data</label>
        <hlm-date-picker buttonId="data" [(ngModel)]="dataSelecionada" (ngModelChange)="atualizarDataStr()">
          <span>{{ dataStr || 'Selecione a data' }}</span>
        </hlm-date-picker>
      </div>

      <div class="space-y-2">
        <label hlmLabel for="horario">Horário</label>
        <input
          hlmInput
          type="time"
          id="horario"
          [(ngModel)]="registro.horario"
          (ngModelChange)="validarOrdemHorarios()"
          step="1"
          class="w-full bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>

      <div class="space-y-2">
        <label hlmLabel for="tipo">Tipo de Horário</label>
        <select
          hlmInput
          id="tipo"
          [(ngModel)]="registro.tipoHorario"
          (ngModelChange)="validarOrdemHorarios()"
          class="w-full"
        >
          <option value="ENTRADA">Entrada</option>
          <option value="SAIDA_ALMOCO">Saída Almoço</option>
          <option value="RETORNO_ALMOCO">Retorno Almoço</option>
          <option value="SAIDA">Saída</option>
        </select>
      </div>

      <div class="space-y-2">
        <label hlmLabel for="observacao">Observação (opcional)</label>
        <input
          hlmInput
          type="text"
          id="observacao"
          [(ngModel)]="registro.observacao"
          placeholder="Ex: Reunião externa, Home office..."
          class="w-full"
        />
      </div>

      <div class="space-y-2">
        <label hlmLabel for="tipo">Tipo de Registro</label>
        <select
          hlmInput
          id="tipo"
          [(ngModel)]="registro.tipo"
          class="w-full"
        >
          <option [value]="TipoRegistro.NORMAL">Normal</option>
          <option [value]="TipoRegistro.FALTA">Falta</option>
          <option [value]="TipoRegistro.FERIADO">Feriado</option>
          <option [value]="TipoRegistro.FERIAS">Férias</option>
          <option [value]="TipoRegistro.ATESTADO">Atestado</option>
        </select>
      </div>

      <div class="flex justify-end gap-2 mt-6 pt-4 border-t">
        <button hlmBtn variant="outline" (click)="cancelar()">
          Cancelar
        </button>
        <button
          hlmBtn
          (click)="salvar()"
          [disabled]="!isValid()"
          [class.opacity-50]="!isValid()"
        >
          Adicionar
        </button>
      </div>
    </div>
  `,
})
export class AdicionarRegistroDialogComponent {
  private readonly dialogRef = inject(BrnDialogRef);

  readonly TipoRegistro = TipoRegistro;
  
  // Data selecionada no date picker
  dataSelecionada = new Date();
  
  // Criar data de hoje no horário local
  dataStr = (() => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  })();
  
  registro: Omit<NovoRegistroData, 'data'> = {
    horario: '',
    tipoHorario: TipoHorario.ENTRADA,
    observacao: '',
    tipo: TipoRegistro.NORMAL,
    status: StatusRegistro.COMPLETO,
  };

  avisoOrdem: string = '';

  atualizarDataStr(): void {
    if (this.dataSelecionada) {
      const ano = this.dataSelecionada.getFullYear();
      const mes = String(this.dataSelecionada.getMonth() + 1).padStart(2, '0');
      const dia = String(this.dataSelecionada.getDate()).padStart(2, '0');
      this.dataStr = `${ano}-${mes}-${dia}`;
    }
  }

  isValid(): boolean {
    return !!(this.dataStr && this.registro.horario && this.registro.tipoHorario);
  }

  validarOrdemHorarios(): void {
    // Validação básica de ordem dos tipos de horário
    const tipo = this.registro.tipoHorario;
    const horario = this.registro.horario;
    
    if (!horario || !tipo) return;
    
    // Ordem esperada: ENTRADA < SAIDA_ALMOCO < RETORNO_ALMOCO < SAIDA
    const ordemEsperada: Record<TipoHorario, number> = {
      ENTRADA: 1,
      SAIDA_ALMOCO: 2,
      RETORNO_ALMOCO: 3,
      SAIDA: 4,
    };
    
    // Avisos baseados no tipo selecionado
    if (tipo === 'SAIDA_ALMOCO' && horario < '11:00') {
      this.avisoOrdem = 'Horário de saída para almoço parece muito cedo (antes das 11:00).';
    } else if (tipo === 'RETORNO_ALMOCO' && horario > '15:00') {
      this.avisoOrdem = 'Horário de retorno do almoço parece muito tarde (depois das 15:00).';
    } else if (tipo === 'ENTRADA' && horario > '10:00') {
      this.avisoOrdem = 'Horário de entrada parece tarde (depois das 10:00).';
    } else if (tipo === 'SAIDA' && horario < '16:00') {
      this.avisoOrdem = 'Horário de saída parece muito cedo (antes das 16:00).';
    } else {
      this.avisoOrdem = '';
    }
  }

  salvar(): void {
    if (!this.isValid()) return;
    
    // Criar data no horário local (meio-dia para evitar problemas de fuso horário)
    const [ano, mes, dia] = this.dataStr.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia, 12, 0, 0, 0);
    
    const novoRegistro: NovoRegistroData = {
      ...this.registro,
      data,
    };

    this.dialogRef.close(novoRegistro);
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
