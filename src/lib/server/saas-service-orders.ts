import type {
  FinancialTransaction,
  OSPayment,
  ServiceOrder,
  ServiceOrderItem,
  ServiceOrderViewMetadata,
  StockItem,
} from '@/types';
import type {
  FinancialEntryRecord,
  ProductRecord,
  ServiceOrderHistoryRecord,
  ServiceOrderItemRecord,
  ServiceOrderNoteRecord,
  ServiceOrderPaymentRecord,
  ServiceOrderRecord,
  ServiceOrderViewRecord,
} from '@/types/saas';
import { syncServiceOrderStock } from '@/lib/service-order-stock';
import { upsertServiceOrderFinalizationTransaction } from '@/lib/service-order-financial';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const SERVICE_ORDERS_SELECT_FIELDS =
  'id,company_id,customer_id,customer_name,equipment_summary,equipment_type,equipment_brand,equipment_model,serial_number,reported_issue,status_code,opened_at,delivered_at,attendant_name,payment_method,warranty_text,total_value,discount_value,final_value,accessories,technical_report,created_at,updated_at';
const SERVICE_ORDER_ITEMS_SELECT_FIELDS =
  'id,company_id,service_order_id,legacy_item_id,product_id,description,quantity,unit_price,item_type,created_at';
const SERVICE_ORDER_PAYMENTS_SELECT_FIELDS =
  'id,company_id,service_order_id,amount,paid_at,method,created_at';
const SERVICE_ORDER_NOTES_SELECT_FIELDS =
  'id,company_id,service_order_id,user_display_name,note_text,noted_at,created_at';
const SERVICE_ORDER_VIEWS_SELECT_FIELDS =
  'id,company_id,service_order_id,user_id,last_viewed_at,created_at,updated_at';
const PRODUCTS_SELECT_FIELDS =
  'id,company_id,name,description,category,stock_quantity,sale_price,cost_price,min_stock_quantity,barcode,unit_name,is_active';
const FINANCIAL_ENTRIES_SELECT_FIELDS =
  'id,company_id,entry_type,description,amount,transaction_date,due_date,status,category,payment_method,related_sale_id,related_service_order_id,related_stock_entry_key,origin,created_by_user_id,metadata,created_at,updated_at';

const buildUrl = (
  table:
    | 'service_orders'
    | 'service_order_items'
    | 'service_order_payments'
    | 'service_order_notes'
    | 'service_order_views'
    | 'service_order_history'
    | 'products'
    | 'financial_entries',
  params: Record<string, string>
) => {
  const { url } = getSupabaseUserConfig();
  const searchParams = new URLSearchParams(params);
  return `${url}/rest/v1/${table}?${searchParams.toString()}`;
};

