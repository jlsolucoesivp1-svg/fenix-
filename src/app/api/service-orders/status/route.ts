import { NextResponse } from 'next/server';
import type { ServiceOrder } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';
import { getAuthenticatedAppSession } from '@/lib/server/session';
import { updateSaasServiceOrderStatus } from '@/lib/server/saas-service-orders';

type UpdateServiceOrderStatusPayload = {
  orderId?: string;
  status?: ServiceOrder['status'];
};

type UpdateServiceOrderStatusResult = {
  duplicated: boolean;
  order: ServiceOrder;
};

export async function POST(request: Request) {
  try {
    const appSession = await getAuthenticatedAppSession();

    const payload = (await request.json()) as UpdateServiceOrderStatusPayload;
    const orderId = payload.orderId?.trim();
    const nextStatus = payload.status;

    if (!orderId || !nextStatus) {
      return NextResponse.json({ error: 'Payload invalido para atualizar o status da OS.' }, { status: 400 });
    }

    if (appSession.authSource === 'supabase-only') {
      const saasContext = await requireSaasPermission(
        'accessServiceOrders',
        'Modulo de ordens de servico SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para alterar o status das ordens de servico.'
      );
      if (saasContext instanceof NextResponse) return saasContext;

      const result = await updateSaasServiceOrderStatus({
        accessToken: saasContext.accessToken,
        companyId: saasContext.companyId,
        authUserId: saasContext.userId,
        actorDisplayName:
          appSession.supabaseUser?.loginName || appSession.supabaseUser?.email || 'Nao identificado',
        orderId,
        status: nextStatus,
      });

      return NextResponse.json(result);
    }

    const authResult = await requirePermission('accessServiceOrders', 'Voce nao tem permissao para alterar o status das ordens de servico.');
    if (authResult instanceof NextResponse) return authResult;

    const result = await withTransaction(async (client) => {
      const orders = await listCollectionWithClient<ServiceOrder>(client, 'serviceOrders');
      const currentOrder = orders.find((order) => order.id === orderId);

      if (!currentOrder) {
        throw new Error('Ordem de servico nao encontrada.');
      }

      const deliveredDate =
        nextStatus === 'Entregue'
          ? currentOrder.deliveredDate || new Date().toISOString().split('T')[0]
          : undefined;

      if (currentOrder.status === nextStatus && currentOrder.deliveredDate === deliveredDate) {
        return {
          duplicated: true,
          order: currentOrder,
        } satisfies UpdateServiceOrderStatusResult;
      }

      const updatedOrder: ServiceOrder = {
        ...currentOrder,
        status: nextStatus,
      };

      if (deliveredDate) {
        updatedOrder.deliveredDate = deliveredDate;
      } else {
        delete updatedOrder.deliveredDate;
      }

      await upsertCollectionRecordWithClient(client, 'serviceOrders', updatedOrder);

      return {
        duplicated: false,
        order: updatedOrder,
      } satisfies UpdateServiceOrderStatusResult;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao atualizar status da ordem de servico:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao atualizar status da ordem de servico.' },
      { status: 500 }
    );
  }
}
