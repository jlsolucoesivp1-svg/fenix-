import type { FinancialTransaction, Sale } from '@/types';
import type { FinancialEntryRecord, SaleItemRecord, SaleRecord } from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const FINANCIAL_ENTRIES_SELECT_FIELDS =
  'id,company_id,entry_type,description,amount,transaction_date,due_date,status,category,payment_method,related_sale_id,related_service_order_id,related_stock_entry_key,origin,created_by_user_id,metadata,created_at,updated_at';
const SALES_SELECT_FIELDS =
  'id,company_id,sale_date,sale_time,user_display_name,subtotal,discount_value,total_value,payment_method,observations,customer_id,customer_name,related_quote_id,status,reversal_reason,created_at,updated_at';
const SALE_ITEMS_SELECT_FIELDS =
  'id,company_id,sale_id,legacy_item_id,product_id,item_name,quantity,unit_price,line_total,created_at';

const buildUrl = (
  table: 'financial_entries' | 'sales' | 'sale_items',
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

const toNumber = (value: number | string | null | undefined) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

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

const mapSaleRecord = (record: SaleRecord, items: SaleItemRecord[]): Sale => ({
  id: record.id,
  date: record.sale_date,
  time: record.sale_time,
  user: record.user_display_name,
  items: items
    .filter((item) => item.sale_id === record.id)
    .map((item) => ({
      id: item.product_id || item.legacy_item_id || String(item.id),
      name: item.item_name,
      quantity: toNumber(item.quantity),
      price: toNumber(item.unit_price),
    })),
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

export const listSaasFinancialOverview = async (accessToken: string): Promise<{
  transactions: FinancialTransaction[];
  sales: Sale[];
}> => {
  const [financialResponse, salesResponse, saleItemsResponse] = await Promise.all([
    fetch(
      buildUrl('financial_entries', {
        select: FINANCIAL_ENTRIES_SELECT_FIELDS,
        order: 'transaction_date.desc,created_at.desc',
      }),
      {
        method: 'GET',
        headers: buildHeaders(accessToken),
        cache: 'no-store',
      }
    ),
    fetch(
      buildUrl('sales', {
        select: SALES_SELECT_FIELDS,
        order: 'sale_date.desc,sale_time.desc',
      }),
      {
        method: 'GET',
        headers: buildHeaders(accessToken),
        cache: 'no-store',
      }
    ),
    fetch(
      buildUrl('sale_items', {
        select: SALE_ITEMS_SELECT_FIELDS,
        order: 'sale_id.asc,id.asc',
      }),
      {
        method: 'GET',
        headers: buildHeaders(accessToken),
        cache: 'no-store',
      }
    ),
  ]);

  if (!financialResponse.ok) {
    throw new Error(await parseErrorMessage(financialResponse));
  }
  if (!salesResponse.ok) {
    throw new Error(await parseErrorMessage(salesResponse));
  }
  if (!saleItemsResponse.ok) {
    throw new Error(await parseErrorMessage(saleItemsResponse));
  }

  const financialRows = (await financialResponse.json()) as FinancialEntryRecord[];
  const salesRows = (await salesResponse.json()) as SaleRecord[];
  const saleItemRows = (await saleItemsResponse.json()) as SaleItemRecord[];

  return {
    transactions: financialRows.map(mapFinancialEntryRecord),
    sales: salesRows.map((record) => mapSaleRecord(record, saleItemRows)),
  };
};

export const markSaasFinancialTransactionPaid = async (params: {
  accessToken: string;
  companyId: string;
  transactionId: string;
}): Promise<{ duplicated: boolean; transaction: FinancialTransaction }> => {
  const transactionResponse = await fetch(
    buildUrl('financial_entries', {
      select: FINANCIAL_ENTRIES_SELECT_FIELDS,
      id: `eq.${params.transactionId}`,
      company_id: `eq.${params.companyId}`,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!transactionResponse.ok) {
    throw new Error(await parseErrorMessage(transactionResponse));
  }

  const transactionRows = (await transactionResponse.json()) as FinancialEntryRecord[];
  const currentTransaction = transactionRows[0];
  if (!currentTransaction) {
    throw new Error('Transacao nao encontrada.');
  }

  if (currentTransaction.status === 'pago') {
    return {
      duplicated: true,
      transaction: mapFinancialEntryRecord(currentTransaction),
    };
  }

  const paymentDate = new Date().toISOString().split('T')[0];
  const updateResponse = await fetch(
    buildUrl('financial_entries', {
      select: FINANCIAL_ENTRIES_SELECT_FIELDS,
      id: `eq.${params.transactionId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        status: 'pago',
        transaction_date: paymentDate,
      }),
      cache: 'no-store',
    }
  );

  if (!updateResponse.ok) {
    throw new Error(await parseErrorMessage(updateResponse));
  }

  const updatedRows = (await updateResponse.json()) as FinancialEntryRecord[];
  const updatedTransaction = updatedRows[0];
  if (!updatedTransaction) {
    throw new Error('Falha ao atualizar a transacao.');
  }

  return {
    duplicated: false,
    transaction: mapFinancialEntryRecord(updatedTransaction),
  };
};

export const createSaasManualFinancialTransaction = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  transaction: Omit<FinancialTransaction, 'id' | 'relatedSaleId' | 'relatedServiceOrderId'>;
}): Promise<FinancialTransaction> => {
  const newTransaction: FinancialTransaction = {
    ...params.transaction,
    id: `FIN-${Date.now()}`,
  };

  const response = await fetch(
    buildUrl('financial_entries', { select: FINANCIAL_ENTRIES_SELECT_FIELDS }),
    {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        id: newTransaction.id,
        company_id: params.companyId,
        entry_type: newTransaction.type,
        description: newTransaction.description,
        amount: newTransaction.amount,
        transaction_date: newTransaction.date,
        due_date: newTransaction.dueDate || null,
        status: newTransaction.status || 'pago',
        category: newTransaction.category,
        payment_method: newTransaction.paymentMethod,
        related_sale_id: null,
        related_service_order_id: null,
        related_stock_entry_key: newTransaction.relatedStockEntryId || null,
        origin: newTransaction.origin || 'manual',
        created_by_user_id: params.authUserId,
        metadata: {},
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as FinancialEntryRecord[];
  const createdRecord = rows[0];
  if (!createdRecord) {
    throw new Error('Lancamento financeiro criado sem retorno da API.');
  }

  return mapFinancialEntryRecord(createdRecord);
};

export const deleteSaasFinancialTransaction = async (params: {
  accessToken: string;
  companyId: string;
  transactionId: string;
}): Promise<void> => {
  const response = await fetch(
    buildUrl('financial_entries', {
      id: `eq.${params.transactionId}`,
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
