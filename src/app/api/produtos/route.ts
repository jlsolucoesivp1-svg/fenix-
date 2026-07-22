import { NextResponse } from 'next/server';
import type { StockItem } from '@/types';
import { createSaasProduct, listSaasProducts } from '@/lib/server/saas-products';
import { requireSaasPermission } from '@/lib/server/saas-authz';

const validateStockItemPayload = (payload: unknown): StockItem => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload de produto invalido.');
  }

  const item = payload as Partial<StockItem>;
  if (!item.name?.trim()) {
    throw new Error('Nome do produto obrigatorio.');
  }

  return {
    id: item.id?.trim() || '',
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

export async function GET() {
  try {
    const context = await requireSaasPermission(
      'accessInventory',
      'Modulo de produtos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para acessar produtos.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const products = await listSaasProducts(context.accessToken);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao listar produtos SaaS.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessInventory',
      'Modulo de produtos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para alterar produtos.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const item = validateStockItemPayload(await request.json());
    const product = await createSaasProduct({
      accessToken: context.accessToken,
      companyId: context.companyId,
      item,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Erro ao criar produto SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao criar produto SaaS.' },
      { status: 500 }
    );
  }
}
