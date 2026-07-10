import { NextResponse } from 'next/server';
import type { FinancialTransaction, StockItem } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';

type StockEntryPayload = {
  itemId?: string;
  quantity?: number;
  cost?: number;
  entryId?: string;
};

const requireUser = async () => {
  return requirePermission('accessInventory', 'Voce nao tem permissao para registrar entradas de estoque.');
};

export async function POST(request: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;

    const payload = (await request.json()) as StockEntryPayload;
    const itemId = payload.itemId?.trim();
    const entryId = payload.entryId?.trim();
    const quantity = Number(payload.quantity);
    const cost = Number(payload.cost);

    if (!itemId || !entryId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(cost) || cost < 0) {
      return NextResponse.json({ error: 'Payload invalido para entrada de estoque.' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      const [stock, transactions] = await Promise.all([
        listCollectionWithClient<StockItem>(client, 'stock'),
        listCollectionWithClient<FinancialTransaction>(client, 'financialTransactions'),
      ]);

      const existingTransaction = transactions.find((transaction) => transaction.relatedStockEntryId === entryId);
      if (existingTransaction) {
        return {
          duplicated: true,
          updatedStock: stock,
          transaction: existingTransaction,
        };
      }

      const stockIndex = stock.findIndex((item) => item.id === itemId);
      if (stockIndex === -1) {
        throw new Error('Produto nao encontrado no estoque.');
      }

      const stockItem = stock[stockIndex];
      const updatedStockItem: StockItem = {
        ...stockItem,
        quantity: (stockItem.quantity || 0) + quantity,
        costPrice: cost,
      };

      const transaction: FinancialTransaction = {
        id: `FIN-STOCK-${entryId}`,
        type: 'despesa',
        category: 'Compra de Mercadoria',
        amount: cost * quantity,
        description: `Entrada de estoque - ${stockItem.name}`,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'Pendente',
        status: 'pago',
        relatedStockEntryId: entryId,
      };

      await upsertCollectionRecordWithClient(client, 'stock', updatedStockItem);
      await upsertCollectionRecordWithClient(client, 'financialTransactions', transaction);

      return {
        duplicated: false,
        updatedStock: stock.map((item, index) => (index === stockIndex ? updatedStockItem : item)),
        transaction,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao registrar entrada de estoque:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao registrar entrada.' }, { status: 500 });
  }
}
