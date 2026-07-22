import { NextResponse } from 'next/server';
import { deleteSaasFinancialTransaction } from '@/lib/server/saas-financial';
import { requireSaasPermission } from '@/lib/server/saas-authz';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessFinancials',
      'Modulo financeiro SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para excluir lancamentos financeiros.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    await deleteSaasFinancialTransaction({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      transactionId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir lancamento financeiro SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir lancamento financeiro SaaS.' },
      { status: 500 }
    );
  }
}
