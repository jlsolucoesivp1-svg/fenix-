import type { StockItem } from '@/types';
import type { FinancialEntryRecord, InventoryMovementRecord, ProductRecord } from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const PRODUCTS_SELECT_FIELDS =
  'id,company_id,name,description,category,stock_quantity,sale_price,cost_price,min_stock_quantity,barcode,unit_name,is_active';
const FINANCIAL_ENTRY_SELECT_FIELDS =
  'id,company_id,entry_type,description,amount,transaction_date,due_date,status,category,payment_method,related_sale_id,related_service_order_id,related_stock_entry_key,origin,created_by_user_id,metadata,created_at,updated_at';

const buildUrl = (table: 'products' | 'inventory_movements' | 'financial_entries', params: Record<string, string>) => {
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

export const searchSaasProducts = async (accessToken: string, companyId: string, query: string, limit: number): Promise<StockItem[]> => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  const safeLimit = String(Math.min(Math.max(limit, 1), 15));
  const response = await fetch(
    buildUrl('products', {
      select: PRODUCTS_SELECT_FIELDS,
      company_id: `eq.${companyId}`,
      is_active: 'eq.true',
      or: `(name.ilike.*${trimmedQuery}*,category.ilike.*${trimmedQuery}*,barcode.ilike.*${trimmedQuery}*)`,
      order: 'name.asc',
      limit: safeLimit,
    }),
    { method: 'GET', headers: buildHeaders(accessToken), cache: 'no-store' }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));
  return ((await response.json()) as ProductRecord[]).map(mapProductRecord);
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
      select: 'id,product_id,quantity_delta,unit_cost,created_at',
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

  const existingMovements = (await existingMovementResponse.json()) as Array<
    Pick<InventoryMovementRecord, 'id' | 'product_id' | 'quantity_delta' | 'unit_cost' | 'created_at'>
  >;
  const existingMovement = existingMovements[0];
  if (existingMovement) {
    const existingFinancialResponse = await fetch(
      buildUrl('financial_entries', {
        select: 'id',
        company_id: `eq.${params.companyId}`,
        related_stock_entry_key: `eq.${params.entryId}`,
        limit: '1',
      }),
      {
        method: 'GET',
        headers: buildHeaders(params.accessToken),
        cache: 'no-store',
      }
    );

    if (!existingFinancialResponse.ok) {
      throw new Error(await parseErrorMessage(existingFinancialResponse));
    }

    const existingFinancialEntries = (await existingFinancialResponse.json()) as Array<Pick<FinancialEntryRecord, 'id'>>;
    if (!existingFinancialEntries[0]) {
      const productResponse = await fetch(
        buildUrl('products', {
          select: 'id,name',
          id: `eq.${existingMovement.product_id}`,
          company_id: `eq.${params.companyId}`,
          limit: '1',
        }),
        {
          method: 'GET',
          headers: buildHeaders(params.accessToken),
          cache: 'no-store',
        }
      );

      if (!productResponse.ok) {
        throw new Error(await parseErrorMessage(productResponse));
      }

      const products = (await productResponse.json()) as Array<Pick<ProductRecord, 'id' | 'name'>>;
      const product = products[0];
      if (!product) {
        throw new Error('Produto da entrada de estoque existente nao foi encontrado.');
      }

      const unitCost = toNumber(existingMovement.unit_cost);
      const financialEntryPayload = {
        id: `FIN-STOCK-${params.entryId}`,
        company_id: params.companyId,
        entry_type: 'despesa',
        description: `Compra de estoque - ${product.name}`,
        amount: Number((toNumber(existingMovement.quantity_delta) * unitCost).toFixed(2)),
        transaction_date: existingMovement.created_at.split('T')[0],
        due_date: null,
        status: 'pago',
        category: 'Compra de Mercadoria',
        payment_method: 'Pendente',
        related_sale_id: null,
        related_service_order_id: null,
        related_stock_entry_key: params.entryId,
        origin: 'stock-entry',
        created_by_user_id: params.authUserId,
        metadata: {
          product_id: existingMovement.product_id,
          inventory_movement_key: params.entryId,
          quantity: toNumber(existingMovement.quantity_delta),
          unit_cost: unitCost,
        },
      };
      console.info('[stock-entry] financial_entries POST payload', financialEntryPayload);
      const financialEntryResponse = await fetch(
        buildUrl('financial_entries', { select: 'id' }),
        {
          method: 'POST',
          headers: buildHeaders(params.accessToken, true),
          body: JSON.stringify(financialEntryPayload),
          cache: 'no-store',
        }
      );

      const financialEntryResponseBody = await financialEntryResponse.clone().text();
      console.info('[stock-entry] financial_entries POST response', {
        status: financialEntryResponse.status,
        body: financialEntryResponseBody,
      });

      if (!financialEntryResponse.ok) {
        console.error('[stock-entry] financial_entries POST failed', {
          status: financialEntryResponse.status,
          body: financialEntryResponseBody,
        });
        throw new Error(await parseErrorMessage(financialEntryResponse));
      }
    }

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

  const totalCost = Number((params.quantity * params.cost).toFixed(2));
  const financialEntryPayload = {
    id: `FIN-STOCK-${params.entryId}`,
    company_id: params.companyId,
    entry_type: 'despesa',
    description: `Compra de estoque - ${currentProduct.name}`,
    amount: totalCost,
    transaction_date: new Date().toISOString().split('T')[0],
    due_date: null,
    status: 'pago',
    category: 'Compra de Mercadoria',
    payment_method: 'Pendente',
    related_sale_id: null,
    related_service_order_id: null,
    related_stock_entry_key: params.entryId,
    origin: 'stock-entry',
    created_by_user_id: params.authUserId,
    metadata: {
      product_id: params.itemId,
      inventory_movement_key: params.entryId,
      quantity: params.quantity,
      unit_cost: params.cost,
    },
  };
  console.info('[stock-entry] financial_entries POST payload', financialEntryPayload);
  const financialEntryResponse = await fetch(
    buildUrl('financial_entries', { select: FINANCIAL_ENTRY_SELECT_FIELDS }),
    {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(financialEntryPayload),
      cache: 'no-store',
    }
  );

  const financialEntryResponseBody = await financialEntryResponse.clone().text();
  console.info('[stock-entry] financial_entries POST response', {
    status: financialEntryResponse.status,
    body: financialEntryResponseBody,
  });

  if (!financialEntryResponse.ok) {
    console.error('[stock-entry] financial_entries POST failed', {
      status: financialEntryResponse.status,
      body: financialEntryResponseBody,
    });
    throw new Error(await parseErrorMessage(financialEntryResponse));
  }

  return {
    duplicated: false,
    updatedStock: await listSaasProducts(params.accessToken),
  };
};
