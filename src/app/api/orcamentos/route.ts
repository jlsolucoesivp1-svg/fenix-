import { NextResponse } from 'next/server';
import type { Quote } from '@/types';
import { listSaasQuotes, listSaasQuotesPage, upsertSaasQuote } from '@/lib/server/saas-quotes';
import { requireSaasPermission } from '@/lib/server/saas-authz';

const validateQuotePayload = (payload: unknown): Quote => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de orcamento invalido.');
  }

  const quote = payload as Partial<Quote>;
  if (!quote.id?.trim()) {
    throw new Error('Identificador do orcamento obrigatorio.');
  }
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
    id: quote.id.trim(),
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

export async function GET(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessQuotes',
      'Modulo de orcamentos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para acessar orcamentos.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const query = new URL(request.url).searchParams;
    if (query.get('paginated') === 'true') {
      const requestedPage = Number(query.get('page') ?? '1');
      return NextResponse.json(await listSaasQuotesPage({ accessToken: context.accessToken, companyId: context.companyId, page: Number.isFinite(requestedPage) ? Math.max(Math.floor(requestedPage), 1) : 1, search: query.get('search') ?? '', status: query.get('status') ?? 'todos' }));
    }
    const quotes = await listSaasQuotes(context.accessToken);
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Erro ao listar orcamentos SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar orcamentos SaaS.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessQuotes',
      'Modulo de orcamentos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar orcamentos.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const quote = validateQuotePayload(await request.json());
    const savedQuote = await upsertSaasQuote({
      accessToken: context.accessToken,
      companyId: context.companyId,
      quote,
    });

    return NextResponse.json(savedQuote);
  } catch (error) {
    console.error('Erro ao salvar orcamento SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao salvar orcamento SaaS.' },
      { status: 500 }
    );
  }
}
