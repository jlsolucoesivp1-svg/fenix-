import type { ServiceOrder } from '@/types';
import { getCompanyInfo } from '@/lib/storage';
import { normalizeOptionalText, normalizeText } from '@/lib/text';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) {
    return 'Data inválida';
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

const getEquipmentName = (equipment: any): string => {
  if (typeof equipment === 'string') {
    return equipment;
  }

  if (typeof equipment === 'object' && equipment !== null) {
    return `${equipment.type || ''} ${equipment.brand || ''} ${equipment.model || ''}`.trim();
  }

  return 'Equipamento não identificado';
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
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generateCustomerHistoryPdf = async (history: ServiceOrder[]) => {
  const companyInfo = normalizeText(await getCompanyInfo());
  const normalizedHistory = normalizeText(history);
  const customerName = normalizedHistory[0]?.customerName || 'Cliente';

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 20;
  let textX = margin;

  const logoDataUrl = await loadImageAsDataUrl(companyInfo.logoUrl);
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, currentY - 8, 30, 30);
    textX = margin + 35;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(normalizeOptionalText(companyInfo.name) || 'Histórico', textX, currentY);
  currentY += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (companyInfo.address) {
    doc.text(normalizeOptionalText(companyInfo.address), textX, currentY);
    currentY += 4;
  }
  if (companyInfo.phone || companyInfo.emailOrSite) {
    doc.text(
      `Telefone: ${normalizeOptionalText(companyInfo.phone)} | E-mail: ${normalizeOptionalText(companyInfo.emailOrSite)}`,
      textX,
      currentY
    );
  }

  const rightHeaderX = pageWidth - margin;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Histórico de Atendimentos', rightHeaderX, currentY - 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${customerName}`, rightHeaderX, currentY - 2, { align: 'right' });
  doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, rightHeaderX, currentY + 4, { align: 'right' });

  currentY = 50;

  normalizedHistory.forEach((order, index) => {
    if (index > 0) {
      currentY += 5;
      doc.setLineDashPattern([1, 2], 0);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      doc.setLineDashPattern([], 0);
      currentY += 10;
    }

    if (currentY > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(243, 244, 246);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ordem de Serviço #${order.id.slice(-4)}`, margin + 2, currentY + 5);
    doc.setFontSize(10);
    doc.text(`Status: ${order.status}`, pageWidth - margin - 2, currentY + 5, { align: 'right' });
    currentY += 12;

    const boxWidth = (pageWidth - margin * 2 - 5) / 2;

    const clientData = {
      'Data de Entrada:': formatDate((order as any).entryDate || order.date),
      'Atendente:': order.attendant || 'Não informado',
    };

    const equipmentData = {
      'Equipamento:': getEquipmentName(order.equipment),
      'Nº Série:': order.serialNumber || 'Não informado',
      'Acessórios:': order.accessories || 'Nenhum',
    };

    const drawInfoBox = (data: { [key: string]: string }, x: number, y: number, width: number) => {
      (doc as any).autoTable({
        body: Object.entries(data),
        startY: y,
        theme: 'grid',
        tableWidth: width,
        margin: { left: x },
        styles: { fontSize: 8.5, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
      });

      return (doc as any).lastAutoTable.finalY;
    };

    const clientBoxHeight = drawInfoBox(clientData, margin, currentY, boxWidth);
    const equipmentBoxHeight = drawInfoBox(equipmentData, margin + boxWidth + 5, currentY, boxWidth);
    currentY = Math.max(clientBoxHeight, equipmentBoxHeight) + 5;

    if (order.items && order.items.length > 0) {
      (doc as any).autoTable({
        startY: currentY,
        head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
        body: order.items.map((item) => [
          item.type === 'part' ? 'Peça' : 'Serviço',
          item.description,
          item.quantity,
          `R$ ${(item.unitPrice || 0).toFixed(2)}`,
          `R$ ${((item.unitPrice || 0) * item.quantity).toFixed(2)}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9, cellPadding: 1.5 },
        bodyStyles: { fontSize: 8, cellPadding: 1.5 },
        footStyles: { fillColor: '#F1F5F9', textColor: '#000000', fontStyle: 'bold' },
        foot: [['Total', '', '', '', `R$ ${(order.totalValue || 0).toFixed(2)}`]],
        margin: { left: margin, right: margin },
      });
      currentY = (doc as any).lastAutoTable.finalY + 5;
    }
  });

  doc.save(`Historico_${customerName.replace(/\s+/g, '_')}.pdf`);
};
