import { NextResponse } from 'next/server';
import type { Quote } from '@/types';
import { deleteSaasQuote, upsertSaasQuote } from '@/lib/server/saas-quotes';
import { requireSaasPermission } from '@/lib/server/saas-authz';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const validateQuotePayload = (payload: unknown, id: string): Quote => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de orcamento invalido.');
  }

  const quote = payload as Partial<Quote>;
  if (!quote.date?.trim()) {
    throw new Error('Data do orcamento obrigatoria.');
  }
  if (!quote.time?.trim()) {
    throw new Error('Hora do orcamento obrigatoria.');
  }
  if (!quote.user?.trim()) {
    throw new Error('Usuario do orcamento obrigatorio.');
  }
  if (!Array.isArray(quote.items) || quote.items.length === 0) {
    throw new Error('O orcamento precisa ter pelo menos um item.');
  }
  if (!quote.validUntil?.trim()) {
    throw new Error('Validade do orcamento obrigatoria.');
  }

  return {
    id,
    date: quote.date,
    time: quote.time,
    user: quote.user.trim(),
    items: quote.items.map((item) => ({
      id: item.id?.trim() || `ITEM-${Date.now()}`,
      name: item.name?.trim() || '',
      quantity: Number(item.quantity ?? 0),
      price: Number(item.price ?? 0),
    })),
    subtotal: Number(quote.subtotal ?? 0),
    discount: Number(quote.discount ?? 0),
    total: Number(quote.total ?? 0),
    observations: quote.observations?.trim() || '',
    customerId: quote.customerId?.trim() || undefined,
    customerName: quote.customerName?.trim() || undefined,
    status: quote.status || 'Pendente',
    validUntil: quote.validUntil,
    data_vencimento: quote.data_vencimento || quote.validUntil,
    validityDays: Number(quote.validityDays ?? quote.dias_validade ?? 3),
    dias_validade: Number(quote.dias_validade ?? quote.validityDays ?? 3),
  };
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessQuotes',
      'Modulo de orcamentos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar orcamentos.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    const quote = validateQuotePayload(await request.json(), id);
    const savedQuote = await upsertSaasQuote({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      quote,
    });

    return NextResponse.json(savedQuote);
  } catch (error) {
    console.error('Erro ao atualizar orcamento SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao atualizar orcamento SaaS.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessQuotes',
      'Modulo de orcamentos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para excluir orcamentos.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    await deleteSaasQuote({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      quoteId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir orcamento SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir orcamento SaaS.' },
      { status: 500 }
    );
  }
}
