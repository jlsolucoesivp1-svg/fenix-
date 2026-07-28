import { NextResponse } from 'next/server';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { searchSaasProducts } from '@/lib/server/saas-products';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') ?? '';
    const requestedLimit = Number(searchParams.get('limit') ?? '10');
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 15) : 10;
    const context = await requireSaasPermission('accessInventory', 'Busca de produtos SaaS indisponivel para a sessao atual.', 'Voce nao tem permissao para buscar produtos.');
    if (context instanceof NextResponse) return context;
    return NextResponse.json(await searchSaasProducts(context.accessToken, context.companyId, query, limit));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao buscar produtos.' }, { status: 500 });
  }
}
