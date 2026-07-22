import type { FinancialTransaction, Sale, SaleItem, StockItem } from '@/types';
import type {
  FinancialEntryRecord,
  InventoryMovementRecord,
  ProductRecord,
  QuoteRecord,
  SaleItemRecord,
  SaleRecord,
} from '@/types/saas';
import { applySaleToStock, buildSaleFinancialTransactions, buildSaleRecord, sanitizeSaleItems } from '@/lib/sales';
import { getSupabaseUserConfig } from './supabase-user';
import { listSaasProducts } from './saas-products';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const SALES_SELECT_FIELDS =
  'id,company_id,sale_date,sale_time,user_display_name,subtotal,discount_value,total_value,payment_method,observations,customer_id,customer_name,related_quote_id,status,reversal_reason,created_at,updated_at';
const SALE_ITEMS_SELECT_FIELDS =
  'id,company_id,sale_id,legacy_item_id,product_id,item_name,quantity,unit_price,line_total,created_at';
const FINANCIAL_ENTRIES_SELECT_FIELDS =
  'id,company_id,entry_type,description,amount,transaction_date,due_date,status,category,payment_method,related_sale_id,related_service_order_id,related_stock_entry_key,origin,created_by_user_id,metadata,created_at,updated_at';
const PRODUCTS_SELECT_FIELDS =
  'id,company_id,name,description,category,stock_quantity,sale_price,cost_price,min_stock_quantity,barcode,unit_name,is_active';

