import { NextResponse } from 'next/server';
import type { FinancialTransaction } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';

type CreateManualFinancialTransactionPayload = {
  transaction?: Omit<FinancialTransaction, 'id' | 'relatedSaleId' | 'relatedServiceOrderId'>;
};

type CreateManualFinancialTransactionResult = {
  duplicated: boolean;
  transaction: FinancialTransaction;
};

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission('accessFinancials', 'Voce nao tem permissao para registrar lancamentos.');
    if (authResult instanceof NextResponse) return authResult;

    const payload = (await request.json()) as CreateManualFinancialTransactionPayload;
    const transaction = payload.transaction;

    if (!transaction?.description?.trim() || Number(transaction.amount) <= 0 || !transaction.date) {
      return NextResponse.json({ error: 'Payload invalido para lancamento manual.' }, { status: 400 });
    }

    const result = await withTransaction(async (client) => {
      const newTransaction: FinancialTransaction = {
        ...transaction,
        id: `FIN-${Date.now()}`,
      };

      await upsertCollectionRecordWithClient(client, 'financialTransactions', newTransaction);

      return {
        duplicated: false,
        transaction: newTransaction,
      } satisfies CreateManualFinancialTransactionResult;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao criar lancamento manual:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao criar lancamento manual.' },
      { status: 500 }
    );
  }
}
