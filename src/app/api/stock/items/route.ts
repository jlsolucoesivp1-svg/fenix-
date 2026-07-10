import { NextResponse } from 'next/server';
import type { FinancialTransaction, StockItem } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';

type UpsertStockItemPayload = {
  item?: StockItem;
  previousQuantity?: number;
  operationId?: string;
};

const requireUser = async () => {
  return requirePermission('accessInventory', 'Voce nao tem permissao para alterar o estoque.');
};

export async function POST(request: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;

    const payload = (await request.json()) as UpsertStockItemPayload;
    const item = payload.item;
    const operationId = payload.operationId?.trim();
    const previousQuantity = Number(payload.previousQuantity ?? 0);

    if (!item || typeof item.id !== 'string' || item.id.trim().length === 0) {
      return NextResponse.json({ error: 'Produto invalido.' }, { status: 400 });
    }

    if (!operationId) {
      return NextResponse.json({ error: 'Identificador da operacao invalido.' }, { status: 400 });
    }

    const nextQuantity = Number(item.quantity ?? 0);
    const quantityIncrease = nextQuantity - previousQuantity;

    const result = await withTransaction(async (client) => {
      const [stock, transactions] = await Promise.all([
        listCollectionWithClient<StockItem>(client, 'stock'),
        listCollectionWithClient<FinancialTransaction>(client, 'financialTransactions'),
      ]);

      const existingTransaction = transactions.find((transaction) => transaction.relatedStockEntryId === operationId);
      if (existingTransaction) {
        return {
          duplicated: true,
          updatedStock: stock,
          transaction: existingTransaction,
        };
      }

      const stockIndex = stock.findIndex((stockItem) => stockItem.id === item.id);
      const updatedStock = [...stock];

      if (stockIndex === -1) {
        updatedStock.push(item);
      } else {
        updatedStock[stockIndex] = item;
      }

      let transaction: FinancialTransaction | null = null;
      let updatedTransactions = transactions;

      if (quantityIncrease > 0) {
        transaction = {
          id: `FIN-STOCK-${operationId}`,
          type: 'despesa',
          category: 'Compra de Mercadoria',
          amount: Number(item.costPrice || 0) * quantityIncrease,
          description: `Entrada de estoque - ${item.name}`,
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'Pendente',
          status: 'pago',
          relatedStockEntryId: operationId,
        };

        updatedTransactions = [transaction, ...transactions];
      }

      await upsertCollectionRecordWithClient(client, 'stock', item);
      if (quantityIncrease > 0) {
        await upsertCollectionRecordWithClient(client, 'financialTransactions', transaction!);
      }

      return {
        duplicated: false,
        updatedStock,
        transaction,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao salvar item de estoque:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao salvar item de estoque.' }, { status: 500 });
  }
}
