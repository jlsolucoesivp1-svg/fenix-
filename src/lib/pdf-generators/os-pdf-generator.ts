import type { ServiceOrder, Customer, CompanyInfo } from '@/types';
import { getEffectiveCompanyInfo, getEffectiveSettings } from '@/lib/storage';
import { normalizeOptionalText, normalizeText } from '@/lib/text';
import { formatServiceOrderNumber } from '@/lib/service-order-id';
import { buildPixTxid, createPixPaymentData, extractCityFromAddress } from '@/lib/pix';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export type OsPdfDocumentType = 'service-order' | 'quote' | 'delivery-receipt' | 'invoice';

const osDocumentConfig: Record<
  OsPdfDocumentType,
  {
    label: string;
    title: string;
  }
> = {
  'service-order': {
    label: 'ordem de serviço',
    title: 'Ordem de Serviço',
  },
  quote: {
    label: 'orçamento',
    title: 'Orçamento de Serviço',
  },
  'delivery-receipt': {
    label: 'recibo de entrega',
    title: 'Recibo de Entrega',
  },
  invoice: {
    label: 'fatura',
    title: 'Fatura de Serviço',
  },
};

const formatDate = (dateString: string | undefined) => {
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

const drawHeader = async (doc: jsPDF, companyInfo: CompanyInfo, title: string, orderId: string, date: string) => {
  const logoDataUrl = await loadImageAsDataUrl(companyInfo.logoUrl);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let currentY = 20;
  let textX = margin;
  const logoWidth = 30;
  const logoHeight = 30;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, currentY - 8, logoWidth, logoHeight);
    textX = margin + logoWidth + 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(normalizeOptionalText(companyInfo.name) || 'Sua Empresa', textX, currentY);
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
  doc.text(title, rightHeaderX, currentY - 8, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`OS Nº: #${formatServiceOrderNumber(orderId)}`, rightHeaderX, currentY - 2, { align: 'right' });
  doc.text(`Data: ${date}`, rightHeaderX, currentY + 4, { align: 'right' });

  return 55;
};

const drawInfoBoxes = (doc: jsPDF, customerData: object, equipmentData: object, startY: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const boxWidth = (pageWidth - margin * 2 - 5) / 2;

  const drawBox = (title: string, data: { [key: string]: string | undefined }, x: number, y: number, width: number) => {
    const body = Object.entries(data).filter(([, value]) => value !== undefined);

    doc.setFillColor(243, 244, 246);
    doc.rect(x, y, width, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, x + 3, y + 5);
    (doc as any).autoTable({
      body,
      startY: y + 7,
      theme: 'grid',
      tableWidth: width,
      margin: { left: x },
      styles: { fontSize: 9, cellPadding: 2, lineColor: [200, 200, 200], lineWidth: 0.1 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
    });

    return (doc as any).lastAutoTable.finalY;
  };

  const clientBoxHeight = drawBox('Dados do Cliente', customerData as any, margin, startY, boxWidth);
  const equipmentBoxHeight = drawBox('Informações do Equipamento', equipmentData as any, margin + boxWidth + 5, startY, boxWidth);

  return Math.max(clientBoxHeight, equipmentBoxHeight) + 8;
};

const drawFullWidthBox = (doc: jsPDF, title: string, content: string, y: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin + 3, y + 5);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const textLines = doc.splitTextToSize(content, pageWidth - margin * 2 - 6);
  const textHeight = doc.getTextDimensions(textLines).h;
  doc.setDrawColor(200, 200, 200);
  doc.rect(margin, y + 7, pageWidth - margin * 2, textHeight + 6, 'S');
  doc.text(textLines, margin + 3, y + 12);

  return y + textHeight + 20;
};

