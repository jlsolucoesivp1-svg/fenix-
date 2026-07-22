import { NextResponse } from 'next/server';
import type { FinancialTransaction, OSPayment, ServiceOrder } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { upsertServiceOrderFinalizationTransaction } from '@/lib/service-order-financial';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';
import { finalizeSaasServiceOrder } from '@/lib/server/saas-service-orders';
import { getAuthenticatedAppSession } from '@/lib/server/session';

type FinalizeServiceOrderPayload = {
  orderId?: string;
  newPayments?: OSPayment[];
  newTransactions?: FinancialTransaction[];
  nextStatus?: ServiceOrder['status'];
  deliveredDate?: string;
};

type FinalizeServiceOrderResult = {
  duplicated: boolean;
  order: ServiceOrder;
  transactions: FinancialTransaction[];
};

export async function POST(request: Request) {
  try {
    const appSession = await getAuthenticatedAppSession();

    const payload = (await request.json()) as FinalizeServiceOrderPayload;
    const orderId = payload.orderId?.trim();
    const newPayments = Array.isArray(payload.newPayments) ? payload.newPayments : [];
    const newTransactions = Array.isArray(payload.newTransactions) ? payload.newTransactions : [];
    const deliveredDate = payload.deliveredDate?.trim() || new Date().toISOString().split('T')[0];
    const nextStatus = payload.nextStatus || 'Finalizado';

    if (!orderId) {
      return NextResponse.json({ error: 'OrderId invalido.' }, { status: 400 });
    }

    if (appSession.authSource === 'supabase-only') {
      const saasContext = await requireSaasPermission(
        'accessServiceOrders',
        'Modulo de ordens de servico SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para finalizar ordens de servico.'
      );
      if (saasContext instanceof NextResponse) return saasContext;

      const result = await finalizeSaasServiceOrder({
        accessToken: saasContext.accessToken,
        companyId: saasContext.companyId,
        authUserId: saasContext.userId,
        actorDisplayName:
          appSession.supabaseUser?.loginName || appSession.supabaseUser?.email || 'Nao identificado',
        orderId,
        newPayments,
        newTransactions,
        nextStatus,
        deliveredDate,
      });

      return NextResponse.json(result);
    }

    const authResult = await requirePermission('accessServiceOrders', 'Voce nao tem permissao para finalizar ordens de servico.');
    if (authResult instanceof NextResponse) return authResult;

    const result = await withTransaction(async (client) => {
      const [orders, transactions] = await Promise.all([
        listCollectionWithClient<ServiceOrder>(client, 'serviceOrders'),
        listCollectionWithClient<FinancialTransaction>(client, 'financialTransactions'),
      ]);

      const currentOrder = orders.find((order) => order.id === orderId);
      if (!currentOrder) {
        throw new Error('Ordem de servico nao encontrada.');
      }

      const transactionIds = new Set(transactions.map((transaction) => transaction.id));
      const alreadyAppliedTransactions = newTransactions.every((transaction) => transactionIds.has(transaction.id));
      const alreadyAppliedPayments = newPayments.every((payment) =>
        (currentOrder.payments || []).some(
          (existingPayment) =>
            existingPayment.id === payment.id ||
            (
              existingPayment.amount === payment.amount &&
              existingPayment.date === payment.date &&
              existingPayment.method === payment.method
            )
        )
      );

      if (
        currentOrder.status === nextStatus &&
        currentOrder.deliveredDate === deliveredDate &&
        alreadyAppliedTransactions &&
        alreadyAppliedPayments
      ) {
        return {
          duplicated: true,
          order: currentOrder,
          transactions: transactions.filter((transaction) => transaction.relatedServiceOrderId === orderId),
        } satisfies FinalizeServiceOrderResult;
      }

      const mergedTransactions = newTransactions.reduce(
        (currentTransactions, transaction) =>
          transaction.origin === 'service-order-finalization'
            ? upsertServiceOrderFinalizationTransaction(currentTransactions, transaction)
            : currentTransactions.some((existingTransaction) => existingTransaction.id === transaction.id)
              ? currentTransactions
              : [transaction, ...currentTransactions],
        transactions
      );

      const existingPayments = currentOrder.payments || [];
      const mergedPayments = [...existingPayments];
      for (const payment of newPayments) {
        const exists = mergedPayments.some(
          (existingPayment) =>
            existingPayment.id === payment.id ||
            (
              existingPayment.amount === payment.amount &&
              existingPayment.date === payment.date &&
              existingPayment.method === payment.method
            )
        );
        if (!exists) {
          mergedPayments.push(payment);
        }
      }

      const updatedOrder: ServiceOrder = {
        ...currentOrder,
        status: nextStatus,
        deliveredDate,
        payments: mergedPayments,
      };

      await upsertCollectionRecordWithClient(client, 'serviceOrders', updatedOrder);

      for (const transaction of newTransactions) {
        const transactionToPersist =
          transaction.origin === 'service-order-finalization'
            ? mergedTransactions.find((entry) => entry.id === transaction.id)
            : transaction;

        if (transactionToPersist) {
          await upsertCollectionRecordWithClient(client, 'financialTransactions', transactionToPersist);
        }
      }

      return {
        duplicated: false,
        order: updatedOrder,
        transactions: mergedTransactions.filter((transaction) => transaction.relatedServiceOrderId === orderId),
      } satisfies FinalizeServiceOrderResult;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao finalizar ordem de servico:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao finalizar ordem de servico.' },
      { status: 500 }
    );
  }
}
