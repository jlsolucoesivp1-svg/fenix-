import { NextResponse } from 'next/server';
import { listSaasFinancialOverview } from '@/lib/server/saas-financial';
import { requireSaasPermission } from '@/lib/server/saas-authz';

export async function GET() {
  try {
    const context = await requireSaasPermission(
      'accessFinancials',
      'Modulo financeiro SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para acessar o financeiro.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const overview = await listSaasFinancialOverview(context.accessToken);
    return NextResponse.json(overview);
  } catch (error) {
    console.error('Erro ao carregar overview financeiro SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar financeiro SaaS.' },
      { status: 500 }
    );
  }
}
