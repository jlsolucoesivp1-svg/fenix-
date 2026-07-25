import { NextResponse } from 'next/server';
import { registerSaasStockEntry } from '@/lib/server/saas-products';
import { requireSaasPermission } from '@/lib/server/saas-authz';

type StockEntryPayload = {
  itemId?: string;
  quantity?: number;
  cost?: number;
  entryId?: string;
};

export async function POST(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessInventory',
      'Modulo de produtos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para registrar entradas de estoque.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const financialContext = await requireSaasPermission(
      'accessFinancials',
      'Modulo financeiro SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para criar a despesa desta entrada de estoque.'
    );
    if (financialContext instanceof NextResponse) {
      return financialContext;
    }

    if (financialContext.companyId !== context.companyId || financialContext.userId !== context.userId) {
      return NextResponse.json({ error: 'Contexto de tenant invalido para a entrada de estoque.' }, { status: 403 });
    }

    const payload = (await request.json()) as StockEntryPayload;
    const itemId = payload.itemId?.trim();
    const entryId = payload.entryId?.trim();
    const quantity = Number(payload.quantity);
    const cost = Number(payload.cost);

    if (!itemId || !entryId || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(cost) || cost < 0) {
      return NextResponse.json({ error: 'Payload invalido para entrada de estoque SaaS.' }, { status: 400 });
    }

    const result = await registerSaasStockEntry({
      accessToken: context.accessToken,
      companyId: context.companyId,
      authUserId: context.userId,
      itemId,
      quantity,
      cost,
      entryId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao registrar entrada de estoque SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao registrar entrada SaaS.' },
      { status: 500 }
    );
  }
}
