'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Printer, ReceiptText, Sheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCompanyInfo } from '@/lib/storage';
import { normalizeOptionalText, normalizeText } from '@/lib/text';
import type { FinancialTransaction, CompanyInfo } from '@/types';

interface PrintReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: FinancialTransaction | null;
}

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) {
    return '';
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const loadImageAsDataUrl = (url: string | undefined): Promise<string | null> => {
  if (!url) {
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

export function PrintReceiptDialog({ isOpen, onOpenChange, transaction }: PrintReceiptDialogProps) {
  const [printType, setPrintType] = React.useState<'a4' | 'thermal'>('a4');
  const { toast } = useToast();

  const handlePrint = async () => {
    if (!transaction) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Transação não encontrada.' });
      return;
    }

    const companyInfo = normalizeText(await getCompanyInfo());
    const normalizedTransaction = normalizeText(transaction);

    if (printType === 'a4') {
      await generateA4Pdf(normalizedTransaction, companyInfo);
      return;
    }

    await generateThermalPdf(normalizedTransaction, companyInfo);
  };

  const generateA4Pdf = async (tx: FinancialTransaction, info: CompanyInfo) => {
    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;
    let textX = margin;
    const titleText = tx.type === 'receita' ? 'Recibo de Receita' : 'Comprovante de Despesa';

    if (info.logoUrl) {
      const logoDataUrl = await loadImageAsDataUrl(info.logoUrl);
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, currentY - 8, 30, 30);
        textX = margin + 35;
      }
    }

    doc.setFont('helvetica');
    doc.setTextColor('#000000');

    if (info.name) {
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(normalizeOptionalText(info.name), textX, currentY);
      currentY += 8;
    }

    if (info.address) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(normalizeOptionalText(info.address), textX, currentY);
      currentY += 4;
    }

    if (info.phone || info.emailOrSite) {
      doc.text(`Telefone: ${normalizeOptionalText(info.phone)} | E-mail: ${normalizeOptionalText(info.emailOrSite)}`, textX, currentY);
    }

    const rightHeaderX = pageWidth - margin;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(titleText, rightHeaderX, currentY - 8, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Transação #${tx.id.slice(-6)}`, rightHeaderX, currentY - 2, { align: 'right' });
    doc.text(`Data Emissão: ${new Date().toLocaleDateString('pt-BR')}`, rightHeaderX, currentY + 4, { align: 'right' });

    currentY = 50;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const mainText = `Pelo presente, declaramos para os devidos fins que ${tx.type === 'receita' ? 'recebemos' : 'pagamos'} a quantia de:`;
    doc.text(mainText, margin, currentY, { maxWidth: pageWidth - margin * 2 });
    currentY += 10;

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${tx.amount.toFixed(2)}`, margin, currentY);
    currentY += 15;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Referente a: ${tx.description}`, margin, currentY);
    currentY += 15;

    (doc as any).autoTable({
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3, lineColor: [200, 200, 200] },
      headStyles: { fillColor: '#F1F5F9', textColor: '#000000' },
      body: [
        ['Data do Lançamento', formatDateForDisplay(tx.date)],
        ['Forma de Pagamento', tx.paymentMethod],
        ['Categoria', tx.category],
      ],
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });
    currentY = (doc as any).lastAutoTable.finalY + 40;

    const city = info.address?.split('-')[0]?.split(',')[1]?.trim() || '___________________';
    doc.text(
      `${city}, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`,
      pageWidth / 2,
      currentY,
      { align: 'center' }
    );
    currentY += 20;

    doc.line(pageWidth / 2 - 40, currentY, pageWidth / 2 + 40, currentY);
    doc.text(normalizeOptionalText(info.name) || 'Assinatura', pageWidth / 2, currentY + 5, { align: 'center' });

    doc.autoPrint();
    doc.output('dataurlnewwindow');
  };

  const generateThermalPdf = async (tx: FinancialTransaction, info: CompanyInfo) => {
    const { jsPDF } = await import('jspdf');

    const doc = new jsPDF({ unit: 'mm', format: [80, 297] });
    const pageWidth = 80;
    const margin = 5;
    let y = 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(normalizeOptionalText(info.name) || 'Recibo', pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(normalizeOptionalText(info.address), pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`Telefone: ${normalizeOptionalText(info.phone)}`, pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text(`CNPJ: ${normalizeOptionalText(info.document)}`, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
    y += 4;

    const title = tx.type === 'receita' ? 'RECIBO DE RECEITA' : 'COMPROVANTE DE DESPESA';
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${formatDateForDisplay(tx.date)}`, margin, y);
    y += 5;

    doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.text(tx.description, margin, y, { maxWidth: pageWidth - margin * 2 });
    y += doc.getTextDimensions(tx.description, { maxWidth: pageWidth - margin * 2 }).h + 5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`TOTAL: R$ ${tx.amount.toFixed(2)}`, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pagamento: ${tx.paymentMethod}`, margin, y);
    y += 5;

    doc.text('-------------------------------------------', pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.line(margin + 10, y, pageWidth - margin - 10, y);
    y += 4;
    doc.text('Assinatura', pageWidth / 2, y, { align: 'center' });

    doc.autoPrint();
    doc.output('dataurlnewwindow');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Imprimir Recibo</DialogTitle>
          <DialogDescription>Escolha o tipo de impressora para gerar o recibo da transação.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup defaultValue="a4" value={printType} onValueChange={(value) => setPrintType(value as 'a4' | 'thermal')}>
            <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
              <RadioGroupItem value="a4" id="a4" />
              <Label htmlFor="a4" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Sheet className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">Impressora Comum (A4)</p>
                    <p className="text-xs text-muted-foreground">Para impressoras laser ou jato de tinta.</p>
                  </div>
                </div>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:bg-muted has-[:checked]:border-primary">
              <RadioGroupItem value="thermal" id="thermal" />
              <Label htmlFor="thermal" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-3">
                  <ReceiptText className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-semibold">Impressora Térmica (80mm)</p>
                    <p className="text-xs text-muted-foreground">Para recibos em formato de cupom.</p>
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Confirmar Impressão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
