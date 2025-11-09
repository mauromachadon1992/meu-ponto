import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculosTrabalhistasService } from './calculos-trabalhistas.service';
import { User } from '../models/auth.model';
import { PeriodoFechamento } from '../models/periodo-fechamento.model';

export interface UserFinancialData {
  user: User;
  periodos: PeriodoFechamento[];
  salarioPorHora: number;
  totalHorasTrabalhadas: number;
  totalHorasExtras: number;
  valorHorasExtras: number;
  valorDSR: number;
  totalHorasNoturnas: number;
  valorAdicionalNoturno: number;
  totalHorasDevidas: number;
  descontoHorasDevidas: number;
  totalLiquido: number;
  diasTrabalhados: number;
  diasFaltados: number;
}

@Injectable({
  providedIn: 'root',
})
export class RelatorioService {
  constructor(private calculosService: CalculosTrabalhistasService) {}

  /**
   * Gera relatório completo em PDF com todas as informações detalhadas
   */
  gerarRelatorioCompleto(dados: UserFinancialData[]): void {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Completo de Folha de Pagamento', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data de Emissão: ${dataAtual}`, 14, 28);
    doc.text('Período: Períodos em Aberto', 14, 33);

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 36, 196, 36);

    // Resumo Geral
    const totalFolha = dados.reduce((sum, u) => sum + u.totalLiquido, 0);
    const totalHorasExtras = dados.reduce((sum, u) => sum + u.valorHorasExtras + u.valorDSR, 0);
    const totalAdicionalNoturno = dados.reduce((sum, u) => sum + u.valorAdicionalNoturno, 0);
    const totalDescontos = dados.reduce((sum, u) => sum + u.descontoHorasDevidas, 0);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 14, 44);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total da Folha de Pagamento: ${this.calculosService.formatarMoeda(totalFolha)}`, 14, 51);
    doc.text(`Total de Horas Extras (com DSR): ${this.calculosService.formatarMoeda(totalHorasExtras)}`, 14, 57);
    doc.text(`Total de Adicional Noturno: ${this.calculosService.formatarMoeda(totalAdicionalNoturno)}`, 14, 63);
    doc.text(`Total de Descontos: ${this.calculosService.formatarMoeda(totalDescontos)}`, 14, 69);
    doc.text(`Quantidade de Funcionários: ${dados.length}`, 14, 75);

    // Tabela detalhada por funcionário
    let startY = 84;

    dados.forEach((userFinancial, index) => {
      // Verifica se precisa adicionar nova página
      if (startY > 250) {
        doc.addPage();
        startY = 20;
      }

      // Cabeçalho do funcionário
      doc.setFillColor(240, 240, 240);
      doc.rect(14, startY - 5, 182, 8, 'F');
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${userFinancial.user.nome}`, 16, startY);

      startY += 8;

      // Informações básicas
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Cargo: ${userFinancial.user.cargo || 'Não informado'}`, 16, startY);
      doc.text(`Email: ${userFinancial.user.email}`, 100, startY);
      startY += 5;
      doc.text(`Departamento: ${userFinancial.user.departamento || 'Não informado'}`, 16, startY);
      doc.text(`Carga Horária: ${userFinancial.user.cargaHorariaDiaria || 8}h/dia`, 100, startY);
      startY += 5;
      doc.setFont('helvetica', 'bold');
      doc.text(`PIX: ${userFinancial.user.chavePix || 'Não cadastrado'}`, 16, startY);
      doc.setFont('helvetica', 'normal');
      startY += 8;

      // Tabela de horas e valores
      autoTable(doc, {
        startY: startY,
        head: [['Descrição', 'Horas', 'Valor Unitário', 'Total']],
        body: [
          [
            'Salário Base',
            '-',
            '-',
            this.calculosService.formatarMoeda(userFinancial.user.salarioMensal || 0),
          ],
          [
            'Horas Trabalhadas',
            `${userFinancial.totalHorasTrabalhadas.toFixed(1)}h`,
            '-',
            '-',
          ],
          [
            'Horas Extras (50%)',
            `${userFinancial.totalHorasExtras.toFixed(1)}h`,
            this.calculosService.formatarMoeda(userFinancial.salarioPorHora * 1.5),
            this.calculosService.formatarMoeda(userFinancial.valorHorasExtras),
          ],
          [
            'DSR sobre Horas Extras',
            '-',
            '-',
            this.calculosService.formatarMoeda(userFinancial.valorDSR),
          ],
          [
            'Adicional Noturno (22h-05h)',
            `${userFinancial.totalHorasNoturnas.toFixed(1)}h`,
            '-',
            this.calculosService.formatarMoeda(userFinancial.valorAdicionalNoturno),
          ],
          [
            'Horas Não Trabalhadas',
            `${userFinancial.totalHorasDevidas.toFixed(1)}h`,
            this.calculosService.formatarMoeda(userFinancial.salarioPorHora),
            `- ${this.calculosService.formatarMoeda(userFinancial.descontoHorasDevidas)}`,
          ],
        ],
        foot: [
          [
            { content: 'Total Líquido a Receber', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } },
            { content: this.calculosService.formatarMoeda(userFinancial.totalLiquido), styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } },
          ],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: 0 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 42, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      // @ts-ignore - autoTable adiciona finalY ao doc
      startY = doc.lastAutoTable.finalY + 10;

      // Informações adicionais
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Dias Trabalhados: ${userFinancial.diasTrabalhados} | Faltas: ${userFinancial.diasFaltados}`, 16, startY);
      startY += 8;
    });

    // Rodapé com base legal
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('Cálculos conforme CLT - Consolidação das Leis do Trabalho', 14, 285);
      doc.text(`Página ${i} de ${pageCount}`, 180, 285);
    }

    // Download
    doc.save(`relatorio-completo-${new Date().getTime()}.pdf`);
  }

  /**
   * Gera relatório simples em PDF apenas com valores totais
   */
  gerarRelatorioSimples(dados: UserFinancialData[]): void {
    const doc = new jsPDF();
    const dataAtual = new Date().toLocaleDateString('pt-BR');

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Simplificado - Valores a Receber', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data de Emissão: ${dataAtual}`, 14, 28);
    doc.text('Período: Períodos em Aberto', 14, 33);

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 36, 196, 36);

    // Resumo Geral
    const totalFolha = dados.reduce((sum, u) => sum + u.totalLiquido, 0);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Geral', 14, 44);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total da Folha de Pagamento: ${this.calculosService.formatarMoeda(totalFolha)}`, 14, 51);
    doc.text(`Quantidade de Funcionários: ${dados.length}`, 14, 57);

    // Tabela simples
    const tableData = dados.map((userFinancial, index) => [
      `${index + 1}`,
      userFinancial.user.nome,
      userFinancial.user.cargo || 'N/A',
      userFinancial.user.chavePix || 'Não cadastrado',
      this.calculosService.formatarMoeda(userFinancial.user.salarioMensal || 0),
      this.calculosService.formatarMoeda(userFinancial.valorHorasExtras + userFinancial.valorDSR),
      this.calculosService.formatarMoeda(userFinancial.valorAdicionalNoturno),
      this.calculosService.formatarMoeda(userFinancial.descontoHorasDevidas),
      this.calculosService.formatarMoeda(userFinancial.totalLiquido),
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['#', 'Funcionário', 'Cargo', 'PIX', 'Salário Base', 'H. Extras', 'Ad. Noturno', 'Descontos', 'Total Líquido']],
      body: tableData,
      foot: [
        [
          { content: 'TOTAL GERAL', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } },
          { content: this.calculosService.formatarMoeda(totalFolha), styles: { fontStyle: 'bold', fillColor: [220, 252, 231] } },
        ],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 9 },
      footStyles: { fillColor: [240, 240, 240], textColor: 0, fontSize: 9 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 32 },
        2: { cellWidth: 22 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20, halign: 'right' },
        5: { cellWidth: 20, halign: 'right' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 20, halign: 'right' },
        8: { cellWidth: 23, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    });

    // Observações
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 12;
    
    // Verifica se precisa de nova página
    if (finalY > 240) {
      doc.addPage();
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 14, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('• Valores calculados conforme CLT (Consolidação das Leis do Trabalho)', 14, 28);
      doc.text('• Horas extras calculadas com acréscimo de 50% (CLT Art. 59)', 14, 33);
      doc.text('• DSR (Descanso Semanal Remunerado) incluído nas horas extras', 14, 38);
      doc.text('• Relatório gerado automaticamente pelo sistema Meu Ponto', 14, 43);
    } else {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', 14, finalY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('• Valores calculados conforme CLT (Consolidação das Leis do Trabalho)', 14, finalY + 5);
      doc.text('• Horas extras calculadas com acréscimo de 50% (CLT Art. 59)', 14, finalY + 10);
      doc.text('• DSR (Descanso Semanal Remunerado) incluído nas horas extras', 14, finalY + 15);
      doc.text('• Relatório gerado automaticamente pelo sistema Meu Ponto', 14, finalY + 20);
    }

    // Rodapé em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('Este documento é meramente informativo e não substitui demonstrativos oficiais de pagamento.', 14, 285);
      doc.text(`Gerado em ${dataAtual} | Página ${i} de ${pageCount}`, 155, 285);
    }

    // Download
    doc.save(`relatorio-simplificado-${new Date().getTime()}.pdf`);
  }
}
