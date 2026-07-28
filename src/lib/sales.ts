import { addMonths, format } from 'date-fns';
import { getPosPaymentMethodLabel } from '@/lib/payment-methods';
import type { FinancialTransaction, Sale, SaleItem, StockItem } from '@/types';

export type SaleInstallmentsInput = {
  enabled: boolean;
  count: number;
  firstDueDate?: string;
};

export type BuildSaleRecordInput = {
  saleId: string;
  items: SaleItem[];
  discount: number;
  paymentMethod: string;
  observations?: string;
  customerId?: string;
  customerName?: string;
  relatedQuoteId?: string;
  userName?: string;
  now?: Date;
};

export const toIsoDate = (value: Date) => format(value, 'yyyy-MM-dd');

export const sanitizeSaleItems = (items: SaleItem[]): SaleItem[] =>
  items
    .filter((item) => item && typeof item.name === 'string' && Number(item.quantity) > 0)
    .map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      price: Number(item.price ?? 0),
    }));

export const calculateSaleSubtotal = (items: SaleItem[]): number =>
  items.reduce((total, item) => total + item.price * item.quantity, 0);

export const buildSaleDescription = ({
  customerName,
  productNames,
  paymentMethodLabel,
  total,
  saleDate,
}: {
  customerName?: string;
  productNames: string;
  paymentMethodLabel: string;
  total: number;
  saleDate: string;
}) =>
  `Cliente: ${customerName || 'Consumidor Final'} | Produto(s): ${productNames} | Pagamento: ${paymentMethodLabel} | Valor Total: R$ ${total.toFixed(2)} | Data: ${saleDate}`;

export const buildSaleRecord = ({
  saleId,
  items,
  discount,
  paymentMethod,
  observations = '',
  customerId,
  customerName,
  relatedQuoteId,
  userName,
  now = new Date(),
}: BuildSaleRecordInput): Sale => {
  const subtotal = calculateSaleSubtotal(items);
  const total = subtotal - discount;

  return {
    id: saleId,
    date: toIsoDate(now),
    time: now.toLocaleTimeString('pt-BR'),
    user: userName?.trim() || 'Nao identificado',
    items,
    subtotal,
    discount,
    total,
    paymentMethod: getPosPaymentMethodLabel(paymentMethod),
    observations,
    customerId,
    customerName,
    relatedQuoteId,
  };
};

export const applySaleToStock = (stock: StockItem[], items: SaleItem[]): StockItem[] => {
  const updatedStock = [...stock];

  items.forEach((saleItem) => {
    const productId = saleItem.productId || (saleItem.id.startsWith('PROD-') ? saleItem.id : undefined);
    if (productId) {
      const stockIndex = updatedStock.findIndex((stockItem) => stockItem.id === productId);
      if (stockIndex !== -1) {
        updatedStock[stockIndex] = {
          ...updatedStock[stockIndex],
          quantity: (updatedStock[stockIndex].quantity || 0) - saleItem.quantity,
        };
      }
    }
  });

  return updatedStock;
};

export const buildSaleFinancialTransactions = ({
  sale,
  paymentMethod,
  installments,
  now = new Date(),
}: {
  sale: Sale;
  paymentMethod: string;
  installments?: SaleInstallmentsInput;
  now?: Date;
}): FinancialTransaction[] => {
  const productNames = sale.items.map((item) => item.name).join(', ');
  const saleDateLabel = format(now, 'dd/MM/yyyy');
  const paymentMethodLabel = sale.paymentMethod;
  const descriptionBase = buildSaleDescription({
    customerName: sale.customerName,
    productNames,
    paymentMethodLabel,
    total: sale.total,
    saleDate: saleDateLabel,
  });

  if (installments?.enabled) {
    const installmentAmount = sale.total / installments.count;
    const baseDate = installments.firstDueDate
      ? new Date(`${installments.firstDueDate}T00:00:00`)
      : addMonths(now, 1);

    return Array.from({ length: installments.count }, (_, index) => {
      const dueDate = addMonths(baseDate, index);

      return {
        id: `FIN-${sale.id}-${index + 1}`,
        type: 'receita',
        description: `${descriptionBase} | Parcelamento: ${index + 1}/${installments.count} de R$ ${installmentAmount.toFixed(2)} | Vencimento: ${format(dueDate, 'dd/MM/yyyy')}`,
        amount: installmentAmount,
        date: sale.date,
        dueDate: toIsoDate(dueDate),
        category: 'Venda de Produto',
        paymentMethod: paymentMethodLabel,
        relatedSaleId: sale.id,
        status: 'pendente',
        origin: 'sale',
      };
    });
  }

  return [
    {
      id: `FIN-${sale.id}`,
      type: 'receita',
      description: descriptionBase,
      amount: sale.total,
      date: sale.date,
      category: 'Venda de Produto',
      paymentMethod: paymentMethodLabel,
      relatedSaleId: sale.id,
      status: paymentMethod === 'boleto' ? 'pendente' : 'pago',
      origin: 'sale',
    },
  ];
};
