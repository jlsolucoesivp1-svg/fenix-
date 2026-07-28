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
import type { CompanyInfo, Customer, ReceiptPrintFormat, Sale } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { getEffectiveCompanyInfo, getEffectiveCustomers, getEffectiveSettings } from '@/lib/storage';
import { normalizeText } from '@/lib/text';
import { buildA4SaleReceipt } from './a4-sale-receipt';
import { buildThermalSaleReceipt } from './thermal-sale-receipt';

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
  const customerName = sale.customerName || customer?.name || 'Consumidor Final';
  rows.push(['Cliente', customerName]);
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
  const [preferredPrintFormat, setPreferredPrintFormat] = React.useState<ReceiptPrintFormat>('a4');

  React.useEffect(() => {
    let isMounted = true;

    const loadPreviewData = async () => {
      if (!isOpen || !sale) {
        setCompanyInfo(null);
        setCustomer(null);
        setPreferredPrintFormat('a4');
        return;
      }

      try {
        const [loadedCompanyInfo, loadedCustomers, loadedSettings] = await Promise.all([
          getEffectiveCompanyInfo(),
          getEffectiveCustomers(),
          getEffectiveSettings(),
        ]);
        const normalizedSale = normalizeText(sale);
        const normalizedCompanyInfo = normalizeText(loadedCompanyInfo);
        const normalizedCustomers = normalizeText(loadedCustomers);
        if (!isMounted) {
          return;
        }

        setCompanyInfo(normalizedCompanyInfo);
        setCustomer(resolveSaleCustomer(normalizedSale, normalizedCustomers));
        setPreferredPrintFormat(loadedSettings.receiptPrintFormat);
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

  const handlePrint = async (format: ReceiptPrintFormat) => {
    if (!sale) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nao ha dados da venda para imprimir.' });
      return;
    }

    // Reserve the auxiliary window inside the click event. Opening it after async PDF
    // generation causes Chrome and Edge to treat it as a pop-up instead of a print action.
    const printWindow = window.open('', '_blank', 'popup=yes,width=860,height=760');

    if (!printWindow) {
      toast({
        variant: 'destructive',
        title: 'Janela de impressao bloqueada',
        description: 'Permita pop-ups para imprimir o comprovante.',
      });
      return;
    }

    try {
      const normalizedSale = normalizeText(sale);
      const [loadedCompanyInfo, loadedCustomers] = await Promise.all([
        getEffectiveCompanyInfo(),
        getEffectiveCustomers(),
      ]);
      const activeCompanyInfo = companyInfo || normalizeText(loadedCompanyInfo);
      const activeCustomer = customer || resolveSaleCustomer(normalizedSale, normalizeText(loadedCustomers));

      if (format === 'thermal_80mm') {
        printWindow.document.write(
          buildThermalSaleReceipt({
            sale: normalizedSale,
            company: activeCompanyInfo,
            customer: activeCustomer,
          })
        );
        printWindow.document.close();
        return;
      }
      printWindow.document.write(
        buildA4SaleReceipt({ sale: normalizedSale, company: activeCompanyInfo, customer: activeCustomer })
      );
      printWindow.document.close();
    } catch (error) {
      console.error(error);
      printWindow.close();
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

  const customerName = sale.customerName || customer?.name || 'Consumidor Final';
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

              <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
                <h3 className="mb-4 font-semibold">Informacoes Gerais</h3>
                <div className="grid grid-cols-1 gap-x-2 gap-y-4 sm:grid-cols-2 md:grid-cols-4">
                  <InfoItem icon={User} label="Vendido por" value={sale.user} />
                  <InfoItem icon={Calendar} label="Data" value={formatDate(sale.date)} />
                  <InfoItem icon={Clock} label="Hora" value={sale.time} />
                  <InfoItem icon={DollarSign} label="Pagamento" value={sale.paymentMethod} />
                </div>
              </div>

              {customerInfoRows.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-sm">
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
                <div className="overflow-x-auto rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
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

              <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm">
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
                <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-sm">
                  <h3 className="mb-2 flex items-center gap-2 font-semibold">
                    <StickyNote className="h-5 w-5" /> Observacoes
                  </h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{sale.observations}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="border-t border-border pt-4 sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void handlePrint(preferredPrintFormat)} disabled={sale.status === 'Estornada'}>
              <Printer className="h-4 w-4" />
              <span>
                {preferredPrintFormat === 'thermal_80mm' ? 'Imprimir Termica 80 mm' : 'Imprimir A4'}
                <span className="ml-2 text-xs font-normal text-primary-foreground/80">Padrao</span>
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => void handlePrint(preferredPrintFormat === 'a4' ? 'thermal_80mm' : 'a4')}
              disabled={sale.status === 'Estornada'}
            >
              <Printer className="h-4 w-4" />
              {preferredPrintFormat === 'thermal_80mm' ? 'Imprimir A4' : 'Imprimir Termica 80 mm'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
