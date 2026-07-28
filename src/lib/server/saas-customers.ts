import type { Customer, CustomerSearchResult } from '@/types';
import type { CustomerRecord } from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const CUSTOMERS_SELECT_FIELDS =
  'id,company_id,full_name,phone_1,email,address_line,document_number,zip_code,notes,is_active';

const normalizeOptionalText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildCustomersUrl = (params: Record<string, string>) => {
  const { url } = getSupabaseUserConfig();
  const searchParams = new URLSearchParams(params);
  return `${url}/rest/v1/customers?${searchParams.toString()}`;
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

const mapCustomerRecord = (record: CustomerRecord): Customer => ({
  id: record.id,
  name: record.full_name,
  phone: record.phone_1 || '',
  email: record.email || '',
  address: record.address_line || '',
  document: record.document_number || '',
  cep: record.zip_code || '',
});

const mapCustomerInput = (params: { id: string; companyId: string; customer: Omit<Customer, 'id'> }) => ({
  id: params.id,
  company_id: params.companyId,
  full_name: params.customer.name.trim(),
  phone_1: normalizeOptionalText(params.customer.phone),
  email: normalizeOptionalText(params.customer.email),
  address_line: normalizeOptionalText(params.customer.address),
  document_number: normalizeOptionalText(params.customer.document),
  zip_code: normalizeOptionalText(params.customer.cep),
  notes: null,
  is_active: true,
});

export const generateCustomerId = () =>
  `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

export const listSaasCustomers = async (accessToken: string): Promise<Customer[]> => {
  const response = await fetch(
    buildCustomersUrl({
      select: CUSTOMERS_SELECT_FIELDS,
      is_active: 'eq.true',
      order: 'full_name.asc',
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

  const rows = (await response.json()) as CustomerRecord[];
  return rows.map(mapCustomerRecord);
};

export const searchSaasCustomersByName = async (
  accessToken: string,
  name: string,
  limit: number
): Promise<CustomerSearchResult[]> => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return [];
  }

  const safeLimit = String(Math.min(Math.max(limit, 1), 15));
  const response = await fetch(
    buildCustomersUrl({
      select: 'id,full_name,phone_1',
      is_active: 'eq.true',
      or: `(full_name.ilike.*${trimmedName}*,phone_1.ilike.*${trimmedName}*,document_number.ilike.*${trimmedName}*,email.ilike.*${trimmedName}*)`,
      order: 'full_name.asc',
      limit: safeLimit,
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

  const rows = (await response.json()) as Array<
    Pick<CustomerRecord, 'id' | 'full_name' | 'phone_1'>
  >;

  return rows.map((row) => ({
    id: row.id,
    name: row.full_name,
    phone: row.phone_1 || '',
  }));
};

export const createSaasCustomer = async (params: {
  accessToken: string;
  companyId: string;
  customer: Omit<Customer, 'id'>;
  id?: string;
}): Promise<Customer> => {
  const id = params.id?.trim() || generateCustomerId();
  const payload = mapCustomerInput({
    id,
    companyId: params.companyId,
    customer: params.customer,
  });

  const response = await fetch(
    buildCustomersUrl({
      select: CUSTOMERS_SELECT_FIELDS,
    }),
    {
      method: 'POST',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(payload),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as CustomerRecord[];
  const record = rows[0];
  if (!record) {
    throw new Error('Cliente criado sem retorno da API.');
  }

  return mapCustomerRecord(record);
};

export const updateSaasCustomer = async (params: {
  accessToken: string;
  companyId: string;
  customerId: string;
  customer: Omit<Customer, 'id'>;
}): Promise<Customer> => {
  const response = await fetch(
    buildCustomersUrl({
      select: CUSTOMERS_SELECT_FIELDS,
      id: `eq.${params.customerId}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify(
        mapCustomerInput({
          id: params.customerId,
          companyId: params.companyId,
          customer: params.customer,
        })
      ),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as CustomerRecord[];
  const record = rows[0];
  if (!record) {
    throw new Error('Cliente nao encontrado para atualizacao.');
  }

  return mapCustomerRecord(record);
};

export const deleteSaasCustomer = async (params: {
  accessToken: string;
  companyId: string;
  customerId: string;
}): Promise<void> => {
  const response = await fetch(
    buildCustomersUrl({
      id: `eq.${params.customerId}`,
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
