import { NextResponse } from 'next/server';
import type { ServiceOrder, StockItem } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { syncServiceOrderStock } from '@/lib/service-order-stock';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';

type SaveServiceOrderPayload = {
  serviceOrder?: ServiceOrder;
};

type SaveServiceOrderResult = {
  duplicated: boolean;
  order: ServiceOrder;
  stock: StockItem[];
};

const compareOrdersForList = (a: ServiceOrder, b: ServiceOrder) => {
  if (a.status === 'Aberta' && b.status !== 'Aberta') {
    return -1;
  }

  if (a.status !== 'Aberta' && b.status === 'Aberta') {
    return 1;
  }

  return new Date(b.date).getTime() - new Date(a.date).getTime();
};

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission('accessServiceOrders', 'Voce nao tem permissao para salvar ordens de servico.');
    if (authResult instanceof NextResponse) return authResult;

    const payload = (await request.json()) as SaveServiceOrderPayload;
    const serviceOrder = payload.serviceOrder;

    if (!serviceOrder?.id || !serviceOrder.customerName?.trim()) {
      return NextResponse.json({ error: 'Payload invalido para salvar a OS.' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      const [orders, stock] = await Promise.all([
        listCollectionWithClient<ServiceOrder>(client, 'serviceOrders'),
        listCollectionWithClient<StockItem>(client, 'stock'),
      ]);

      const previousOrder = orders.find((order) => order.id === serviceOrder.id);
      const finalOrder: ServiceOrder = { ...serviceOrder };

      if (finalOrder.status === 'Entregue' && !finalOrder.deliveredDate) {
        finalOrder.deliveredDate = new Date().toISOString().split('T')[0];
      } else if (finalOrder.status !== 'Entregue') {
        delete finalOrder.deliveredDate;
      }

      const stockSyncResult = syncServiceOrderStock({
        currentStock: stock,
        previousItems: previousOrder?.items || [],
        nextItems: finalOrder.items || [],
      });

      if (!stockSyncResult.ok) {
        throw new Error(stockSyncResult.error);
      }

      const hasSameSnapshot =
        previousOrder &&
        JSON.stringify(previousOrder) === JSON.stringify(finalOrder) &&
        JSON.stringify(stock) === JSON.stringify(stockSyncResult.updatedStock);

      if (hasSameSnapshot) {
        return {
          duplicated: true,
          order: previousOrder,
          stock,
        } satisfies SaveServiceOrderResult;
      }

      for (const stockItem of stockSyncResult.updatedStock) {
        const previousStockItem = stock.find((item) => item.id === stockItem.id);
        if (!previousStockItem || JSON.stringify(previousStockItem) !== JSON.stringify(stockItem)) {
          await upsertCollectionRecordWithClient(client, 'stock', stockItem);
        }
      }

      await upsertCollectionRecordWithClient(client, 'serviceOrders', finalOrder);

      return {
        duplicated: false,
        order: finalOrder,
        stock: stockSyncResult.updatedStock,
      } satisfies SaveServiceOrderResult;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao salvar ordem de servico:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao salvar ordem de servico.' },
      { status: 500 }
    );
  }
}
