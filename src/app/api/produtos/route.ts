import { NextResponse } from 'next/server';
import type { StockItem } from '@/types';
import { createSaasProduct, listSaasProducts, listSaasProductsPage, registerSaasStockEntry } from '@/lib/server/saas-products';
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

export async function GET(request: Request) {
  try {
    const context = await requireSaasPermission(
      'accessInventory',
      'Modulo de produtos SaaS indisponivel para a sessao atual.',
      'Voce nao tem permissao para acessar produtos.'
    );
    if (context instanceof NextResponse) {
      return context;
    }

    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get('paginated') === 'true') {
      const requestedPage = Number(searchParams.get('page') ?? '1');
      const products = await listSaasProductsPage({
        accessToken: context.accessToken,
        companyId: context.companyId,
        page: Number.isFinite(requestedPage) ? Math.max(Math.floor(requestedPage), 1) : 1,
        search: searchParams.get('search') ?? '',
      });
      return NextResponse.json(products);
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
    const hasInitialStockEntry = item.quantity > 0 && item.costPrice > 0;

    if (hasInitialStockEntry) {
      const financialContext = await requireSaasPermission(
        'accessFinancials',
        'Modulo financeiro SaaS indisponivel para a sessao atual.',
        'Voce nao tem permissao para criar a despesa da entrada inicial de estoque.'
      );
      if (financialContext instanceof NextResponse) {
        return financialContext;
      }

      if (financialContext.companyId !== context.companyId || financialContext.userId !== context.userId) {
        return NextResponse.json({ error: 'Contexto de tenant invalido para a entrada inicial de estoque.' }, { status: 403 });
      }
    }

    const product = await createSaasProduct({
      accessToken: context.accessToken,
      companyId: context.companyId,
      item: hasInitialStockEntry ? { ...item, quantity: 0 } : item,
    });

    if (!hasInitialStockEntry) {
      return NextResponse.json(product);
    }

    const entryResult = await registerSaasStockEntry({
      accessToken: context.accessToken,
      companyId: context.companyId,
      authUserId: context.userId,
      itemId: product.id,
      quantity: item.quantity,
      cost: item.costPrice,
      entryId: `STOCK-ENTRY-${product.id}`,
    });
    const productWithInitialStock = entryResult.updatedStock.find((stockItem) => stockItem.id === product.id);

    if (!productWithInitialStock) {
      throw new Error('Produto criado, mas nao retornado apos a entrada inicial de estoque.');
    }

    return NextResponse.json(productWithInitialStock);
  } catch (error) {
    console.error('Erro ao criar produto SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao criar produto SaaS.' },
      { status: 500 }
    );
  }
}
