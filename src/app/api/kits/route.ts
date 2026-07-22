import { NextResponse } from 'next/server';
import type { Kit } from '@/types';
import { listSaasKits, upsertSaasKit } from '@/lib/server/saas-kits';
import { requireSaasPermission } from '@/lib/server/saas-authz';

const validateKitPayload = (payload: unknown): Kit => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de kit invalido.');
  }

  const kit = payload as Partial<Kit>;
  if (!kit.name?.trim()) {
    throw new Error('Nome do kit obrigatorio.');
  }

  if (!Array.isArray(kit.items) || kit.items.length === 0) {
    throw new Error('O kit nao pode estar vazio.');
  }

  return {
    id: kit.id?.trim() || `KIT-${Date.now()}`,
    name: kit.name.trim(),
    items: kit.items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: Number(item.quantity),
    })),
  };
};

export async function GET() {
  try {
    const context = await requireSaasPermission(
      'accessInventory',
      'Modulo de kits SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para acessar kits.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const kits = await listSaasKits(context.accessToken);
    return NextResponse.json(kits);
  } catch (error) {
    console.error('Erro ao listar kits SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar kits SaaS.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessInventory',
      'Modulo de kits SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar kits.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const kit = validateKitPayload(await request.json());
    const savedKit = await upsertSaasKit({
      accessToken: context.accessToken,
      companyId: context.companyId,
      kit,
    });

    return NextResponse.json(savedKit);
  } catch (error) {
    console.error('Erro ao salvar kit SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao salvar kit SaaS.' },
      { status: 500 }
    );
  }
}
