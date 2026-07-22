import type { FinancialTransaction } from '@/types';
import { getEffectiveCompanyInfo } from '@/lib/storage';
import { normalizeOptionalText, normalizeText } from '@/lib/text';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const formatDateForDisplay = (dateString: string | undefined) => {
  if (!dateString || isNaN(new Date(dateString).getTime())) {
    return 'Data inválida';
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const loadImageAsDataUrl = (url: string | undefined): Promise<string | null> => {
  if (!url || typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      console.warn(`Could not load image for PDF from: ${url}`);
      resolve(null);
    };
    img.src = url;
  });
};

export const generateFinancialReportPdf = async (
  filteredTransactions: FinancialTransaction[],
  dateRange: { from?: Date; to?: Date } | undefined,
  totals: { receitas: number; despesas: number; saldo: number }
) => {
  const companyInfo = normalizeText(await getEffectiveCompanyInfo());
  const normalizedTransactions = normalizeText(filteredTransactions);
  const logoDataUrl = await loadImageAsDataUrl(companyInfo.logoUrl);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 40;
  let textX = margin;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, 12, 25, 25);
    textX = margin + 30;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(normalizeOptionalText(companyInfo.name) || 'Relatório Financeiro', textX, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const period = dateRange?.from
    ? `Período: ${format(dateRange.from, 'dd/MM/yyyy')} a ${dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'hoje'}`
    : 'Período: Todas as Transações';
  doc.text(period, textX, 26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Resumo do Período', margin, currentY);
  currentY += 8;

  (doc as any).autoTable({
    startY: currentY,
    body: [
      ['Total de Receitas', `R$ ${totals.receitas.toFixed(2)}`],
      ['Total de Despesas', `R$ ${totals.despesas.toFixed(2)}`],
      ['Saldo do Período', `R$ ${totals.saldo.toFixed(2)}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249] },
    styles: { fontStyle: 'bold' },
  });
  currentY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Transações Detalhadas', margin, currentY);
  currentY += 8;

  (doc as any).autoTable({
    startY: currentY,
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)']],
    body: normalizedTransactions.map((transaction) => [
      formatDateForDisplay(transaction.date),
      transaction.description,
      transaction.category,
      transaction.type === 'receita' ? 'Receita' : 'Despesa',
      {
        content: transaction.amount.toFixed(2),
        styles: { halign: 'right', textColor: transaction.type === 'receita' ? '#16a34a' : '#dc2626' },
      },
    ]),
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
  });

  doc.autoPrint();
  doc.output('dataurlnewwindow');
};
