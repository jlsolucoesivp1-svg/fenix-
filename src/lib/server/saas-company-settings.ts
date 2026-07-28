import type { AppSettings, CompanyInfo } from '@/types';
import type { CompanyBrandingRecord, CompanyRecord, CompanySettingsRecord } from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type SupabaseErrorPayload = {
  message?: string;
  error?: string;
};

const buildUrl = (
  table: 'companies' | 'company_settings' | 'company_branding',
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

const buildCompanyAssetDownloadUrl = (path: string | null | undefined): string =>
  path?.trim() ? `/api/tenant/assets?path=${encodeURIComponent(path.trim())}&download=1` : '';

const mapBrandingRecord = (record: CompanyBrandingRecord): CompanyInfo => ({
  name: '',
  address: record.address || '',
  phone: record.phone || '',
  emailOrSite: record.email_or_site || '',
  document: '',
  logoUrl: buildCompanyAssetDownloadUrl(record.logo_path),
  logoStoragePath: record.logo_path || '',
  pixKey: record.pix_key || '',
  notificationSoundUrl: buildCompanyAssetDownloadUrl(record.notification_sound_path),
  notificationSoundStoragePath: record.notification_sound_path || '',
});

const mapSettingsRecord = (record: CompanySettingsRecord): AppSettings => ({
  defaultWarrantyDays: record.default_warranty_days,
  receiptPrintFormat: record.receipt_print_format || 'a4',
});

const getCompanyCore = async (params: {
  accessToken: string;
  companyId: string;
}): Promise<CompanyRecord | null> => {
  const response = await fetch(
    buildUrl('companies', {
      select: 'id,slug,trade_name,legal_name,document_number,status',
      id: `eq.${params.companyId}`,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as CompanyRecord[];
  return rows[0] || null;
};

export const getSaasCompanyInfo = async (params: {
  accessToken: string;
  companyId: string;
  companyTradeName?: string | null;
}): Promise<CompanyInfo> => {
  const [companyRecord, brandingRecord] = await Promise.all([
    getCompanyCore(params),
    fetch(
      buildUrl('company_branding', {
        select: 'company_id,address,phone,email_or_site,pix_key,logo_path,notification_sound_path',
        company_id: `eq.${params.companyId}`,
        limit: '1',
      }),
      {
        method: 'GET',
        headers: buildHeaders(params.accessToken),
        cache: 'no-store',
      }
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }
      const rows = (await response.json()) as CompanyBrandingRecord[];
      return rows[0];
    }),
  ]);

  return {
    ...(brandingRecord
      ? mapBrandingRecord(brandingRecord)
      : mapBrandingRecord({
          company_id: params.companyId,
          address: null,
          phone: null,
          email_or_site: null,
          pix_key: null,
          logo_path: null,
          notification_sound_path: null,
        })),
    name: companyRecord?.trade_name || params.companyTradeName || '',
    document: companyRecord?.document_number || '',
  };
};

export const saveSaasCompanyInfo = async (params: {
  accessToken: string;
  companyId: string;
  companyInfo: CompanyInfo;
}): Promise<CompanyInfo> => {
  const [companyRecord, brandingRecord] = await Promise.all([
    fetch(
      buildUrl('companies', {
        select: 'id,slug,trade_name,legal_name,document_number,status',
        id: `eq.${params.companyId}`,
      }),
      {
        method: 'PATCH',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify({
          trade_name: normalizeOptionalText(params.companyInfo.name),
          document_number: normalizeOptionalText(params.companyInfo.document),
        }),
        cache: 'no-store',
      }
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }
      const rows = (await response.json()) as CompanyRecord[];
      return rows[0];
    }),
    fetch(
      buildUrl('company_branding', {
        select: 'company_id,address,phone,email_or_site,pix_key,logo_path,notification_sound_path',
        company_id: `eq.${params.companyId}`,
      }),
      {
        method: 'PATCH',
        headers: buildHeaders(params.accessToken, true),
        body: JSON.stringify({
          company_id: params.companyId,
          address: normalizeOptionalText(params.companyInfo.address),
          phone: normalizeOptionalText(params.companyInfo.phone),
          email_or_site: normalizeOptionalText(params.companyInfo.emailOrSite),
          pix_key: normalizeOptionalText(params.companyInfo.pixKey),
          logo_path: normalizeOptionalText(params.companyInfo.logoStoragePath || params.companyInfo.logoUrl),
          notification_sound_path: normalizeOptionalText(
            params.companyInfo.notificationSoundStoragePath || params.companyInfo.notificationSoundUrl
          ),
        }),
        cache: 'no-store',
      }
    ).then(async (response) => {
      if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
      }
      const rows = (await response.json()) as CompanyBrandingRecord[];
      return rows[0];
    }),
  ]);

  if (!brandingRecord) {
    throw new Error('Configuracao de branding nao retornou dados apos salvar.');
  }

  return {
    ...mapBrandingRecord(brandingRecord),
    name: companyRecord?.trade_name || params.companyInfo.name,
    document: companyRecord?.document_number || params.companyInfo.document,
  };
};

export const getSaasAppSettings = async (params: {
  accessToken: string;
  companyId: string;
}): Promise<AppSettings> => {
  const response = await fetch(
    buildUrl('company_settings', {
      select: 'company_id,default_warranty_days,timezone,currency_code,receipt_print_format',
      company_id: `eq.${params.companyId}`,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildHeaders(params.accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as CompanySettingsRecord[];
  const record = rows[0];
  if (!record) {
    return { defaultWarrantyDays: 90, receiptPrintFormat: 'a4' };
  }

  return mapSettingsRecord(record);
};

export const saveSaasAppSettings = async (params: {
  accessToken: string;
  companyId: string;
  settings: AppSettings;
}): Promise<AppSettings> => {
  const response = await fetch(
    buildUrl('company_settings', {
      select: 'company_id,default_warranty_days,timezone,currency_code,receipt_print_format',
      company_id: `eq.${params.companyId}`,
    }),
    {
      method: 'PATCH',
      headers: buildHeaders(params.accessToken, true),
      body: JSON.stringify({
        company_id: params.companyId,
        default_warranty_days: params.settings.defaultWarrantyDays,
        receipt_print_format: params.settings.receiptPrintFormat,
      }),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  const rows = (await response.json()) as CompanySettingsRecord[];
  const record = rows[0];
  if (!record) {
    throw new Error('Configuracao nao retornou dados apos salvar.');
  }

  return mapSettingsRecord(record);
};
