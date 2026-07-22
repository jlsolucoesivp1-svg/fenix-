'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  FileBadge,
  Mail,
  MapPin,
  Phone,
  Printer,
  ShoppingCart,
  StickyNote,
  User,
} from 'lucide-react';
import type { CompanyInfo, Customer, Sale } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getEffectiveCompanyInfo, getEffectiveCustomers } from '@/lib/storage';
import { normalizeOptionalText, normalizeText } from '@/lib/text';

interface SaleInvoiceDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sale: Sale | null;
}

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number }) => (
  <div className="flex items-start gap-3">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-semibold">{value || 'Nao informado'}</p>
    </div>
  </div>
);

const loadImageAsDataUrl = (url: string | undefined): Promise<string | null> => {
  if (!url) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const img = new window.Image();
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

const resolveSaleCustomer = (sale: Sale, customers: Customer[]): Customer | null => {
  if (sale.customerId) {
    const customerById = customers.find((customer) => customer.id === sale.customerId);
    if (customerById) {
      return customerById;
    }
  }

  if (sale.customerName) {
    const normalizedCustomerName = sale.customerName.trim().toLowerCase();
    return customers.find((customer) => customer.name.trim().toLowerCase() === normalizedCustomerName) || null;
  }

  return null;
};

const getSaleCustomerRows = (sale: Sale, customer: Customer | null) => {
  const rows: Array<[string, string]> = [];
  const customerName = sale.customerName || customer?.name;

  if (customerName) {
    rows.push(['Cliente', customerName]);
  }
  if (customer?.document) {
    rows.push(['CPF/CNPJ', customer.document]);
  }
  if (customer?.phone) {
    rows.push(['Telefone', customer.phone]);
  }
  if (customer?.email) {
    rows.push(['E-mail', customer.email]);
  }
  if (customer?.address) {
    rows.push(['Endereco', customer.address]);
  }

  return rows;
};

export function SaleInvoiceDialog({ isOpen, onOpenChange, sale }: SaleInvoiceDialogProps) {
  const { toast } = useToast();
  const [companyInfo, setCompanyInfo] = React.useState<CompanyInfo | null>(null);
  const [customer, setCustomer] = React.useState<Customer | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const loadPreviewData = async () => {
      if (!isOpen || !sale) {
        setCompanyInfo(null);
        setCustomer(null);
        return;
      }

      try {
        const [loadedCompanyInfo, loadedCustomers] = await Promise.all([
          getEffectiveCompanyInfo(),
          getEffectiveCustomers(),
        ]);
        const normalizedSale = normalizeText(sale);
        const normalizedCompanyInfo = normalizeText(loadedCompanyInfo);
        const normalizedCustomers = normalizeText(loadedCustomers);
        if (!isMounted) {
          return;
        }

        setCompanyInfo(normalizedCompanyInfo);
        setCustomer(resolveSaleCustomer(normalizedSale, normalizedCustomers));
      } catch (error) {
        console.error(error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Falha ao carregar dados',
            description: 'Nao foi possivel preparar os dados da fatura.',
          });
        }
      }
    };

    loadPreviewData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, sale, toast]);

  const handlePrint = async () => {
    if (!sale) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nao ha dados da venda para imprimir.' });
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      await import('jspdf-autotable');

      const normalizedSale = normalizeText(sale);
      const [loadedCompanyInfo, loadedCustomers] = await Promise.all([
        getEffectiveCompanyInfo(),
        getEffectiveCustomers(),
      ]);
      const activeCompanyInfo = companyInfo || normalizeText(loadedCompanyInfo);
      const activeCustomer = customer || resolveSaleCustomer(normalizedSale, normalizeText(loadedCustomers));
      const customerRows = getSaleCustomerRows(normalizedSale, activeCustomer);
      const logoDataUrl = await loadImageAsDataUrl(activeCompanyInfo.logoUrl);

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
      if (activeCompanyInfo.name) {
        doc.text(normalizeOptionalText(activeCompanyInfo.name), textX, currentY);
        currentY += 8;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      if (activeCompanyInfo.address) {
        doc.text(normalizeOptionalText(activeCompanyInfo.address), textX, currentY);
        currentY += 4;
      }
      if (activeCompanyInfo.phone || activeCompanyInfo.emailOrSite) {
        doc.text(
          `Telefone: ${normalizeOptionalText(activeCompanyInfo.phone)} | E-mail: ${normalizeOptionalText(activeCompanyInfo.emailOrSite)}`,
          textX,
          currentY
        );
      }

      const rightHeaderX = pageWidth - margin;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Comprovante de Venda', rightHeaderX, currentY - 8, { align: 'right' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Venda #${normalizedSale.id.slice(-6)}`, rightHeaderX, currentY - 2, { align: 'right' });
      doc.text(`Data: ${formatDate(normalizedSale.date)} ${normalizedSale.time}`, rightHeaderX, currentY + 4, {
        align: 'right',
      });

      currentY = 50;

      if (customerRows.length > 0) {
        doc.autoTable({
          startY: currentY,
          head: [['Dados do Cliente', 'Informacao']],
          body: customerRows,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 2, lineColor: [220, 220, 220] },
          headStyles: { fillColor: '#0F172A', textColor: '#FFFFFF', fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' } },
        });
        currentY = doc.lastAutoTable.finalY + 8;
      }

      doc.autoTable({
        startY: currentY,
        head: [['Vendedor', 'Forma de Pagamento']],
        body: [[normalizedSale.user, normalizedSale.paymentMethod]],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, lineColor: [220, 220, 220] },
      });
      currentY = doc.lastAutoTable.finalY + 8;

      doc.autoTable({
        startY: currentY,
        head: [['Produto', 'Qtd.', 'Preco Unit.', 'Subtotal']],
        body: normalizedSale.items.map((item) => [
          item.name,
          item.quantity,
          `R$ ${item.price.toFixed(2)}`,
          `R$ ${(item.price * item.quantity).toFixed(2)}`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: '#334155', textColor: '#FFFFFF', fontStyle: 'bold' },
        footStyles: { fillColor: '#F1F5F9', textColor: '#000000', fontStyle: 'bold' },
        foot: [
          [{ content: 'Subtotal:', colSpan: 3, styles: { halign: 'right' } }, `R$ ${normalizedSale.subtotal.toFixed(2)}`],
          [{ content: 'Desconto:', colSpan: 3, styles: { halign: 'right' } }, `- R$ ${normalizedSale.discount.toFixed(2)}`],
          [{ content: 'Total Final:', colSpan: 3, styles: { halign: 'right' } }, `R$ ${normalizedSale.total.toFixed(2)}`],
        ],
      });
      currentY = doc.lastAutoTable.finalY + 10;

      if (normalizedSale.observations) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Observacoes:', margin, currentY);
        currentY += 5;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const obsLines = doc.splitTextToSize(normalizedSale.observations, pageWidth - margin * 2);
        doc.text(obsLines, margin, currentY);
      }

      doc.autoPrint();
      doc.output('dataurlnewwindow');
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Falha ao imprimir',
        description: 'Nao foi possivel gerar a fatura da venda.',
      });
    }
  };

  if (!sale) {
    return null;
  }

  const customerName = sale.customerName || customer?.name;
  const customerInfoRows = getSaleCustomerRows(sale, customer);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85dvh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{sale.status === 'Estornada' ? 'Venda Estornada' : 'Fatura da Venda'} #{sale.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            {sale.status === 'Estornada'
              ? 'Esta venda foi estornada. Os detalhes sao apenas para consulta.'
              : 'A venda foi finalizada. Revise a fatura e imprima para o cliente.'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-grow">
          <ScrollArea className="h-full pr-2 sm:pr-6">
            <div className="space-y-6">
              {sale.status === 'Estornada' && (
                <div className="rounded-r-lg border-l-4 border-destructive bg-destructive/10 p-4">
                  <div className="flex items-start gap-3 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <div>
                      <h4 className="font-semibold">Venda Estornada</h4>
                      <p className="text-sm">Motivo: {sale.reversalReason || 'Nao informado.'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-semibold">Informacoes Gerais</h3>
                <div className="grid grid-cols-1 gap-x-2 gap-y-4 sm:grid-cols-2 md:grid-cols-4">
                  <InfoItem icon={User} label="Vendido por" value={sale.user} />
                  <InfoItem icon={Calendar} label="Data" value={formatDate(sale.date)} />
                  <InfoItem icon={Clock} label="Hora" value={sale.time} />
                  <InfoItem icon={DollarSign} label="Pagamento" value={sale.paymentMethod} />
                </div>
              </div>

              {customerInfoRows.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 font-semibold">Dados do Cliente</h3>
                  <div className="grid grid-cols-1 gap-x-2 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                    <InfoItem icon={User} label="Cliente" value={customerName} />
                    <InfoItem icon={FileBadge} label="CPF/CNPJ" value={customer?.document} />
                    <InfoItem icon={Phone} label="Telefone" value={customer?.phone} />
                    <InfoItem icon={Mail} label="E-mail" value={customer?.email} />
                    <InfoItem icon={MapPin} label="Endereco" value={customer?.address} />
                  </div>
                </div>
              )}

              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold">
                  <ShoppingCart className="h-5 w-5" /> Itens Vendidos
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Qtd.</TableHead>
                        <TableHead className="text-right">Preco Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sale.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-4 font-semibold">Resumo Financeiro</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal dos Itens</span>
                    <span>R$ {sale.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Desconto Aplicado</span>
                    <span className="text-destructive">- R$ {sale.discount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Final</span>
                    <span>R$ {sale.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {sale.observations && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <StickyNote className="h-5 w-5" /> Observacoes
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{sale.observations}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={handlePrint} disabled={sale.status === 'Estornada'}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir Fatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