const buildRpcUrl = (functionName: string) => {
  const { url } = getSupabaseUserConfig();
  return `${url}/rest/v1/rpc/${functionName}`;
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

const toDbStatus = (status: ServiceOrder['status']): ServiceOrderRecord['status_code'] => {
  switch (status) {
    case 'Em análise':
      return 'Em analise';
    case 'Aguardando peça':
      return 'Aguardando peca';
    default:
      return status as ServiceOrderRecord['status_code'];
  }
};

const toAppStatus = (status: ServiceOrderRecord['status_code']): ServiceOrder['status'] => {
  switch (status) {
    case 'Em analise':
      return 'Em análise';
    case 'Aguardando peca':
      return 'Aguardando peça';
    default:
      return status as ServiceOrder['status'];
  }
};

const mapServiceOrderItem = (record: ServiceOrderItemRecord): ServiceOrderItem => ({
  id: record.id,
  stockItemId: record.product_id || undefined,
  description: record.description,
  quantity: toNumber(record.quantity),
  unitPrice: toNumber(record.unit_price),
  type: record.item_type,
});

const mapServiceOrder = (params: {
  record: ServiceOrderRecord;
  items: ServiceOrderItemRecord[];
  payments: ServiceOrderPaymentRecord[];
  notes: ServiceOrderNoteRecord[];
}): ServiceOrder => ({
  id: params.record.id,
  customerName: params.record.customer_name,
  customerId: params.record.customer_id || undefined,
  equipment: params.record.equipment_summary,
  reportedProblem: params.record.reported_issue,
  status: toAppStatus(params.record.status_code),
  date: params.record.opened_at,
  deliveredDate: params.record.delivered_at || undefined,
  attendant: params.record.attendant_name,
  paymentMethod: params.record.payment_method as ServiceOrder['paymentMethod'],
  warranty: params.record.warranty_text || undefined,
  totalValue: toNumber(params.record.total_value),
  discount: toNumber(params.record.discount_value),
  finalValue: toNumber(params.record.final_value),
  items: params.items.filter((item) => item.service_order_id === params.record.id).map(mapServiceOrderItem),
  payments: params.payments
    .filter((payment) => payment.service_order_id === params.record.id)
    .map(
      (payment): OSPayment => ({
        id: payment.id,
        amount: toNumber(payment.amount),
        date: payment.paid_at,
        method: payment.method,
      })
    ),
  internalNotes: params.notes
    .filter((note) => note.service_order_id === params.record.id)
    .map((note) => ({
      user: note.user_display_name,
      date: note.noted_at,
      comment: note.note_text,
    })),
  technicalReport: params.record.technical_report || undefined,
  accessories: params.record.accessories || undefined,
  serialNumber: params.record.serial_number || undefined,
});

const mapServiceOrderInput = (params: { serviceOrder: ServiceOrder }) => {
  const equipmentText = typeof params.serviceOrder.equipment === 'string' ? params.serviceOrder.equipment : '';
  const equipmentParts = equipmentText.trim().split(/\s+/);
  const equipmentType = equipmentParts[0] || '';
  const equipmentBrand = equipmentParts[1] || '';
  const equipmentModel = equipmentParts.slice(2).join(' ') || '';

  return {
    customer_id: normalizeOptionalText(params.serviceOrder.customerId),
    customer_name: params.serviceOrder.customerName,
    equipment_summary: equipmentText,
    equipment_type: normalizeOptionalText(equipmentType),
    equipment_brand: normalizeOptionalText(equipmentBrand),
    equipment_model: normalizeOptionalText(equipmentModel),
    serial_number: normalizeOptionalText(params.serviceOrder.serialNumber),
    reported_issue: params.serviceOrder.reportedProblem,
    status_code: toDbStatus(params.serviceOrder.status),
    opened_at: params.serviceOrder.date,
    delivered_at: params.serviceOrder.deliveredDate || null,
    attendant_name: params.serviceOrder.attendant,
    payment_method: normalizeOptionalText(params.serviceOrder.paymentMethod),
    warranty_text: normalizeOptionalText(params.serviceOrder.warranty),
    total_value: params.serviceOrder.totalValue,
    discount_value: params.serviceOrder.discount || 0,
    final_value: params.serviceOrder.finalValue ?? params.serviceOrder.totalValue,
    accessories: normalizeOptionalText(params.serviceOrder.accessories),
    technical_report: normalizeOptionalText(params.serviceOrder.technicalReport),
  };
};

const createSaasServiceOrder = async (params: {
  accessToken: string;
  serviceOrder: ServiceOrder;
}): Promise<ServiceOrderRecord> => {
  const response = await fetch(buildRpcUrl('create_saas_service_order'), {
    method: 'POST',
    headers: buildHeaders(params.accessToken, true),
    // A funcao ignora id e company_id: ambos sao definidos no PostgreSQL a
    // partir do contador e da empresa ativa da sessao autenticada.
    body: JSON.stringify({ p_order: mapServiceOrderInput({ serviceOrder: params.serviceOrder }) }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const payload = (await response.json()) as ServiceOrderRecord | ServiceOrderRecord[];
  const createdOrder = Array.isArray(payload) ? payload[0] : payload;
  if (!createdOrder?.id) {
    throw new Error('A criacao da ordem de servico nao retornou um identificador.');
  }

  return createdOrder;
};

const mapServiceOrderItemsInput = (params: { companyId: string; serviceOrder: ServiceOrder }) =>
  (params.serviceOrder.items || []).map((item) => ({
    company_id: params.companyId,
    service_order_id: params.serviceOrder.id,
    legacy_item_id: String(item.id),
    product_id: item.stockItemId || null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    item_type: item.type,
  }));

const mapServiceOrderPaymentsInput = (params: { companyId: string; serviceOrder: ServiceOrder }) =>
  (params.serviceOrder.payments || []).map((payment) => ({
    id: payment.id,
    company_id: params.companyId,
    service_order_id: params.serviceOrder.id,
    amount: payment.amount,
    paid_at: payment.date,
    method: payment.method,
  }));

const mapServiceOrderNotesInput = (params: { companyId: string; serviceOrder: ServiceOrder }) =>
  (Array.isArray(params.serviceOrder.internalNotes) ? params.serviceOrder.internalNotes : []).map((note) => ({
    company_id: params.companyId,
    service_order_id: params.serviceOrder.id,
    user_display_name: note.user,
    note_text: note.comment,
    noted_at: note.date,
  }));

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

const mapFinancialTransactionInput = (params: {
  companyId: string;
  authUserId: string | null;
  transaction: FinancialTransaction;
}) => ({
  id: params.transaction.id,
  company_id: params.companyId,
  entry_type: params.transaction.type,
  description: params.transaction.description,
  amount: params.transaction.amount,
  transaction_date: params.transaction.date,
  due_date: params.transaction.dueDate || null,
  status: params.transaction.status || 'pago',
  category: params.transaction.category,
  payment_method: params.transaction.paymentMethod,
  related_sale_id: params.transaction.relatedSaleId || null,
  related_service_order_id: params.transaction.relatedServiceOrderId || null,
  related_stock_entry_key: params.transaction.relatedStockEntryId || null,
  origin: params.transaction.origin || null,
  created_by_user_id: params.authUserId,
  metadata: {},
});

const toStockItem = (record: ProductRecord): StockItem => ({
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

const listCurrentStock = async (accessToken: string) => {
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
  return rows.map(toStockItem);
};

const persistStockUpdates = async (params: {
  accessToken: string;
  companyId: string;
  currentStock: StockItem[];
  updatedStock: StockItem[];
}) => {
  for (const stockItem of params.updatedStock) {
    const previousStockItem = params.currentStock.find((item) => item.id === stockItem.id);
    if (!previousStockItem || JSON.stringify(previousStockItem) !== JSON.stringify(stockItem)) {
      const response = await fetch(
        buildUrl('products', {
          select: PRODUCTS_SELECT_FIELDS,
          id: `eq.${stockItem.id}`,
          company_id: `eq.${params.companyId}`,
        }),
        {
          method: 'PATCH',
          headers: buildHeaders(params.accessToken, true),
          body: JSON.stringify({
            stock_quantity: stockItem.quantity,
          }),
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }
    }
  }
};

const persistFinancialTransactions = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  transactions: FinancialTransaction[];
}) => {
  for (const transaction of params.transactions) {
    const response = await fetch(
      buildUrl('financial_entries', {
        select: FINANCIAL_ENTRIES_SELECT_FIELDS,
        id: `eq.${transaction.id}`,
        company_id: `eq.${params.companyId}`,
      }),
      {
        method: 'PATCH',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(mapFinancialTransactionInput({ ...params, transaction })),
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    const rows = (await response.json()) as FinancialEntryRecord[];
    if (!rows[0]) {
      const insertResponse = await fetch(buildUrl('financial_entries', { select: FINANCIAL_ENTRIES_SELECT_FIELDS }), {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(mapFinancialTransactionInput({ ...params, transaction })),
        cache: 'no-store',
      });

      if (!insertResponse.ok) {
        throw new Error(await parseErrorMessage(insertResponse));
      }
    }
  }
};

const persistOrderHistoryEvent = async (params: {
  accessToken: string;
  companyId: string;
  serviceOrderId: string;
  eventType: string;
  actorUserId: string | null;
  actorDisplayName: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  metadata?: Record<string, unknown>;
}) => {
  const response = await fetch(buildUrl('service_order_history', { select: 'id' }), {
    method: 'POST',
    headers: buildHeaders(params.accessToken, true),
    body: JSON.stringify({
      company_id: params.companyId,
      service_order_id: params.serviceOrderId,
      event_type: params.eventType,
      from_status: params.fromStatus || null,
      to_status: params.toStatus || null,
      actor_user_id: params.actorUserId,
      actor_display_name: params.actorDisplayName,
      metadata: params.metadata || {},
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};

export const listSaasServiceOrders = async (accessToken: string): Promise<ServiceOrder[]> => {
  const [ordersResponse, itemsResponse, paymentsResponse, notesResponse] = await Promise.all([
    fetch(
      buildUrl('service_orders', {
        select: SERVICE_ORDERS_SELECT_FIELDS,
        order: 'opened_at.desc,created_at.desc',
      }),
      { method: 'GET', headers: buildHeaders(accessToken), cache: 'no-store' }
    ),
    fetch(
      buildUrl('service_order_items', {
        select: SERVICE_ORDER_ITEMS_SELECT_FIELDS,
        order: 'service_order_id.asc,id.asc',
      }),
      { method: 'GET', headers: buildHeaders(accessToken), cache: 'no-store' }
    ),
    fetch(
      buildUrl('service_order_payments', {
        select: SERVICE_ORDER_PAYMENTS_SELECT_FIELDS,
        order: 'service_order_id.asc,paid_at.asc,id.asc',
      }),
      { method: 'GET', headers: buildHeaders(accessToken), cache: 'no-store' }
    ),
    fetch(
      buildUrl('service_order_notes', {
        select: SERVICE_ORDER_NOTES_SELECT_FIELDS,
        order: 'service_order_id.asc,noted_at.asc,id.asc',
      }),
      { method: 'GET', headers: buildHeaders(accessToken), cache: 'no-store' }
    ),
  ]);

  if (!ordersResponse.ok) throw new Error(await parseErrorMessage(ordersResponse));
  if (!itemsResponse.ok) throw new Error(await parseErrorMessage(itemsResponse));
  if (!paymentsResponse.ok) throw new Error(await parseErrorMessage(paymentsResponse));
  if (!notesResponse.ok) throw new Error(await parseErrorMessage(notesResponse));

  const orderRows = (await ordersResponse.json()) as ServiceOrderRecord[];
  const itemRows = (await itemsResponse.json()) as ServiceOrderItemRecord[];
  const paymentRows = (await paymentsResponse.json()) as ServiceOrderPaymentRecord[];
  const noteRows = (await notesResponse.json()) as ServiceOrderNoteRecord[];

  return orderRows.map((record) =>
    mapServiceOrder({
      record,
      items: itemRows,
      payments: paymentRows,
      notes: noteRows,
    })
  );
};

export const listSaasServiceOrderViews = async (accessToken: string): Promise<ServiceOrderViewMetadata[]> => {
  const response = await fetch(
    buildUrl('service_order_views', {
      select: SERVICE_ORDER_VIEWS_SELECT_FIELDS,
      order: 'last_viewed_at.desc,id.desc',
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

  const rows = (await response.json()) as ServiceOrderViewRecord[];
  return rows.map((row) => ({
    serviceOrderId: row.service_order_id,
    lastViewedAt: row.last_viewed_at,
  }));
};

export const markSaasServiceOrderViewed = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string;
  serviceOrderId: string;
  viewedAt: string;
}): Promise<void> => {
  const updateResponse = await fetch(
    buildUrl('service_order_views', {
      select: SERVICE_ORDER_VIEWS_SELECT_FIELDS,
      company_id: `eq.${params.companyId}`,
      service_order_id: `eq.${params.serviceOrderId}`,
      user_id: `eq.${params.authUserId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        last_viewed_at: params.viewedAt,
      }),
      cache: 'no-store',
    }
  );

  if (!updateResponse.ok) {
    throw new Error(await parseErrorMessage(updateResponse));
  }

  const updatedRows = (await updateResponse.json()) as ServiceOrderViewRecord[];
  if (!updatedRows[0]) {
    const insertResponse = await fetch(buildUrl('service_order_views', { select: 'id' }), {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        company_id: params.companyId,
        service_order_id: params.serviceOrderId,
        user_id: params.authUserId,
        last_viewed_at: params.viewedAt,
      }),
      cache: 'no-store',
    });

    if (!insertResponse.ok) {
      throw new Error(await parseErrorMessage(insertResponse));
    }
  }
};

export const saveSaasServiceOrder = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  actorDisplayName: string | null;
  serviceOrder: ServiceOrder;
}): Promise<{ duplicated: boolean; order: ServiceOrder; stock: StockItem[] }> => {
  const requestedOrderId = params.serviceOrder.id?.trim();
  const isNewOrder = !requestedOrderId;
  const [currentOrders, currentStock, currentFinancialResponse] = await Promise.all([
    listSaasServiceOrders(params.accessToken),
    listCurrentStock(params.accessToken),
    fetch(
      buildUrl('financial_entries', {
        select: FINANCIAL_ENTRIES_SELECT_FIELDS,
        company_id: `eq.${params.companyId}`,
        related_service_order_id: `eq.${requestedOrderId || '__new_service_order__'}`,
      }),
      { method: 'GET', headers: buildHeaders(params.accessToken), cache: 'no-store' }
    ),
  ]);

  if (!currentFinancialResponse.ok) {
    throw new Error(await parseErrorMessage(currentFinancialResponse));
  }

  const currentFinancialRows = (await currentFinancialResponse.json()) as FinancialEntryRecord[];
  const currentFinancialTransactions = currentFinancialRows.map(mapFinancialEntryRecord);
  const previousOrder = requestedOrderId ? currentOrders.find((order) => order.id === requestedOrderId) : undefined;
  let finalOrder: ServiceOrder = { ...params.serviceOrder, id: requestedOrderId || '' };

  if (finalOrder.status === 'Entregue' && !finalOrder.deliveredDate) {
    finalOrder.deliveredDate = new Date().toISOString().split('T')[0];
  } else if (finalOrder.status !== 'Entregue') {
    delete finalOrder.deliveredDate;
  }

  const stockSyncResult = syncServiceOrderStock({
    currentStock,
    previousItems: previousOrder?.items || [],
    nextItems: finalOrder.items || [],
  });

  if (!stockSyncResult.ok) {
    throw new Error(stockSyncResult.error);
  }

  await persistStockUpdates({
    accessToken: params.accessToken,
    companyId: params.companyId,
    currentStock,
    updatedStock: stockSyncResult.updatedStock,
  });

  if (isNewOrder) {
    const createdOrder = await createSaasServiceOrder({
      accessToken: params.accessToken,
      serviceOrder: finalOrder,
    });
    finalOrder = { ...finalOrder, id: createdOrder.id };
  } else {
    const patchResponse = await fetch(
      buildUrl('service_orders', {
        select: SERVICE_ORDERS_SELECT_FIELDS,
        id: `eq.${finalOrder.id}`,
        company_id: `eq.${params.companyId}`,
      }),
      {
        method: 'PATCH',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(mapServiceOrderInput({ serviceOrder: finalOrder })),
        cache: 'no-store',
      }
    );

    if (!patchResponse.ok) {
      throw new Error(await parseErrorMessage(patchResponse));
    }

    const patchedRows = (await patchResponse.json()) as ServiceOrderRecord[];
    if (!patchedRows[0]) {
      throw new Error('Ordem de servico nao encontrada na empresa ativa.');
    }
  }

  const deleteItemsResponse = await fetch(
    buildUrl('service_order_items', {
      company_id: `eq.${params.companyId}`,
      service_order_id: `eq.${finalOrder.id}`,
    }),
    { method: 'DELETE', headers: buildHeaders(params.accessToken), cache: 'no-store' }
  );
  if (!deleteItemsResponse.ok) throw new Error(await parseErrorMessage(deleteItemsResponse));

  const deletePaymentsResponse = await fetch(
    buildUrl('service_order_payments', {
      company_id: `eq.${params.companyId}`,
      service_order_id: `eq.${finalOrder.id}`,
    }),
    { method: 'DELETE', headers: buildHeaders(params.accessToken), cache: 'no-store' }
  );
  if (!deletePaymentsResponse.ok) throw new Error(await parseErrorMessage(deletePaymentsResponse));

  const deleteNotesResponse = await fetch(
    buildUrl('service_order_notes', {
      company_id: `eq.${params.companyId}`,
      service_order_id: `eq.${finalOrder.id}`,
    }),
    { method: 'DELETE', headers: buildHeaders(params.accessToken), cache: 'no-store' }
  );
  if (!deleteNotesResponse.ok) throw new Error(await parseErrorMessage(deleteNotesResponse));

  const itemPayload = mapServiceOrderItemsInput({ companyId: params.companyId, serviceOrder: finalOrder });
  if (itemPayload.length > 0) {
    const insertItemsResponse = await fetch(buildUrl('service_order_items', { select: 'id' }), {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(itemPayload),
      cache: 'no-store',
    });
    if (!insertItemsResponse.ok) throw new Error(await parseErrorMessage(insertItemsResponse));
  }

  const paymentPayload = mapServiceOrderPaymentsInput({ companyId: params.companyId, serviceOrder: finalOrder });
  if (paymentPayload.length > 0) {
    const insertPaymentsResponse = await fetch(buildUrl('service_order_payments', { select: 'id' }), {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(paymentPayload),
      cache: 'no-store',
    });
    if (!insertPaymentsResponse.ok) throw new Error(await parseErrorMessage(insertPaymentsResponse));
  }

  const notePayload = mapServiceOrderNotesInput({ companyId: params.companyId, serviceOrder: finalOrder });
  if (notePayload.length > 0) {
    const insertNotesResponse = await fetch(buildUrl('service_order_notes', { select: 'id' }), {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(notePayload),
      cache: 'no-store',
    });
    if (!insertNotesResponse.ok) throw new Error(await parseErrorMessage(insertNotesResponse));
  }

  const existingPaymentIds = new Set((previousOrder?.payments || []).map((payment) => payment.id));
  const paymentsToCreate = (finalOrder.payments || []).filter((payment) => !existingPaymentIds.has(payment.id));
  const paymentTransactions = paymentsToCreate
    .filter((payment) => payment.amount > 0)
    .map(
      (payment): FinancialTransaction => ({
        id: `FIN-OS-PAY-${payment.id}`,
        type: 'receita',
        description: `Cliente: ${finalOrder.customerName} | OS #${finalOrder.id.replace(/^.*?(\d+)$/, '$1')} | Pagamento: ${payment.method} | Valor: R$ ${payment.amount.toFixed(2)}`,
        amount: payment.amount,
        date: payment.date,
        category: 'Venda de Serviço',
        paymentMethod: payment.method,
        relatedServiceOrderId: finalOrder.id,
        status: 'pago',
        origin: 'service-order-payment',
      })
    );

  const paymentTransactionsToPersist = paymentTransactions.filter(
    (transaction) => !currentFinancialTransactions.some((existing) => existing.id === transaction.id)
  );
  if (paymentTransactionsToPersist.length > 0) {
    await persistFinancialTransactions({
      accessToken: params.accessToken,
      companyId: params.companyId,
      authUserId: params.authUserId,
      transactions: paymentTransactionsToPersist,
    });
  }

  await persistOrderHistoryEvent({
    accessToken: params.accessToken,
    companyId: params.companyId,
    serviceOrderId: finalOrder.id,
    eventType: previousOrder ? 'service_order_updated' : 'service_order_created',
    actorUserId: params.authUserId,
    actorDisplayName: params.actorDisplayName,
    fromStatus: previousOrder ? toDbStatus(previousOrder.status) : null,
    toStatus: toDbStatus(finalOrder.status),
    metadata: {
      itemCount: finalOrder.items?.length || 0,
      paymentCount: finalOrder.payments?.length || 0,
      notesCount: Array.isArray(finalOrder.internalNotes) ? finalOrder.internalNotes.length : 0,
    },
  });

  return {
    duplicated: false,
    order: finalOrder,
    stock: stockSyncResult.updatedStock,
  };
};

export const updateSaasServiceOrderStatus = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  actorDisplayName: string | null;
  orderId: string;
  status: ServiceOrder['status'];
}): Promise<{ duplicated: boolean; order: ServiceOrder }> => {
  const currentOrders = await listSaasServiceOrders(params.accessToken);
  const currentOrder = currentOrders.find((order) => order.id === params.orderId);
  if (!currentOrder) {
    throw new Error('Ordem de servico nao encontrada.');
  }

  const deliveredDate =
    params.status === 'Entregue'
      ? currentOrder.deliveredDate || new Date().toISOString().split('T')[0]
      : undefined;

  if (currentOrder.status === params.status && currentOrder.deliveredDate === deliveredDate) {
    return {
      duplicated: true,
      order: currentOrder,
    };
  }

  const response = await fetch(
    buildUrl('service_orders', {
      select: SERVICE_ORDERS_SELECT_FIELDS,
      id: `eq.${params.orderId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        status_code: toDbStatus(params.status),
        delivered_at: deliveredDate || null,
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const updatedOrder: ServiceOrder = {
    ...currentOrder,
    status: params.status,
    deliveredDate,
  };

  await persistOrderHistoryEvent({
    accessToken: params.accessToken,
    companyId: params.companyId,
    serviceOrderId: params.orderId,
    eventType: 'service_order_status_changed',
    actorUserId: params.authUserId,
    actorDisplayName: params.actorDisplayName,
    fromStatus: toDbStatus(currentOrder.status),
    toStatus: toDbStatus(params.status),
  });

  return {
    duplicated: false,
    order: updatedOrder,
  };
};

export const finalizeSaasServiceOrder = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  actorDisplayName: string | null;
  orderId: string;
  newPayments: OSPayment[];
  newTransactions: FinancialTransaction[];
  nextStatus: ServiceOrder['status'];
  deliveredDate: string;
}): Promise<{ duplicated: boolean; order: ServiceOrder; transactions: FinancialTransaction[] }> => {
  const currentOrders = await listSaasServiceOrders(params.accessToken);
  const currentOrder = currentOrders.find((order) => order.id === params.orderId);
  if (!currentOrder) {
    throw new Error('Ordem de servico nao encontrada.');
  }

  const financialResponse = await fetch(
    buildUrl('financial_entries', {
      select: FINANCIAL_ENTRIES_SELECT_FIELDS,
      related_service_order_id: `eq.${params.orderId}`,
    }),
    { method: 'GET', headers: buildHeaders(params.accessToken), cache: 'no-store' }
  );
  if (!financialResponse.ok) throw new Error(await parseErrorMessage(financialResponse));
  const financialRows = (await financialResponse.json()) as FinancialEntryRecord[];
  const currentTransactions = financialRows.map(mapFinancialEntryRecord);

  const mergedTransactions = params.newTransactions.reduce(
    (transactions, transaction) =>
      transaction.origin === 'service-order-finalization'
        ? upsertServiceOrderFinalizationTransaction(transactions, transaction)
        : transactions.some((existing) => existing.id === transaction.id)
          ? transactions
          : [transaction, ...transactions],
    currentTransactions
  );

  const mergedPayments = [...(currentOrder.payments || [])];
  for (const payment of params.newPayments) {
    const exists = mergedPayments.some(
      (existingPayment) =>
        existingPayment.id === payment.id ||
        (existingPayment.amount === payment.amount &&
          existingPayment.date === payment.date &&
          existingPayment.method === payment.method)
    );
    if (!exists) {
      mergedPayments.push(payment);
    }
  }

  const updatedOrder: ServiceOrder = {
    ...currentOrder,
    status: params.nextStatus,
    deliveredDate: params.deliveredDate,
    payments: mergedPayments,
  };

  const response = await fetch(
    buildUrl('service_orders', {
      select: SERVICE_ORDERS_SELECT_FIELDS,
      id: `eq.${params.orderId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        status_code: toDbStatus(params.nextStatus),
        delivered_at: params.deliveredDate,
      }),
      cache: 'no-store',
    }
  );
  if (!response.ok) throw new Error(await parseErrorMessage(response));

  const deletePaymentsResponse = await fetch(
    buildUrl('service_order_payments', {
      company_id: `eq.${params.companyId}`,
      service_order_id: `eq.${params.orderId}`,
    }),
    { method: 'DELETE', headers: buildHeaders(params.accessToken), cache: 'no-store' }
  );
  if (!deletePaymentsResponse.ok) throw new Error(await parseErrorMessage(deletePaymentsResponse));

  const paymentPayload = mapServiceOrderPaymentsInput({ companyId: params.companyId, serviceOrder: updatedOrder });
  if (paymentPayload.length > 0) {
    const insertPaymentsResponse = await fetch(buildUrl('service_order_payments', { select: 'id' }), {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(paymentPayload),
      cache: 'no-store',
    });
    if (!insertPaymentsResponse.ok) throw new Error(await parseErrorMessage(insertPaymentsResponse));
  }

  await persistFinancialTransactions({
    accessToken: params.accessToken,
    companyId: params.companyId,
    authUserId: params.authUserId,
    transactions: params.newTransactions,
  });

  await persistOrderHistoryEvent({
    accessToken: params.accessToken,
    companyId: params.companyId,
    serviceOrderId: params.orderId,
    eventType: 'service_order_finalized',
    actorUserId: params.authUserId,
    actorDisplayName: params.actorDisplayName,
    fromStatus: toDbStatus(currentOrder.status),
    toStatus: toDbStatus(params.nextStatus),
    metadata: {
      deliveredDate: params.deliveredDate,
      paymentsAdded: params.newPayments.length,
      transactionsAdded: params.newTransactions.length,
    },
  });

  return {
    duplicated: false,
    order: updatedOrder,
    transactions: mergedTransactions.filter((transaction) => transaction.relatedServiceOrderId === params.orderId),
  };
};

export const deleteSaasServiceOrder = async (params: {
  accessToken: string;
  companyId: string;
  authUserId: string | null;
  actorDisplayName: string | null;
  orderId: string;
}): Promise<{ duplicated: boolean; orderId: string; stock: StockItem[] }> => {
  const currentOrders = await listSaasServiceOrders(params.accessToken);
  const currentOrder = currentOrders.find((order) => order.id === params.orderId);
  const currentStock = await listCurrentStock(params.accessToken);

  if (!currentOrder) {
    return {
      duplicated: true,
      orderId: params.orderId,
      stock: currentStock,
    };
  }

  let updatedStock = currentStock;
  if (currentOrder.items && currentOrder.items.length > 0) {
    const stockSyncResult = syncServiceOrderStock({
      currentStock,
      previousItems: currentOrder.items,
      nextItems: [],
    });
    if (!stockSyncResult.ok) {
      throw new Error(stockSyncResult.error);
    }
    updatedStock = stockSyncResult.updatedStock;
    await persistStockUpdates({
      accessToken: params.accessToken,
      companyId: params.companyId,
      currentStock,
      updatedStock,
    });
  }

  const financialResponse = await fetch(
    buildUrl('financial_entries', {
      select: FINANCIAL_ENTRIES_SELECT_FIELDS,
      related_service_order_id: `eq.${params.orderId}`,
      company_id: `eq.${params.companyId}`,
    }),
    { method: 'GET', headers: buildHeaders(params.accessToken), cache: 'no-store' }
  );
  if (!financialResponse.ok) throw new Error(await parseErrorMessage(financialResponse));
  const financialRows = (await financialResponse.json()) as FinancialEntryRecord[];

  for (const transaction of financialRows) {
    const deleteResponse = await fetch(
      buildUrl('financial_entries', {
        id: `eq.${transaction.id}`,
        company_id: `eq.${params.companyId}`,
      }),
      { method: 'DELETE', headers: buildHeaders(params.accessToken), cache: 'no-store' }
    );
    if (!deleteResponse.ok) throw new Error(await parseErrorMessage(deleteResponse));
  }

  await persistOrderHistoryEvent({
    accessToken: params.accessToken,
    companyId: params.companyId,
    serviceOrderId: params.orderId,
    eventType: 'service_order_deleted',
    actorUserId: params.authUserId,
    actorDisplayName: params.actorDisplayName,
    fromStatus: toDbStatus(currentOrder.status),
    metadata: {
      restoredStockItems: currentOrder.items?.filter((item) => item.type === 'part').length || 0,
      deletedFinancialTransactions: financialRows.length,
    },
  });

  const deleteResponse = await fetch(
    buildUrl('service_orders', {
      id: `eq.${params.orderId}`,
      company_id: `eq.${params.companyId}`,
    }),
    { method: 'DELETE', headers: buildHeaders(params.accessToken), cache: 'no-store' }
  );
  if (!deleteResponse.ok) throw new Error(await parseErrorMessage(deleteResponse));

  return {
    duplicated: false,
    orderId: params.orderId,
    stock: updatedStock,
  };
};
