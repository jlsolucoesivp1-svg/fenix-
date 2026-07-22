import { NextResponse } from 'next/server';
import { listSaasServiceOrders } from '@/lib/server/saas-service-orders';
import { requireSaasPermission } from '@/lib/server/saas-authz';

export async function GET() {
  try {
    const context = await requireSaasPermission(
      'accessServiceOrders',
      'Modulo de ordens de servico SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para acessar ordens de servico.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const orders = await listSaasServiceOrders(context.accessToken);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Erro ao listar ordens de servico SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar ordens de servico SaaS.' },
      { status: 500 }
    );
  }
}
