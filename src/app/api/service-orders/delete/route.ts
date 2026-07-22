import { NextResponse } from 'next/server';
import type { FinancialTransaction, ServiceOrder, StockItem } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { syncServiceOrderStock } from '@/lib/service-order-stock';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { deleteCollectionRecordWithClient, listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';
import { deleteSaasServiceOrder } from '@/lib/server/saas-service-orders';
import { getAuthenticatedAppSession } from '@/lib/server/session';

type DeleteServiceOrderPayload = {
  orderId?: string;
};

type DeleteServiceOrderResult = {
  duplicated: boolean;
  orderId: string;
  stock: StockItem[];
};

export async function POST(request: Request) {
  try {
    const appSession = await getAuthenticatedAppSession();

    const payload = (await request.json()) as DeleteServiceOrderPayload;
    const orderId = payload.orderId?.trim();

    if (!orderId) {
      return NextResponse.json({ error: 'OrderId invalido.' }, { status: 400 });
    }

    if (appSession.authSource === 'supabase-only') {
      const saasContext = await requireSaasPermission(
        'accessServiceOrders',
        'Modulo de ordens de servico SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para excluir ordens de servico.'
      );
      if (saasContext instanceof NextResponse) return saasContext;

      const result = await deleteSaasServiceOrder({
        accessToken: saasContext.accessToken,
        companyId: saasContext.companyId,
        authUserId: saasContext.userId,
        actorDisplayName:
          appSession.supabaseUser?.loginName || appSession.supabaseUser?.email || 'Nao identificado',
        orderId,
      });

      return NextResponse.json(result);
    }

    const authResult = await requirePermission('accessServiceOrders', 'Voce nao tem permissao para excluir ordens de servico.');
    if (authResult instanceof NextResponse) return authResult;

    const result = await withTransaction(async (client) => {
      const [orders, stock, transactions] = await Promise.all([
        listCollectionWithClient<ServiceOrder>(client, 'serviceOrders'),
        listCollectionWithClient<StockItem>(client, 'stock'),
        listCollectionWithClient<FinancialTransaction>(client, 'financialTransactions'),
      ]);

      const orderToDelete = orders.find((order) => order.id === orderId);
      if (!orderToDelete) {
        return {
          duplicated: true,
          orderId,
          stock,
        } satisfies DeleteServiceOrderResult;
      }

      let updatedStock = stock;
      if (orderToDelete.items && orderToDelete.items.length > 0) {
        const stockSyncResult = syncServiceOrderStock({
          currentStock: stock,
          previousItems: orderToDelete.items,
          nextItems: [],
        });

        if (!stockSyncResult.ok) {
          throw new Error(stockSyncResult.error);
        }

        updatedStock = stockSyncResult.updatedStock;
      }

      const updatedTransactions = transactions.filter(
        (transaction) => transaction.relatedServiceOrderId !== orderId
      );
      const updatedOrders = orders.filter((order) => order.id !== orderId);

      for (const stockItem of updatedStock) {
        const previousStockItem = stock.find((item) => item.id === stockItem.id);
        if (!previousStockItem || JSON.stringify(previousStockItem) !== JSON.stringify(stockItem)) {
          await upsertCollectionRecordWithClient(client, 'stock', stockItem);
        }
      }

      for (const transaction of transactions) {
        if (transaction.relatedServiceOrderId === orderId) {
          await deleteCollectionRecordWithClient(client, 'financialTransactions', transaction.id);
        }
      }

      await deleteCollectionRecordWithClient(client, 'serviceOrders', orderId);

      return {
        duplicated: false,
        orderId,
        stock: updatedStock,
      } satisfies DeleteServiceOrderResult;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao excluir ordem de servico:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir ordem de servico.' },
      { status: 500 }
    );
  }
}
