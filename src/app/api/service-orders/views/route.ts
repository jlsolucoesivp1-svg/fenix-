import { NextResponse } from 'next/server';
import { listSaasServiceOrderViews, markSaasServiceOrderViewed } from '@/lib/server/saas-service-orders';
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

    const views = await listSaasServiceOrderViews(context.accessToken);
    return NextResponse.json(views);
  } catch (error) {
    console.error('Erro ao listar visualizacoes de OS SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar visualizacoes de OS SaaS.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessServiceOrders',
      'Modulo de ordens de servico SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar ordens de servico.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const payload = (await request.json()) as { serviceOrderId?: string; viewedAt?: string };
    const serviceOrderId = payload.serviceOrderId?.trim();
    const viewedAt = payload.viewedAt?.trim() || new Date().toISOString();

    if (!serviceOrderId) {
      return NextResponse.json({ error: 'ServiceOrderId invalido.' }, { status: 400 });
    }

    await markSaasServiceOrderViewed({
      accessToken: context.accessToken,
      companyId: context.companyId,
      authUserId: context.userId,
      serviceOrderId,
      viewedAt,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar visualizacao de OS SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao marcar visualizacao da OS SaaS.' },
      { status: 500 }
    );
  }
}
