import type { ServiceOrder, Customer, CompanyInfo, User } from '@/types';
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
      console.warn(`Could not load image from: ${url}`);
      resolve(null);
    };
    img.src = url;
  });
};

export const generateLaudoPdf = async (order: ServiceOrder, customer: Customer, currentUser: User) => {
  const companyInfo = normalizeText(await getCompanyInfo());
  const normalizedOrder = normalizeText(order);
  const normalizedCustomer = normalizeText(customer);
  const normalizedUser = normalizeText(currentUser);
  const logoDataUrl = await loadImageAsDataUrl(companyInfo.logoUrl);
  const generationDate = new Date();

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 20;
  let textX = margin;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, currentY - 8, 30, 30);
    textX = margin + 35;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(normalizeOptionalText(companyInfo.name) || 'Laudo Técnico', textX, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
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
  doc.text('Laudo Técnico', rightHeaderX, currentY - 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`OS Nº: #${normalizedOrder.id.slice(-4)}`, rightHeaderX, currentY - 2, { align: 'right' });
  doc.text(`Data Emissão: ${generationDate.toLocaleDateString('pt-BR')}`, rightHeaderX, currentY + 4, { align: 'right' });

  currentY = 55;
  doc.setLineWidth(0.5);
  doc.line(margin, currentY - 5, pageWidth - margin, currentY - 5);

  const boxWidth = (pageWidth - margin * 2 - 5) / 2;

  const drawInfoBox = (title: string, data: { [key: string]: string }, x: number, y: number, width: number) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(x, y, width, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x + 3, y + 5);

    (doc as any).autoTable({
      body: Object.entries(data),
      startY: y + 7,
      theme: 'grid',
      tableWidth: width,
      margin: { left: x },
      styles: { fontSize: 9, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } },
    });

    return (doc as any).lastAutoTable.finalY;
  };

  const clientData = {
    'Nome:': normalizedCustomer.name,
    'CPF/CNPJ:': normalizedCustomer.document || 'Não informado',
    'Telefone:': normalizedCustomer.phone || 'Não informado',
    'Endereço:': normalizedCustomer.address || 'Não informado',
  };

  const equipmentName =
    typeof normalizedOrder.equipment === 'string'
      ? normalizedOrder.equipment
      : `${normalizedOrder.equipment.type} ${normalizedOrder.equipment.brand} ${normalizedOrder.equipment.model}`;

  const equipmentData = {
    'Equipamento:': equipmentName,
    'Nº Série:': normalizedOrder.serialNumber || 'Não informado',
    'Data Entrada:': new Date(normalizedOrder.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
    'Defeito Relatado:': normalizedOrder.reportedProblem || 'Não informado',
  };

  const clientBoxHeight = drawInfoBox('Dados do Cliente', clientData, margin, currentY, boxWidth);
  const equipmentBoxHeight = drawInfoBox('Informações do Equipamento', equipmentData, margin + boxWidth + 5, currentY, boxWidth);
  currentY = Math.max(clientBoxHeight, equipmentBoxHeight) + 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISE TÉCNICA', margin, currentY);
  currentY += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const laudoLines = doc.splitTextToSize(normalizedOrder.technicalReport || '', pageWidth - margin * 2);
  doc.text(laudoLines, margin, currentY);
  currentY += doc.getTextDimensions(laudoLines).h + 20;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const city = companyInfo.address?.split('-')[0]?.split(',')[1]?.trim() || '____________';
  const emissionDateTime = `${city}, ${generationDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })} às ${generationDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(emissionDateTime, pageWidth / 2, currentY, { align: 'center' });
  currentY += 25;

  doc.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
  currentY += 5;

  doc.setFontSize(10);
  doc.text(normalizeOptionalText(normalizedUser?.name) || 'Técnico Responsável', pageWidth / 2, currentY, { align: 'center' });
  currentY += 4;
  doc.setFontSize(8);
  doc.text(normalizeOptionalText(companyInfo.name), pageWidth / 2, currentY, { align: 'center' });

  doc.output('dataurlnewwindow');
};
