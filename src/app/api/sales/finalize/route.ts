import { addMonths, format } from 'date-fns';
import { NextResponse } from 'next/server';
import type { Customer, FinancialTransaction, Sale, SaleItem, StockItem } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';
import { getPosPaymentMethodLabel } from '@/lib/payment-methods';

type FinalizeSalePayload = {
  saleId?: string;
  items?: SaleItem[];
  discount?: number;
  paymentMethod?: string;
  observations?: string;
  customerId?: string;
  customerName?: string;
  userName?: string;
  installments?: {
    enabled: boolean;
    count: number;
    firstDueDate?: string;
  };
};

type FinalizeSaleResult = {
  duplicated: boolean;
  sale: Sale;
  stock: StockItem[];
  transactions: FinancialTransaction[];
};

const toIsoDate = (value: Date) => format(value, 'yyyy-MM-dd');

const buildSaleDescription = ({
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
}) => `Cliente: ${customerName || 'Nao identificado'} | Produto(s): ${productNames} | Pagamento: ${paymentMethodLabel} | Valor Total: R$ ${total.toFixed(2)} | Data: ${saleDate}`;

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission('accessSales', 'Voce nao tem permissao para finalizar vendas.');
    if (authResult instanceof NextResponse) return authResult;

    const payload = (await request.json()) as FinalizeSalePayload;
    const saleId = payload.saleId?.trim();
    const items = payload.items;
    const discount = Number(payload.discount ?? 0);
    const paymentMethod = payload.paymentMethod?.trim() || 'dinheiro';
    const observations = payload.observations?.trim() || '';
    const installmentsEnabled = Boolean(payload.installments?.enabled);
    const installmentsCount = Number(payload.installments?.count ?? 0);
    const firstDueDate = payload.installments?.firstDueDate;

    if (!saleId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Payload invalido para finalizar venda.' }, { status: 400 });
    }

    const sanitizedItems = items
      .filter((item) => item && typeof item.name === 'string' && Number(item.quantity) > 0)
      .map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price ?? 0),
      }));

    if (sanitizedItems.length === 0) {
      return NextResponse.json({ error: 'A venda precisa ter ao menos um item valido.' }, { status: 400 });
    }

    if (Number.isNaN(discount) || discount < 0) {
      return NextResponse.json({ error: 'Desconto invalido.' }, { status: 400 });
    }

    if (installmentsEnabled && (!Number.isInteger(installmentsCount) || installmentsCount < 2)) {
      return NextResponse.json({ error: 'Quantidade de parcelas invalida.' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      const [sales, stock, financialTransactions, customers] = await Promise.all([
        listCollectionWithClient<Sale>(client, 'sales'),
        listCollectionWithClient<StockItem>(client, 'stock'),
        listCollectionWithClient<FinancialTransaction>(client, 'financialTransactions'),
        listCollectionWithClient<Customer>(client, 'customers'),
      ]);

      const existingSale = sales.find((sale) => sale.id === saleId);
      if (existingSale) {
        const relatedTransactions = financialTransactions.filter((transaction) => transaction.relatedSaleId === saleId);
        return {
          duplicated: true,
          sale: existingSale,
          stock,
          transactions: relatedTransactions,
        } satisfies FinalizeSaleResult;
      }

      const customer = payload.customerId ? customers.find((entry) => entry.id === payload.customerId) : undefined;
      const subtotal = sanitizedItems.reduce((total, item) => total + item.price * item.quantity, 0);
      const total = subtotal - discount;
      const now = new Date();
      const saleDate = toIsoDate(now);
      const paymentMethodLabel = getPosPaymentMethodLabel(paymentMethod);
      const productNames = sanitizedItems.map((item) => item.name).join(', ');
      const customerName = customer?.name || payload.customerName;

      const sale: Sale = {
        id: saleId,
        date: saleDate,
        time: now.toLocaleTimeString('pt-BR'),
        user: payload.userName?.trim() || authResult.name || 'Nao identificado',
        items: sanitizedItems,
        subtotal,
        discount,
        total,
        paymentMethod: paymentMethodLabel,
        observations,
        customerId: customer?.id || payload.customerId,
        customerName,
      };

      const updatedStock = [...stock];
      sanitizedItems.forEach((saleItem) => {
        if (saleItem.id && saleItem.id.startsWith('PROD-')) {
          const stockIndex = updatedStock.findIndex((stockItem) => stockItem.id === saleItem.id);
          if (stockIndex !== -1) {
            updatedStock[stockIndex] = {
              ...updatedStock[stockIndex],
              quantity: (updatedStock[stockIndex].quantity || 0) - saleItem.quantity,
            };
          }
        }
      });

      let newTransactions: FinancialTransaction[] = [];
      if (installmentsEnabled) {
        const installmentAmount = total / installmentsCount;
        const baseDate = firstDueDate ? new Date(`${firstDueDate}T00:00:00`) : addMonths(now, 1);

        for (let index = 0; index < installmentsCount; index += 1) {
          const dueDate = addMonths(baseDate, index);
          newTransactions.push({
            id: `FIN-${saleId}-${index + 1}`,
            type: 'receita',
            description: `${buildSaleDescription({
              customerName,
              productNames,
              paymentMethodLabel,
              total,
              saleDate: format(now, 'dd/MM/yyyy'),
            })} | Parcelamento: ${index + 1}/${installmentsCount} de R$ ${installmentAmount.toFixed(2)} | Vencimento: ${format(dueDate, 'dd/MM/yyyy')}`,
            amount: installmentAmount,
            date: saleDate,
            dueDate: toIsoDate(dueDate),
            category: 'Venda de Produto',
            paymentMethod: paymentMethodLabel,
            relatedSaleId: sale.id,
            status: 'pendente',
            origin: 'sale',
          });
        }
      } else {
        newTransactions = [
          {
            id: `FIN-${saleId}`,
            type: 'receita',
            description: buildSaleDescription({
              customerName,
              productNames,
              paymentMethodLabel,
              total,
              saleDate: format(now, 'dd/MM/yyyy'),
            }),
            amount: total,
            date: saleDate,
            category: 'Venda de Produto',
            paymentMethod: paymentMethodLabel,
            relatedSaleId: sale.id,
            status: paymentMethod === 'boleto' ? 'pendente' : 'pago',
            origin: 'sale',
          },
        ];
      }

      await upsertCollectionRecordWithClient(client, 'sales', sale);

      const touchedStockItemIds = new Set(
        sanitizedItems
          .map((item) => item.id)
          .filter((itemId): itemId is string => Boolean(itemId && itemId.startsWith('PROD-')))
      );

      for (const stockItem of updatedStock) {
        if (touchedStockItemIds.has(stockItem.id)) {
          await upsertCollectionRecordWithClient(client, 'stock', stockItem);
        }
      }

      for (const transaction of newTransactions) {
        await upsertCollectionRecordWithClient(client, 'financialTransactions', transaction);
      }

      return {
        duplicated: false,
        sale,
        stock: updatedStock,
        transactions: newTransactions,
      } satisfies FinalizeSaleResult;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao finalizar venda:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao finalizar venda.' },
      { status: 500 }
    );
  }
}
