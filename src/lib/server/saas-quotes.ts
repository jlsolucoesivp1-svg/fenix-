import type { Quote, SaleItem } from '@/types';
import type { QuoteItemRecord, QuoteRecord } from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const QUOTES_SELECT_FIELDS =
  'id,company_id,quote_date,quote_time,user_display_name,subtotal,discount_value,total_value,observations,customer_id,customer_name,status,valid_until';
const QUOTE_ITEMS_SELECT_FIELDS =
  'id,company_id,quote_id,item_ref,description,quantity,unit_price,total_price';

const buildUrl = (table: 'quotes' | 'quote_items', params: Record<string, string>) => {
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

const mapQuoteItem = (record: QuoteItemRecord): SaleItem => ({
  id: record.item_ref || record.id,
  name: record.description,
  quantity: toNumber(record.quantity),
  price: toNumber(record.unit_price),
});

const mapQuoteRecord = (record: QuoteRecord, items: QuoteItemRecord[]): Quote => {
  const quoteItems = items
    .filter((item) => item.quote_id === record.id)
    .map(mapQuoteItem);
  const validUntil = record.valid_until;
  const quoteDate = record.quote_date;
  const startDate = new Date(`${quoteDate}T00:00:00`);
  const endDate = new Date(`${validUntil}T00:00:00`);
  const diffInDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const validityDays = Number.isFinite(diffInDays) && diffInDays > 0 ? diffInDays : 3;

  return {
    id: record.id,
    date: quoteDate,
    time: record.quote_time,
    user: record.user_display_name,
    items: quoteItems,
    subtotal: toNumber(record.subtotal),
    discount: toNumber(record.discount_value),
    total: toNumber(record.total_value),
    observations: record.observations || '',
    customerId: record.customer_id || undefined,
    customerName: record.customer_name || undefined,
    status: record.status,
    validUntil,
    data_vencimento: validUntil,
    validityDays,
    dias_validade: validityDays,
  };
};

const mapQuoteInput = (params: { companyId: string; quote: Quote }) => ({
  id: params.quote.id,
  company_id: params.companyId,
  quote_date: params.quote.date,
  quote_time: params.quote.time,
  user_display_name: params.quote.user,
  subtotal: params.quote.subtotal,
  discount_value: params.quote.discount,
  total_value: params.quote.total,
  observations: normalizeOptionalText(params.quote.observations),
  customer_id: normalizeOptionalText(params.quote.customerId),
  customer_name: normalizeOptionalText(params.quote.customerName),
  status: params.quote.status,
  valid_until: params.quote.validUntil,
});

const mapQuoteItemsInput = (params: { companyId: string; quote: Quote }) =>
  params.quote.items.map((item, index) => ({
    id: `QUOTE-ITEM-${params.quote.id}-${index + 1}`,
    company_id: params.companyId,
    quote_id: params.quote.id,
    item_ref: normalizeOptionalText(item.id),
    description: item.name.trim(),
    quantity: toNumber(item.quantity),
    unit_price: toNumber(item.price),
    total_price: toNumber(item.quantity) * toNumber(item.price),
  }));

export const listSaasQuotes = async (accessToken: string): Promise<Quote[]> => {
  const [quotesResponse, quoteItemsResponse] = await Promise.all([
    fetch(
      buildUrl('quotes', {
        select: QUOTES_SELECT_FIELDS,
        order: 'quote_date.desc,quote_time.desc',
      }),
      {
        method: 'GET',
        headers: buildHeaders(accessToken),
        cache: 'no-store',
      }
    ),
    fetch(
      buildUrl('quote_items', {
        select: QUOTE_ITEMS_SELECT_FIELDS,
        order: 'quote_id.asc,id.asc',
      }),
      {
        method: 'GET',
        headers: buildHeaders(accessToken),
        cache: 'no-store',
      }
    ),
  ]);

  if (!quotesResponse.ok) {
    throw new Error(await parseErrorMessage(quotesResponse));
  }
  if (!quoteItemsResponse.ok) {
    throw new Error(await parseErrorMessage(quoteItemsResponse));
  }

  const quoteRows = (await quotesResponse.json()) as QuoteRecord[];
  const quoteItemRows = (await quoteItemsResponse.json()) as QuoteItemRecord[];

  return quoteRows.map((record) => mapQuoteRecord(record, quoteItemRows));
};

export const upsertSaasQuote = async (params: {
  accessToken: string;
  companyId: string;
  quote: Quote;
}): Promise<Quote> => {
  const quoteResponse = await fetch(
    buildUrl('quotes', {
      select: QUOTES_SELECT_FIELDS,
      id: `eq.${params.quote.id}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(mapQuoteInput(params)),
      cache: 'no-store',
    }
  );

  if (!quoteResponse.ok) {
    throw new Error(await parseErrorMessage(quoteResponse));
  }

  const existingQuoteRows = (await quoteResponse.json()) as QuoteRecord[];
  if (!existingQuoteRows[0]) {
    const insertResponse = await fetch(
      buildUrl('quotes', { select: QUOTES_SELECT_FIELDS }),
      {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(mapQuoteInput(params)),
        cache: 'no-store',
      }
    );

    if (!insertResponse.ok) {
      throw new Error(await parseErrorMessage(insertResponse));
    }
  }

  const deleteItemsResponse = await fetch(
    buildUrl('quote_items', {
      quote_id: `eq.${params.quote.id}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'DELETE',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!deleteItemsResponse.ok) {
    throw new Error(await parseErrorMessage(deleteItemsResponse));
  }

  const quoteItemsPayload = mapQuoteItemsInput(params);
  if (quoteItemsPayload.length > 0) {
    const insertItemsResponse = await fetch(
      buildUrl('quote_items', { select: 'id' }),
      {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(quoteItemsPayload),
        cache: 'no-store',
      }
    );

    if (!insertItemsResponse.ok) {
      throw new Error(await parseErrorMessage(insertItemsResponse));
    }
  }

  return params.quote;
};

export const deleteSaasQuote = async (params: {
  accessToken: string;
  companyId: string;
  quoteId: string;
}): Promise<void> => {
  const deleteItemsResponse = await fetch(
    buildUrl('quote_items', {
      quote_id: `eq.${params.quoteId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'DELETE',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!deleteItemsResponse.ok) {
    throw new Error(await parseErrorMessage(deleteItemsResponse));
  }

  const deleteQuoteResponse = await fetch(
    buildUrl('quotes', {
      id: `eq.${params.quoteId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'DELETE',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!deleteQuoteResponse.ok) {
    throw new Error(await parseErrorMessage(deleteQuoteResponse));
  }
};
