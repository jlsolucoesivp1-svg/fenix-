import type { Kit } from '@/types';
import type { KitItemRecord, KitRecord } from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const buildUrl = (table: 'kits' | 'kit_items', params: Record<string, string>) => {
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

export const listSaasKits = async (accessToken: string): Promise<Kit[]> => {
  const [kitsResponse, kitItemsResponse] = await Promise.all([
    fetch(
      buildUrl('kits', {
        select: 'id,company_id,name,is_active',
        is_active: 'eq.true',
        order: 'name.asc',
      }),
      {
        method: 'GET',
        headers: buildHeaders(accessToken),
        cache: 'no-store',
      }
    ),
    fetch(
      buildUrl('kit_items', {
        select: 'id,company_id,kit_id,product_ref,name,quantity',
        order: 'kit_id.asc,id.asc',
      }),
      {
        method: 'GET',
        headers: buildHeaders(accessToken),
        cache: 'no-store',
      }
    ),
  ]);

  if (!kitsResponse.ok) {
    throw new Error(await parseErrorMessage(kitsResponse));
  }
  if (!kitItemsResponse.ok) {
    throw new Error(await parseErrorMessage(kitItemsResponse));
  }

  const kitRows = (await kitsResponse.json()) as KitRecord[];
  const itemRows = (await kitItemsResponse.json()) as KitItemRecord[];

  return kitRows.map((kit) => ({
    id: kit.id,
    name: kit.name,
    items: itemRows
      .filter((item) => item.kit_id === kit.id)
      .map((item) => ({
        productId: item.product_ref || '',
        name: item.name,
        quantity: Number(item.quantity),
      })),
  }));
};

export const upsertSaasKit = async (params: {
  accessToken: string;
  companyId: string;
  kit: Kit;
}): Promise<Kit> => {
  const kitResponse = await fetch(
    buildUrl('kits', {
      select: 'id,company_id,name,is_active',
      id: `eq.${params.kit.id}`,
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        name: params.kit.name.trim(),
        is_active: true,
      }),
      cache: 'no-store',
    }
  );

  if (!kitResponse.ok) {
    throw new Error(await parseErrorMessage(kitResponse));
  }

  const existingKitRows = (await kitResponse.json()) as KitRecord[];
  if (!existingKitRows[0]) {
    const insertResponse = await fetch(
      buildUrl('kits', { select: 'id,company_id,name,is_active' }),
      {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify({
          id: params.kit.id,
          company_id: params.companyId,
          name: params.kit.name.trim(),
          is_active: true,
        }),
        cache: 'no-store',
      }
    );

    if (!insertResponse.ok) {
      throw new Error(await parseErrorMessage(insertResponse));
    }
  }

  const deleteItemsResponse = await fetch(
    buildUrl('kit_items', {
      kit_id: `eq.${params.kit.id}`,
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

  if (params.kit.items.length > 0) {
    const insertItemsResponse = await fetch(
      buildUrl('kit_items', { select: 'id' }),
      {
        method: 'POST',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify(
          params.kit.items.map((item) => ({
            company_id: params.companyId,
            kit_id: params.kit.id,
            product_ref: normalizeOptionalText(item.productId),
            name: item.name.trim(),
            quantity: item.quantity,
          }))
        ),
        cache: 'no-store',
      }
    );

    if (!insertItemsResponse.ok) {
      throw new Error(await parseErrorMessage(insertItemsResponse));
    }
  }

  return params.kit;
};
