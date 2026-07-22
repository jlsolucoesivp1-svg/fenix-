import { NextResponse } from 'next/server';
import type { StockItem } from '@/types';
import { deleteSaasProduct, updateSaasProduct } from '@/lib/server/saas-products';
import { requireSaasPermission } from '@/lib/server/saas-authz';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const validateStockItemPayload = (payload: unknown, id: string): StockItem => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de produto invalido.');
  }

  const item = payload as Partial<StockItem>;
  if (!item.name?.trim()) {
    throw new Error('Nome do produto obrigatorio.');
  }

  return {
    id,
    name: item.name.trim(),
    description: item.description?.trim() || '',
    category: item.category?.trim() || '',
    quantity: Number(item.quantity ?? 0),
    price: Number(item.price ?? 0),
    costPrice: Number(item.costPrice ?? 0),
    minStock: Number(item.minStock ?? 0),
    barcode: item.barcode?.trim() || '',
    unitOfMeasure: item.unitOfMeasure?.trim() || 'UN',
  };
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessInventory',
      'Modulo de produtos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar produtos.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    const item = validateStockItemPayload(await request.json(), id);
    const product = await updateSaasProduct({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      item,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro ao atualizar produto SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao atualizar produto SaaS.' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const saasContext = await requireSaasPermission(
      'accessInventory',
      'Modulo de produtos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para excluir produtos.'
    );
    if (saasContext instanceof NextResponse) {
      return saasContext;
    }

    const { id } = await context.params;
    await deleteSaasProduct({
      accessToken: saasContext.accessToken,
      companyId: saasContext.companyId,
      productId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir produto SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao excluir produto SaaS.' },
      { status: 500 }
    );
  }
}
