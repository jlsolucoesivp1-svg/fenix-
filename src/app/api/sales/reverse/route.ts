import { NextResponse } from 'next/server';
import type { FinancialTransaction, Sale, StockItem } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { reverseSaasSale } from '@/lib/server/saas-sales';
import { getAuthenticatedAppSession } from '@/lib/server/session';

type ReverseSalePayload = {
  saleId?: string;
  reason?: string;
};

type ReverseSaleResult = {
  duplicated: boolean;
  sale: Sale;
  stock: StockItem[];
  transactions: FinancialTransaction[];
};

export async function POST(request: Request) {
  try {
    const appSession = await getAuthenticatedAppSession();

    const payload = (await request.json()) as ReverseSalePayload;
    const saleId = payload.saleId?.trim();
    const reason = payload.reason?.trim();

    if (!saleId || !reason) {
      return NextResponse.json({ error: 'Payload invalido para estorno.' }, { status: 400 });
    }

    if (appSession.authSource === 'supabase-only') {
      const saasContext = await requireSaasPermission(
        'accessFinancials',
        'Modulo de vendas SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para estornar vendas.'
      );
      if (saasContext instanceof NextResponse) return saasContext;

      const result = await reverseSaasSale({
        accessToken: saasContext.accessToken,
        companyId: saasContext.companyId,
        authUserId: saasContext.userId,
        saleId,
        reason,
      });

      return NextResponse.json(result);
    }

    const authResult = await requirePermission('accessFinancials', 'Voce nao tem permissao para estornar vendas.');
    if (authResult instanceof NextResponse) return authResult;

    const result = await withTransaction(async (client) => {
      const [sales, stock, financialTransactions] = await Promise.all([
        listCollectionWithClient<Sale>(client, 'sales'),
        listCollectionWithClient<StockItem>(client, 'stock'),
        listCollectionWithClient<FinancialTransaction>(client, 'financialTransactions'),
      ]);

      const saleToReverse = sales.find((sale) => sale.id === saleId);
      if (!saleToReverse) {
        throw new Error('Venda nao encontrada.');
      }

      if (saleToReverse.status === 'Estornada') {
        return {
          duplicated: true,
          sale: saleToReverse,
          stock,
          transactions: financialTransactions.filter((transaction) => transaction.relatedSaleId === saleId),
        } satisfies ReverseSaleResult;
      }

      const updatedStock = [...stock];
      saleToReverse.items.forEach((saleItem) => {
        if (saleItem.id && saleItem.id.startsWith('PROD-')) {
          const stockIndex = updatedStock.findIndex((stockItem) => stockItem.id === saleItem.id);
          if (stockIndex !== -1) {
            updatedStock[stockIndex] = {
              ...updatedStock[stockIndex],
              quantity: (updatedStock[stockIndex].quantity || 0) + saleItem.quantity,
            };
          }
        }
      });

      const reversedSale: Sale = {
        ...saleToReverse,
        status: 'Estornada',
        reversalReason: reason,
      };

      const updatedTransactions = financialTransactions.map((transaction) =>
        transaction.relatedSaleId === saleId
          ? {
              ...transaction,
              status: 'Estornado' as const,
              category: 'Venda Estornada' as const,
              description: `[ESTORNADO] ${transaction.description} | Motivo: ${reason}`,
            }
          : transaction
      );

      await upsertCollectionRecordWithClient(client, 'sales', reversedSale);

      const touchedStockItemIds = new Set(
        saleToReverse.items
          .map((item) => item.id)
          .filter((itemId): itemId is string => Boolean(itemId && itemId.startsWith('PROD-')))
      );

      for (const stockItem of updatedStock) {
        if (touchedStockItemIds.has(stockItem.id)) {
          await upsertCollectionRecordWithClient(client, 'stock', stockItem);
        }
      }

      for (const transaction of updatedTransactions) {
        if (transaction.relatedSaleId === saleId) {
          await upsertCollectionRecordWithClient(client, 'financialTransactions', transaction);
        }
      }

      return {
        duplicated: false,
        sale: reversedSale,
        stock: updatedStock,
        transactions: updatedTransactions.filter((transaction) => transaction.relatedSaleId === saleId),
      } satisfies ReverseSaleResult;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao estornar venda:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao estornar venda.' },
      { status: 500 }
    );
  }
}