const drawItemsTable = (doc: jsPDF, order: ServiceOrder, startY: number, footerLabel: string) => {
  if (!order.items || order.items.length === 0) {
    return startY;
  }

  (doc as any).autoTable({
    startY,
    head: [['Tipo', 'Descrição', 'Qtd', 'Vlr. Unit.', 'Total']],
    body: order.items.map((item) => [
      item.type === 'part' ? 'Peça' : 'Serviço',
      item.description,
      item.quantity,
      `R$ ${item.unitPrice.toFixed(2)}`,
      `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`,
    ]),
    theme: 'striped',
    headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9, cellPadding: 1.5 },
    bodyStyles: { fontSize: 8, cellPadding: 1.5 },
    footStyles: { fillColor: '#F1F5F9', textColor: '#000000', fontStyle: 'bold' },
    foot: [[footerLabel, '', '', '', `R$ ${((order.finalValue ?? order.totalValue) || 0).toFixed(2)}`]],
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

const ensureVerticalSpace = (doc: jsPDF, currentY: number, requiredHeight: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + requiredHeight <= pageHeight - 15) {
    return currentY;
  }

  doc.addPage();
  return 20;
};

export const generateOsPdf = async (documentType: OsPdfDocumentType, order: ServiceOrder, customer: Customer) => {
  const config = osDocumentConfig[documentType];
  if (!config) {
    throw new Error(`Tipo de documento de impressão inválido: ${documentType}`);
  }

  const companyInfo = normalizeText(await getEffectiveCompanyInfo());
  const settings = await getEffectiveSettings();
  const normalizedOrder = normalizeText(order);
  const normalizedCustomer = normalizeText(customer);

  if (!normalizedOrder.id) {
    throw new Error(`Não foi possível gerar ${config.label}: OS sem identificador.`);
  }

  if (!normalizedCustomer.name) {
    throw new Error(`Não foi possível gerar ${config.label}: cliente inválido.`);
  }

  console.info('[print] Gerando documento da OS', {
    documentType,
    label: config.label,
    orderId: normalizedOrder.id,
    customerId: normalizedOrder.customerId,
    customerName: normalizedCustomer.name,
  });

  const doc = new jsPDF();
  const equipmentName =
    typeof normalizedOrder.equipment === 'string'
      ? normalizedOrder.equipment
      : `${normalizedOrder.equipment.type} ${normalizedOrder.equipment.brand} ${normalizedOrder.equipment.model}`;

  const clientData = {
    'Nome:': normalizedCustomer.name,
    'Telefone:': normalizedCustomer.phone || 'Não informado',
    'Documento:': normalizedCustomer.document || 'Não informado',
  };

  const equipmentData = {
    'Equipamento:': equipmentName,
    'Nº Série:': normalizedOrder.serialNumber || 'Não informado',
    'Acessórios:': normalizedOrder.accessories || 'Nenhum',
  };

  if (documentType === 'service-order') {
    let currentY = await drawHeader(doc, companyInfo, config.title, normalizedOrder.id, formatDate(normalizedOrder.date));
    currentY = drawInfoBoxes(doc, clientData, equipmentData, currentY);
    currentY = drawFullWidthBox(doc, 'Defeito Relatado pelo Cliente', normalizedOrder.reportedProblem || 'Não informado.', currentY);
    currentY = drawFullWidthBox(
      doc,
      'Diagnóstico / Observações Técnicas',
      normalizedOrder.technicalReport || 'Aguardando diagnóstico técnico.',
      currentY
    );
    currentY = drawItemsTable(doc, normalizedOrder, currentY, 'Total Previsto');
    currentY += 10;
    doc.setFontSize(8);

    const termsText =
      'Declaro que o equipamento acima foi recebido para execução da ordem de serviço descrita neste documento. Esta via identifica formalmente o atendimento e deve ser apresentada para acompanhamento ou retirada do equipamento.';
    const textLines = doc.splitTextToSize(termsText, doc.internal.pageSize.getWidth() - 30);
    doc.text(textLines, 15, currentY);
    currentY += textLines.length * 4 + 20;

    doc.line(doc.internal.pageSize.getWidth() / 2 - 40, currentY, doc.internal.pageSize.getWidth() / 2 + 40, currentY);
    currentY += 4;
    doc.setFontSize(9);
    doc.text('Assinatura do Cliente', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' });
  }

  if (documentType === 'quote') {
    let currentY = await drawHeader(doc, companyInfo, config.title, normalizedOrder.id, new Date().toLocaleDateString('pt-BR'));
    currentY = drawInfoBoxes(doc, clientData, { ...equipmentData, Acessórios: undefined } as any, currentY);
    currentY = drawFullWidthBox(doc, 'Defeito Reclamado', normalizedOrder.reportedProblem || 'Não informado.', currentY);
    currentY = drawFullWidthBox(
      doc,
      'Diagnóstico / Laudo Técnico',
      normalizedOrder.technicalReport || 'Aguardando diagnóstico técnico.',
      currentY
    );
    currentY = drawItemsTable(doc, normalizedOrder, currentY, 'Total');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Validade e Condições:', 15, currentY);
    currentY += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      'Este orçamento é válido por até 3 dias. A execução dos serviços ocorrerá somente após aprovação do cliente.',
      15,
      currentY
    );
  }

  if (documentType === 'delivery-receipt') {
    let currentY = await drawHeader(doc, companyInfo, config.title, normalizedOrder.id, new Date().toLocaleDateString('pt-BR'));
    currentY = drawInfoBoxes(doc, clientData, { ...equipmentData, Acessórios: undefined } as any, currentY);
    currentY = drawFullWidthBox(
      doc,
      'Resumo dos Serviços/Peças',
      normalizedOrder.technicalReport || 'Nenhum serviço detalhado.',
      currentY
    );

    doc.setFont('helvetica', 'bold');
    doc.text('Termo de Recebimento:', 15, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 5;

    const receiptDate = normalizedOrder.deliveredDate
      ? formatDate(normalizedOrder.deliveredDate)
      : new Date().toLocaleDateString('pt-BR');
    doc.text(
      `Declaro que recebi o equipamento descrito acima, devidamente reparado e em funcionamento, na data de ${receiptDate}.`,
      15,
      currentY
    );
    currentY += 15;

    doc.setFillColor(243, 244, 246);
    doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 7, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Termo de Garantia', 18, currentY + 5);
    currentY += 7;

    let warrantyDays = settings?.defaultWarrantyDays || 90;
    const warrantyMatch = normalizedOrder.warranty?.match(/(\d+)\s*dias/i);
    if (warrantyMatch) {
      warrantyDays = parseInt(warrantyMatch[1], 10);
    }

    const warrantyContent = [
      `1. Prazo: Conforme o Art. 26, II do CDC, o prazo de garantia legal para os serviços prestados e peças novas é de ${warrantyDays} dias a contar da data de entrega do equipamento.`,
      '2. Cobertura: A garantia cobre defeitos de fabricação das peças substituídas e falhas no serviço executado que estejam diretamente relacionadas ao reparo descrito nesta OS.',
      '3. Exclusões: A garantia não cobre danos por mau uso, negligência, acidentes (quedas, líquidos), picos de energia, instalação de softwares maliciosos (vírus), modificações não autorizadas, violação de lacres ou reparos por terceiros. Problemas de software não relacionados ao serviço executado não são cobertos.',
      '4. Procedimento: Para acionar a garantia, apresente esta OS. O equipamento passará por nova análise técnica para constatar se o defeito é coberto pela garantia.',
    ];

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const warrantyLines = doc.splitTextToSize(warrantyContent.join('\n\n'), doc.internal.pageSize.getWidth() - 36);
    const warrantyHeight = doc.getTextDimensions(warrantyLines).h;

    doc.setDrawColor(200, 200, 200);
    doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, warrantyHeight + 6, 'S');
    doc.text(warrantyLines, 18, currentY + 5);
  }

  if (documentType === 'invoice') {
    const totalPaid = normalizedOrder.payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
    const balanceDue = (normalizedOrder.finalValue ?? normalizedOrder.totalValue ?? 0) - totalPaid;

    let currentY = await drawHeader(doc, companyInfo, config.title, normalizedOrder.id, new Date().toLocaleDateString('pt-BR'));
    currentY = drawInfoBoxes(
      doc,
      clientData,
      { ...equipmentData, Acessórios: undefined, 'Data de Entrada': formatDate(normalizedOrder.date) } as any,
      currentY
    );

    if (normalizedOrder.items && normalizedOrder.items.length > 0) {
      (doc as any).autoTable({
        startY: currentY,
        head: [['Descrição', 'Qtd.', 'Vlr. Unit.', 'Total']],
        body: normalizedOrder.items.map((item) => [
          item.description,
          item.quantity,
          `R$ ${item.unitPrice.toFixed(2)}`,
          `R$ ${(item.unitPrice * item.quantity).toFixed(2)}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 9 },
      });
      currentY = (doc as any).lastAutoTable.finalY;
    }

    const summaryX = doc.internal.pageSize.getWidth() - 75;
    (doc as any).autoTable({
      startY: currentY + 2,
      body: [
        ['Subtotal:', `R$ ${normalizedOrder.totalValue.toFixed(2)}`],
        ['Desconto:', `- R$ ${(normalizedOrder.discount || 0).toFixed(2)}`],
        ['Total Pago:', `R$ ${totalPaid.toFixed(2)}`],
        [
          { content: 'SALDO DEVEDOR:', styles: { fontStyle: 'bold' } },
          { content: `R$ ${balanceDue.toFixed(2)}`, styles: { fontStyle: 'bold' } },
        ],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: summaryX },
    });

    currentY = (doc as any).lastAutoTable.finalY;

    if (balanceDue > 0 && companyInfo.pixKey) {
      currentY = ensureVerticalSpace(doc, currentY + 8, 110);

      try {
        const pixPaymentData = createPixPaymentData({
          pixKey: companyInfo.pixKey,
          merchantName: companyInfo.name,
          merchantCity: extractCityFromAddress(companyInfo.address),
          amount: balanceDue,
          txid: buildPixTxid(`OS${formatServiceOrderNumber(normalizedOrder.id)}`),
          description: `OS ${formatServiceOrderNumber(normalizedOrder.id)}`,
          qrCodeWidth: 180,
        });
        const qrCodeDataUrl = await pixPaymentData.qrCodeDataUrlPromise;

        doc.setFillColor(243, 244, 246);
        doc.rect(15, currentY + 8, doc.internal.pageSize.getWidth() - 30, 7, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Pagamento PIX', 18, currentY + 13);
        currentY += 17;

        if (qrCodeDataUrl) {
          doc.addImage(qrCodeDataUrl, 'PNG', 18, currentY, 42, 42);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Valor para pagamento:', 68, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(`R$ ${balanceDue.toFixed(2)}`, 68, currentY + 12);
        doc.text(`TXID: ${buildPixTxid(`OS${formatServiceOrderNumber(normalizedOrder.id)}`)}`, 68, currentY + 18);

        const payloadLines = doc.splitTextToSize(pixPaymentData.payload, doc.internal.pageSize.getWidth() - 88);
        doc.setFont('helvetica', 'bold');
        doc.text('PIX copia e cola:', 68, currentY + 26);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(payloadLines, 68, currentY + 31);
      } catch (error) {
        console.error('[print] Falha ao gerar bloco PIX da fatura', {
          orderId: normalizedOrder.id,
          error,
        });
      }
    }
  }

  console.info('[print] Documento da OS gerado com sucesso', {
    documentType,
    orderId: normalizedOrder.id,
  });

  doc.autoPrint();
  doc.output('dataurlnewwindow');
};
