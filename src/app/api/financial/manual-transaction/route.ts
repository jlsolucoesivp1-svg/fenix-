import { NextResponse } from 'next/server';
import type { FinancialTransaction } from '@/types';
import { requirePermission } from '@/lib/server/authz';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { upsertCollectionRecordWithClient, withTransaction } from '@/lib/server/postgres';
import { createSaasManualFinancialTransaction } from '@/lib/server/saas-financial';
import { getAuthenticatedAppSession } from '@/lib/server/session';

type CreateManualFinancialTransactionPayload = {
  transaction?: Omit<FinancialTransaction, 'id' | 'relatedSaleId' | 'relatedServiceOrderId'>;
};

type CreateManualFinancialTransactionResult = {
  duplicated: boolean;
  transaction: FinancialTransaction;
};

export async function POST(request: Request) {
  try {
    const appSession = await getAuthenticatedAppSession();

    const payload = (await request.json()) as CreateManualFinancialTransactionPayload;
    const transaction = payload.transaction;

    if (!transaction?.description?.trim() || Number(transaction.amount) <= 0 || !transaction.date) {
      return NextResponse.json({ error: 'Payload invalido para lancamento manual.' }, { status: 400 });
    }

    if (appSession.authSource === 'supabase-only') {
      const saasContext = await requireSaasPermission(
        'accessFinancials',
        'Modulo financeiro SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para registrar lancamentos.'
      );
      if (saasContext instanceof NextResponse) return saasContext;

      const createdTransaction = await createSaasManualFinancialTransaction({
        accessToken: saasContext.accessToken,
        companyId: saasContext.companyId,
        authUserId: saasContext.userId,
        transaction,
      });

      return NextResponse.json({
        duplicated: false,
        transaction: createdTransaction,
      } satisfies CreateManualFinancialTransactionResult);
    }

    const authResult = await requirePermission('accessFinancials', 'Voce nao tem permissao para registrar lancamentos.');
    if (authResult instanceof NextResponse) return authResult;

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
