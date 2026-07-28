import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/server/authz';
import { requireSaasPermission } from '@/lib/server/saas-authz';
import { searchCustomersByName } from '@/lib/server/postgres';
import { searchSaasCustomersByName } from '@/lib/server/saas-customers';

const MAX_LIMIT = 15;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nome = searchParams.get('q') ?? searchParams.get('nome') ?? '';
    const runtime = searchParams.get('runtime');
    const limitParam = Number(searchParams.get('limit') ?? '10');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), MAX_LIMIT) : 10;

    if (!nome.trim()) {
      return NextResponse.json([]);
    }

    if (runtime === 'saas') {
      const saasContext = await requireSaasPermission(
        'accessClients',
        'Busca SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para buscar clientes.'
      );
      if (saasContext instanceof NextResponse) {
        return saasContext;
      }

      const customers = await searchSaasCustomersByName(saasContext.accessToken, nome, limit);
      return NextResponse.json(customers);
    }

    const authResult = await requireAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;

    const customers = await searchCustomersByName(nome, limit);
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json({ error: 'Falha ao buscar clientes.' }, { status: 500 });
  }
}