const buildUrl = (
  table: 'sales' | 'sale_items' | 'financial_entries' | 'products' | 'inventory_movements' | 'quotes',
  params: Record<string, string>
) => {
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

const mapSaleItem = (record: SaleItemRecord): SaleItem => ({
  id: record.product_id || record.legacy_item_id || String(record.id),
  name: record.item_name,
  quantity: toNumber(record.quantity),
  price: toNumber(record.unit_price),
});

const mapSaleRecord = (record: SaleRecord, items: SaleItemRecord[]): Sale => ({
  id: record.id,
  date: record.sale_date,
  time: record.sale_time,
  user: record.user_display_name,
  items: items.filter((item) => item.sale_id === record.id).map(mapSaleItem),
  subtotal: toNumber(record.subtotal),
  discount: toNumber(record.discount_value),
  total: toNumber(record.total_value),
  paymentMethod: record.payment_method,
  observations: record.observations || '',
  customerId: record.customer_id || undefined,
  customerName: record.customer_name || undefined,
  relatedQuoteId: record.related_quote_id || undefined,
  status: record.status,
  reversalReason: record.reversal_reason || undefined,
});

const mapFinancialEntryRecord = (record: FinancialEntryRecord): FinancialTransaction => ({
  id: record.id,
  type: record.entry_type,
  description: record.description,
  amount: toNumber(record.amount),
  date: record.transaction_date,
  dueDate: record.due_date || undefined,
  status: record.status,
  category: record.category as FinancialTransaction['category'],
  paymentMethod: record.payment_method,
  relatedSaleId: record.related_sale_id || undefined,
  relatedServiceOrderId: record.related_service_order_id || undefined,
  relatedStockEntryId: record.related_stock_entry_key || undefined,
  origin: (record.origin as FinancialTransaction['origin']) || undefined,
});

const mapSaleInput = (params: { companyId: string; sale: Sale }) => ({
  id: params.sale.id,
  company_id: params.companyId,
  sale_date: params.sale.date,
  sale_time: params.sale.time,
  user_display_name: params.sale.user,
  subtotal: params.sale.subtotal,
  discount_value: params.sale.discount,
  total_value: params.sale.total,
  payment_method: params.sale.paymentMethod,
  observations: normalizeOptionalText(params.sale.observations),
  customer_id: normalizeOptionalText(params.sale.customerId),
  customer_name: normalizeOptionalText(params.sale.customerName),
  related_quote_id: normalizeOptionalText(params.sale.relatedQuoteId),
  status: params.sale.status || 'Finalizada',
  reversal_reason: normalizeOptionalText(params.sale.reversalReason),
});

const mapSaleItemsInput = (params: { companyId: string; sale: Sale }) =>
  params.sale.items.map((item) => ({
    company_id: params.companyId,
    sale_id: params.sale.id,
    legacy_item_id: normalizeOptionalText(item.id),
    product_id: item.id?.startsWith('PROD-') ? item.id : null,
    item_name: item.name.trim(),
    quantity: toNumber(item.quantity),
    unit_price: toNumber(item.price),
    line_total: toNumber(item.quantity) * toNumber(item.price),
  }));

const mapFinancialEntriesInput = (params: {
  companyId: string;
  authUserId: string | null;
  entries: FinancialTransaction[];
}) =>
  params.entries.map((entry) => ({
    id: entry.id,
    company_id: params.companyId,
    entry_type: entry.type,
    description: entry.description,
    amount: entry.amount,
    transaction_date: entry.date,
    due_date: entry.dueDate || null,
    status: entry.status || 'pago',
    category: entry.category,
    payment_method: entry.paymentMethod,
    related_sale_id: entry.relatedSaleId || null,
    related_service_order_id: entry.relatedServiceOrderId || null,
    related_stock_entry_key: entry.relatedStockEntryId || null,
    origin: entry.origin || null,
    created_by_user_id: params.authUserId,
    metadata: {},
  }));

const mapInventoryMovementsInput = (params: {
  companyId: string;
  authUserId: string | null;
  sale: Sale;
  stockAfter: StockItem[];
  movementType: 'sale' | 'sale_reversal';
}) =>
  params.sale.items
    .filter((item) => item.id?.startsWith('PROD-'))
    .map((item) => {
      const product = params.stockAfter.find((entry) => entry.id === item.id);
      const quantityDelta = params.movementType === 'sale' ? -Math.abs(item.quantity) : Math.abs(item.quantity);

      return {
        company_id: params.companyId,
        product_id: item.id,
        movement_key: `${params.sale.id}:${params.movementType}:${item.id}`,
        movement_type: params.movementType,
        quantity_delta: quantityDelta,
        unit_cost: null,
        unit_price: item.price,
        stock_balance_after: product?.quantity ?? null,
        reference_type: 'sale',
        reference_id: params.sale.id,
        notes:
          params.movementType === 'sale'
            ? `Baixa por venda - ${params.sale.id}`
            : `Estorno de venda - ${params.sale.id}`,
        metadata: {
          saleId: params.sale.id,
          relatedQuoteId: params.sale.relatedQuoteId || null,
        },
        created_by_user_id: params.authUserId,
      };
    });

const updateRelatedQuoteStatus = async (params: {
  accessToken: string;
  companyId: string;
  quoteId: string | undefined;
  status: QuoteRecord['status'];
}) => {
  if (!params.quoteId) {
    return;
  }

  const response = await fetch(
    buildUrl('quotes', {
      select: 'id,status',
      id: `eq.${params.quoteId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({ status: params.status }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};

export const finalizeSaasSale = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  saleId: string;
  items: SaleItem[];
  discount: number;
  paymentMethod: string;
  observations?: string;
  customerId?: string;
  customerName?: string;
  userName?: string;
  relatedQuoteId?: string;
  installments?: {
    enabled: boolean;
    count: number;
    firstDueDate?: string;
  };
}): Promise<{ duplicated: boolean; sale: Sale; stock: StockItem[]; transactions: FinancialTransaction[] }> => {
  const existingSaleResponse = await fetch(
    buildUrl('sales', {
      select: SALES_SELECT_FIELDS,
      id: `eq.${params.saleId}`,
      company_id: `eq.${params.companyId}`,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!existingSaleResponse.ok) {
    throw new Error(await parseErrorMessage(existingSaleResponse));
  }

  const existingSales = (await existingSaleResponse.json()) as SaleRecord[];
  if (existingSales[0]) {
    const [existingItemsResponse, existingTransactionsResponse, stock] = await Promise.all([
      fetch(
        buildUrl('sale_items', {
          select: SALE_ITEMS_SELECT_FIELDS,
          sale_id: `eq.${params.saleId}`,
          company_id: `eq.${params.companyId}`,
        }),
        {
          method: 'GET',
          headers: buildHeaders(params.accessToken),
          cache: 'no-store',
        }
      ),
      fetch(
        buildUrl('financial_entries', {
          select: FINANCIAL_ENTRIES_SELECT_FIELDS,
          related_sale_id: `eq.${params.saleId}`,
          company_id: `eq.${params.companyId}`,
        }),
        {
          method: 'GET',
          headers: buildHeaders(params.accessToken),
          cache: 'no-store',
        }
      ),
      listSaasProducts(params.accessToken),
    ]);

    if (!existingItemsResponse.ok) {
      throw new Error(await parseErrorMessage(existingItemsResponse));
    }
    if (!existingTransactionsResponse.ok) {
      throw new Error(await parseErrorMessage(existingTransactionsResponse));
    }

    const existingItems = (await existingItemsResponse.json()) as SaleItemRecord[];
    const existingTransactions = (await existingTransactionsResponse.json()) as FinancialEntryRecord[];
    return {
      duplicated: true,
      sale: mapSaleRecord(existingSales[0], existingItems),
      stock,
      transactions: existingTransactions.map(mapFinancialEntryRecord),
    };
  }

  const sanitizedItems = sanitizeSaleItems(params.items);
  const currentStock = await listSaasProducts(params.accessToken);
  const updatedStock = applySaleToStock(currentStock, sanitizedItems);
  const sale = buildSaleRecord({
    saleId: params.saleId,
    items: sanitizedItems,
    discount: params.discount,
    paymentMethod: params.paymentMethod,
    observations: params.observations,
    customerId: params.customerId,
    customerName: params.customerName,
    userName: params.userName,
  });
  sale.relatedQuoteId = params.relatedQuoteId;
  sale.status = 'Finalizada';

  const newTransactions = buildSaleFinancialTransactions({
    sale,
    paymentMethod: params.paymentMethod,
    installments: params.installments?.enabled ? params.installments : undefined,
  });

  const touchedStockItems = updatedStock.filter((item) =>
    sanitizedItems.some((saleItem) => saleItem.id === item.id && saleItem.id?.startsWith('PROD-'))
  );

  for (const stockItem of touchedStockItems) {
    const response = await fetch(
      buildUrl('products', {
        select: PRODUCTS_SELECT_FIELDS,
        id: `eq.${stockItem.id}`,
        company_id: `eq.${params.companyId}`,
      }),
      {
        method: 'PATCH',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify({ stock_quantity: stockItem.quantity }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }
  }

  const saleResponse = await fetch(
    buildUrl('sales', { select: SALES_SELECT_FIELDS }),
    {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(mapSaleInput({ companyId: params.companyId, sale })),
      cache: 'no-store',
    }
  );

  if (!saleResponse.ok) {
    throw new Error(await parseErrorMessage(saleResponse));
  }

  const saleItemsPayload = mapSaleItemsInput({ companyId: params.companyId, sale });
  if (saleItemsPayload.length > 0) {
    const saleItemsResponse = await fetch(
      buildUrl('sale_items', { select: 'id' }),
      {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(saleItemsPayload),
        cache: 'no-store',
      }
    );

    if (!saleItemsResponse.ok) {
      throw new Error(await parseErrorMessage(saleItemsResponse));
    }
  }

  const financialEntriesPayload = mapFinancialEntriesInput({
    companyId: params.companyId,
    authUserId: params.authUserId,
    entries: newTransactions,
  });
  if (financialEntriesPayload.length > 0) {
    const financialEntriesResponse = await fetch(
      buildUrl('financial_entries', { select: 'id' }),
      {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(financialEntriesPayload),
        cache: 'no-store',
      }
    );

    if (!financialEntriesResponse.ok) {
      throw new Error(await parseErrorMessage(financialEntriesResponse));
    }
  }

  const inventoryMovementsPayload = mapInventoryMovementsInput({
    companyId: params.companyId,
    authUserId: params.authUserId,
    sale,
    stockAfter: updatedStock,
    movementType: 'sale',
  });
  if (inventoryMovementsPayload.length > 0) {
    const inventoryResponse = await fetch(
      buildUrl('inventory_movements', { select: 'id' }),
      {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(inventoryMovementsPayload),
        cache: 'no-store',
      }
    );

    if (!inventoryResponse.ok) {
      throw new Error(await parseErrorMessage(inventoryResponse));
    }
  }

  await updateRelatedQuoteStatus({
    accessToken: params.accessToken,
    companyId: params.companyId,
    quoteId: params.relatedQuoteId,
    status: 'Vendido',
  });

  return {
    duplicated: false,
    sale,
    stock: updatedStock,
    transactions: newTransactions,
  };
};

export const reverseSaasSale = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  saleId: string;
  reason: string;
}): Promise<{ duplicated: boolean; sale: Sale; stock: StockItem[]; transactions: FinancialTransaction[] }> => {
  const [saleResponse, saleItemsResponse, financialEntriesResponse, stock] = await Promise.all([
    fetch(
      buildUrl('sales', {
        select: SALES_SELECT_FIELDS,
        id: `eq.${params.saleId}`,
        company_id: `eq.${params.companyId}`,
        limit: '1',
      }),
      {
        method: 'GET',
        headers: buildHeaders(params.accessToken),
        cache: 'no-store',
      }
    ),
    fetch(
      buildUrl('sale_items', {
        select: SALE_ITEMS_SELECT_FIELDS,
        sale_id: `eq.${params.saleId}`,
        company_id: `eq.${params.companyId}`,
      }),
      {
        method: 'GET',
        headers: buildHeaders(params.accessToken),
        cache: 'no-store',
      }
    ),
    fetch(
      buildUrl('financial_entries', {
        select: FINANCIAL_ENTRIES_SELECT_FIELDS,
        related_sale_id: `eq.${params.saleId}`,
        company_id: `eq.${params.companyId}`,
      }),
      {
        method: 'GET',
        headers: buildHeaders(params.accessToken),
        cache: 'no-store',
      }
    ),
    listSaasProducts(params.accessToken),
  ]);

  if (!saleResponse.ok) {
    throw new Error(await parseErrorMessage(saleResponse));
  }
  if (!saleItemsResponse.ok) {
    throw new Error(await parseErrorMessage(saleItemsResponse));
  }
  if (!financialEntriesResponse.ok) {
    throw new Error(await parseErrorMessage(financialEntriesResponse));
  }

  const saleRows = (await saleResponse.json()) as SaleRecord[];
  const saleItemRows = (await saleItemsResponse.json()) as SaleItemRecord[];
  const financialEntryRows = (await financialEntriesResponse.json()) as FinancialEntryRecord[];
  const saleRow = saleRows[0];
  if (!saleRow) {
    throw new Error('Venda nao encontrada.');
  }

  const sale = mapSaleRecord(saleRow, saleItemRows);
  if (sale.status === 'Estornada') {
    return {
      duplicated: true,
      sale,
      stock,
      transactions: financialEntryRows.map(mapFinancialEntryRecord),
    };
  }

  const updatedStock = [...stock];
  sale.items.forEach((item) => {
    if (item.id?.startsWith('PROD-')) {
      const index = updatedStock.findIndex((entry) => entry.id === item.id);
      if (index >= 0) {
        updatedStock[index] = {
          ...updatedStock[index],
          quantity: (updatedStock[index].quantity || 0) + item.quantity,
        };
      }
    }
  });

  for (const stockItem of updatedStock.filter((item) => sale.items.some((saleItem) => saleItem.id === item.id && saleItem.id?.startsWith('PROD-')))) {
    const response = await fetch(
      buildUrl('products', {
        select: PRODUCTS_SELECT_FIELDS,
        id: `eq.${stockItem.id}`,
        company_id: `eq.${params.companyId}`,
      }),
      {
        method: 'PATCH',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify({ stock_quantity: stockItem.quantity }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }
  }

  const reversedSale: Sale = {
    ...sale,
    status: 'Estornada',
    reversalReason: params.reason,
  };

  const updateSaleResponse = await fetch(
    buildUrl('sales', {
      select: SALES_SELECT_FIELDS,
      id: `eq.${params.saleId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        status: 'Estornada',
        reversal_reason: params.reason,
      }),
      cache: 'no-store',
    }
  );

  if (!updateSaleResponse.ok) {
    throw new Error(await parseErrorMessage(updateSaleResponse));
  }

  const reversedTransactions = financialEntryRows.map((entry) => ({
    ...mapFinancialEntryRecord(entry),
    status: 'Estornado' as const,
    category: 'Venda Estornada' as const,
    description: `[ESTORNADO] ${entry.description} | Motivo: ${params.reason}`,
  }));

  for (const transaction of reversedTransactions) {
    const response = await fetch(
      buildUrl('financial_entries', {
        select: FINANCIAL_ENTRIES_SELECT_FIELDS,
        id: `eq.${transaction.id}`,
        company_id: `eq.${params.companyId}`,
      }),
      {
        method: 'PATCH',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify({
          status: transaction.status,
          category: transaction.category,
          description: transaction.description,
        }),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }
  }

  const inventoryMovementsPayload = mapInventoryMovementsInput({
    companyId: params.companyId,
    authUserId: params.authUserId,
    sale: reversedSale,
    stockAfter: updatedStock,
    movementType: 'sale_reversal',
  });
  if (inventoryMovementsPayload.length > 0) {
    const inventoryResponse = await fetch(
      buildUrl('inventory_movements', { select: 'id' }),
      {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(inventoryMovementsPayload),
        cache: 'no-store',
      }
    );

    if (!inventoryResponse.ok) {
      throw new Error(await parseErrorMessage(inventoryResponse));
    }
  }

  await updateRelatedQuoteStatus({
    accessToken: params.accessToken,
    companyId: params.companyId,
    quoteId: reversedSale.relatedQuoteId,
    status: 'Aprovado',
  });

  return {
    duplicated: false,
    sale: reversedSale,
    stock: updatedStock,
    transactions: reversedTransactions,
  };
};
