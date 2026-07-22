import type { StockItem } from '@/types';
import type { InventoryMovementRecord, ProductRecord } from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const PRODUCTS_SELECT_FIELDS =
  'id,company_id,name,description,category,stock_quantity,sale_price,cost_price,min_stock_quantity,barcode,unit_name,is_active';

const buildUrl = (table: 'products' | 'inventory_movements', params: Record<string, string>) => {
  const { url } = getSupabaseUserConfig();
  const searchParams = new URLSearchParams(params);
  return `${url}/rest/v1/${table}?${searchParams.toString()}`;
};

const buildHeaders = (accessToken: string, preferRepresentation = false) => {
  const { anonKey } = getSupabaseUserConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(preferRepresentation ? { Prefer: 'return=representation' } : {}),
  };
};

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as SupabaseErrorPayload;
    return payload.message || payload.error || `Falha na operacao (${response.status}).`;
  } catch {
    return `Falha na operacao (${response.status}).`;
  }
};

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toNumber = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const mapProductRecord = (record: ProductRecord): StockItem => ({
  id: record.id,
  name: record.name,
  description: record.description || '',
  category: record.category || '',
  quantity: toNumber(record.stock_quantity),
  price: toNumber(record.sale_price),
  costPrice: toNumber(record.cost_price),
  minStock: toNumber(record.min_stock_quantity),
  barcode: record.barcode || '',
  unitOfMeasure: record.unit_name,
});

const mapProductInput = (params: { id: string; companyId: string; item: StockItem }) => ({
  id: params.id,
  company_id: params.companyId,
  name: params.item.name.trim(),
  description: normalizeOptionalText(params.item.description),
  category: normalizeOptionalText(params.item.category),
  stock_quantity: params.item.quantity,
  sale_price: params.item.price,
  cost_price: params.item.costPrice,
  min_stock_quantity: params.item.minStock,
  barcode: normalizeOptionalText(params.item.barcode),
  unit_name: params.item.unitOfMeasure?.trim() || 'UN',
  is_active: true,
});

export const generateProductId = () =>
  `PROD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const listSaasProducts = async (accessToken: string): Promise<StockItem[]> => {
  const response = await fetch(
    buildUrl('products', {
      select: PRODUCTS_SELECT_FIELDS,
      is_active: 'eq.true',
      order: 'name.asc',
    }),
    {
      method: 'GET',
      headers: buildHeaders(accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as ProductRecord[];
  return rows.map(mapProductRecord);
};

export const createSaasProduct = async (params: {
  accessToken: string;
  companyId: string;
  item: StockItem;
  id?: string;
}): Promise<StockItem> => {
  const id = params.id?.trim() || generateProductId();
  const response = await fetch(
    buildUrl('products', { select: PRODUCTS_SELECT_FIELDS }),
    {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(
        mapProductInput({
          id,
          companyId: params.companyId,
          item: { ...params.item, id },
        })
      ),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as ProductRecord[];
  const record = rows[0];
  if (!record) {
    throw new Error('Produto criado sem retorno da API.');
  }

  return mapProductRecord(record);
};

export const updateSaasProduct = async (params: {
  accessToken: string;
  companyId: string;
  item: StockItem;
}): Promise<StockItem> => {
  const response = await fetch(
    buildUrl('products', {
      select: PRODUCTS_SELECT_FIELDS,
      id: `eq.${params.item.id}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(
        mapProductInput({
          id: params.item.id,
          companyId: params.companyId,
          item: params.item,
        })
      ),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as ProductRecord[];
  const record = rows[0];
  if (!record) {
    throw new Error('Produto nao encontrado para atualizacao.');
  }

  return mapProductRecord(record);
};

export const deleteSaasProduct = async (params: {
  accessToken: string;
  companyId: string;
  productId: string;
}): Promise<void> => {
  const response = await fetch(
    buildUrl('products', {
      id: `eq.${params.productId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'DELETE',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};

export const registerSaasStockEntry = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  itemId: string;
  quantity: number;
  cost: number;
  entryId: string;
}): Promise<{ duplicated: boolean; updatedStock: StockItem[] }> => {
  const existingMovementResponse = await fetch(
    buildUrl('inventory_movements', {
      select: 'id',
      company_id: `eq.${params.companyId}`,
      movement_key: `eq.${params.entryId}`,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!existingMovementResponse.ok) {
    throw new Error(await parseErrorMessage(existingMovementResponse));
  }

  const existingMovements = (await existingMovementResponse.json()) as Array<Pick<InventoryMovementRecord, 'id'>>;
  if (existingMovements[0]) {
    return {
      duplicated: true,
      updatedStock: await listSaasProducts(params.accessToken),
    };
  }

  const currentProductsResponse = await fetch(
    buildUrl('products', {
      select: PRODUCTS_SELECT_FIELDS,
      id: `eq.${params.itemId}`,
      company_id: `eq.${params.companyId}`,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!currentProductsResponse.ok) {
    throw new Error(await parseErrorMessage(currentProductsResponse));
  }

  const currentProducts = (await currentProductsResponse.json()) as ProductRecord[];
  const currentProduct = currentProducts[0];
  if (!currentProduct) {
    throw new Error('Produto nao encontrado no estoque SaaS.');
  }

  const nextQuantity = toNumber(currentProduct.stock_quantity) + params.quantity;

  const updatedProductResponse = await fetch(
    buildUrl('products', {
      select: PRODUCTS_SELECT_FIELDS,
      id: `eq.${params.itemId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        stock_quantity: nextQuantity,
        cost_price: params.cost,
      }),
      cache: 'no-store',
    }
  );

  if (!updatedProductResponse.ok) {
    throw new Error(await parseErrorMessage(updatedProductResponse));
  }

  const movementResponse = await fetch(
    buildUrl('inventory_movements', { select: 'id' }),
    {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        company_id: params.companyId,
        product_id: params.itemId,
        movement_key: params.entryId,
        movement_type: 'stock_entry',
        quantity_delta: params.quantity,
        unit_cost: params.cost,
        stock_balance_after: nextQuantity,
        reference_type: 'manual_stock_entry',
        reference_id: params.entryId,
        notes: `Entrada manual de estoque - ${currentProduct.name}`,
        metadata: {},
        created_by_user_id: params.authUserId,
      }),
      cache: 'no-store',
    }
  );

  if (!movementResponse.ok) {
    throw new Error(await parseErrorMessage(movementResponse));
  }

  return {
    duplicated: false,
    updatedStock: await listSaasProducts(params.accessToken),
  };
};
