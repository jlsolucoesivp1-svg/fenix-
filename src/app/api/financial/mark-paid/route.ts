import { NextResponse } from 'next/server';
import type { FinancialTransaction, ServiceOrder } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { listCollectionWithClient, upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';
import { getAuthenticatedAppSession } from '@/lib/server/session';
import { markSaasFinancialTransactionPaid } from '@/lib/server/saas-financial';

type MarkFinancialTransactionPaidPayload = {
  transactionId?: string;
};

type MarkFinancialTransactionPaidResult = {
  duplicated: boolean;
  transaction: FinancialTransaction;
  order?: ServiceOrder;
};

export async function POST(request: Request) {
  try {
    const appSession = await getAuthenticatedAppSession();

    const payload = (await request.json()) as MarkFinancialTransactionPaidPayload;
    const transactionId = payload.transactionId?.trim();

    if (!transactionId) {
      return NextResponse.json({ error: 'TransactionId invalido.' }, { status: 400 });
    }

    if (appSession.authSource === 'supabase-only') {
      const saasContext = await requireSaasPermission(
        'accessFinancials',
        'Modulo financeiro SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para alterar o financeiro.'
      );
      if (saasContext instanceof NextResponse) return saasContext;

      const result = await markSaasFinancialTransactionPaid({
        accessToken: saasContext.accessToken,
        companyId: saasContext.companyId,
        transactionId,
      });

      return NextResponse.json(result);
    }

    const authResult = await requirePermission('accessFinancials', 'Voce nao tem permissao para alterar o financeiro.');
    if (authResult instanceof NextResponse) return authResult;

    const result = await withTransaction(async (client) => {
      const [transactions, orders] = await Promise.all([
        listCollectionWithClient<FinancialTransaction>(client, 'financialTransactions'),
        listCollectionWithClient<ServiceOrder>(client, 'serviceOrders'),
      ]);

      const currentTransaction = transactions.find((transaction) => transaction.id === transactionId);
      if (!currentTransaction) {
        throw new Error('Transacao nao encontrada.');
      }

      if (currentTransaction.status === 'pago') {
        const existingOrder = currentTransaction.relatedServiceOrderId
          ? orders.find((order) => order.id === currentTransaction.relatedServiceOrderId)
          : undefined;

        return {
          duplicated: true,
          transaction: currentTransaction,
          order: existingOrder,
        } satisfies MarkFinancialTransactionPaidResult;
      }

      const paymentDate = new Date().toISOString().split('T')[0];
      let paidTransaction: FinancialTransaction | undefined;
      const updatedTransactions = transactions.map((transaction) => {
        if (transaction.id === transactionId) {
          paidTransaction = {
            ...transaction,
            status: 'pago',
            date: paymentDate,
          };
          return paidTransaction;
        }

        return transaction;
      });

      if (!paidTransaction) {
        throw new Error('Falha ao atualizar a transacao.');
      }

      let updatedOrder: ServiceOrder | undefined;
      let updatedOrders = orders;

      if (paidTransaction.relatedServiceOrderId) {
        const osId = paidTransaction.relatedServiceOrderId;
        const remainingPending = updatedTransactions.some(
          (transaction) =>
            transaction.relatedServiceOrderId === osId &&
            transaction.status === 'pendente'
        );

        if (!remainingPending) {
          updatedOrders = orders.map((order) => {
            if (order.id !== osId) {
              return order;
            }

            const hasRecordedPayment = (order.payments || []).some(
              (payment) =>
                payment.date === paidTransaction?.date &&
                payment.amount === paidTransaction?.amount &&
                payment.method === paidTransaction?.paymentMethod
            );

            updatedOrder = {
              ...order,
              status: 'Finalizado',
              payments: hasRecordedPayment
                ? order.payments
                : [
                    ...(order.payments || []),
                    {
                      id: `PAY-FIN-${paidTransaction?.id}`,
                      amount: paidTransaction?.amount || 0,
                      date: paidTransaction?.date || paymentDate,
                      method: paidTransaction?.paymentMethod || 'Nao informado',
                    },
                  ],
            };

            return updatedOrder;
          });
        }
      }

      await upsertCollectionRecordWithClient(client, 'financialTransactions', paidTransaction);
      if (updatedOrder) {
        await upsertCollectionRecordWithClient(client, 'serviceOrders', updatedOrder);
      }

      return {
        duplicated: false,
        transaction: paidTransaction,
        order: updatedOrder,
      } satisfies MarkFinancialTransactionPaidResult;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao marcar transacao como paga:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao marcar transacao como paga.' },
      { status: 500 }
    );
  }
}
