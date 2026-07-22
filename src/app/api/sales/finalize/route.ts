import { NextResponse } from 'next/server';
import type { Customer, FinancialTransaction, Sale, SaleItem, StockItem } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { finalizeSaasSale } from '@/lib/server/saas-sales';
import { getAuthenticatedAppSession } from '@/lib/server/session';
import { applySaleToStock, buildSaleFinancialTransactions, buildSaleRecord, sanitizeSaleItems } from '@/lib/sales';

type FinalizeSalePayload = {
  saleId?: string;
  items?: SaleItem[];
  discount?: number;
  paymentMethod?: string;
  observations?: string;
  customerId?: string;
  customerName?: string;
  relatedQuoteId?: string;
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

export async function POST(request: Request) {
  try {
    const appSession = await getAuthenticatedAppSession();

    const payload = (await request.json()) as FinalizeSalePayload;
    const saleId = payload.saleId?.trim();
    const items = payload.items;
    const discount = Number(payload.discount ?? 0);
    const paymentMethod = payload.paymentMethod?.trim() || 'dinheiro';
    const observations = payload.observations?.trim() || '';
    const relatedQuoteId = payload.relatedQuoteId?.trim() || undefined;
    const installmentsEnabled = Boolean(payload.installments?.enabled);
    const installmentsCount = Number(payload.installments?.count ?? 0);
    const firstDueDate = payload.installments?.firstDueDate;

    if (!saleId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Payload invalido para finalizar venda.' }, { status: 400 });
    }

    const sanitizedItems = sanitizeSaleItems(items);

    if (sanitizedItems.length === 0) {
      return NextResponse.json({ error: 'A venda precisa ter ao menos um item valido.' }, { status: 400 });
    }

    if (Number.isNaN(discount) || discount < 0) {
      return NextResponse.json({ error: 'Desconto invalido.' }, { status: 400 });
    }

    if (installmentsEnabled && (!Number.isInteger(installmentsCount) || installmentsCount < 2)) {
      return NextResponse.json({ error: 'Quantidade de parcelas invalida.' }, { status: 400 });
    }

    if (appSession.authSource === 'supabase-only') {
      const saasContext = await requireSaasPermission(
        'accessSales',
        'Modulo de vendas SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para finalizar vendas.'
      );
      if (saasContext instanceof NextResponse) return saasContext;

      const result = await finalizeSaasSale({
        accessToken: saasContext.accessToken,
        companyId: saasContext.companyId,
        authUserId: saasContext.userId,
        saleId,
        items: sanitizedItems,
        discount,
        paymentMethod,
        observations,
        customerId: payload.customerId,
        customerName: payload.customerName,
        relatedQuoteId,
        userName:
          payload.userName?.trim() ||
          appSession.supabaseUser?.loginName ||
          appSession.supabaseUser?.email ||
          'Nao identificado',
        installments: installmentsEnabled
          ? {
              enabled: true,
              count: installmentsCount,
              firstDueDate,
            }
          : undefined,
      });

      return NextResponse.json(result);
    }

    const authResult = await requirePermission('accessSales', 'Voce nao tem permissao para finalizar vendas.');
    if (authResult instanceof NextResponse) return authResult;

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
      const now = new Date();
      const customerName = customer?.name || payload.customerName;
      const sale = buildSaleRecord({
        saleId,
        items: sanitizedItems,
        discount,
        paymentMethod,
        observations,
        customerId: customer?.id || payload.customerId,
        customerName,
        relatedQuoteId,
        userName: payload.userName?.trim() || authResult.name,
        now,
      });

      const updatedStock = applySaleToStock(stock, sanitizedItems);
      const newTransactions = buildSaleFinancialTransactions({
        sale,
        paymentMethod,
        installments: installmentsEnabled
          ? {
              enabled: true,
              count: installmentsCount,
              firstDueDate,
            }
          : undefined,
        now,
      });

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
