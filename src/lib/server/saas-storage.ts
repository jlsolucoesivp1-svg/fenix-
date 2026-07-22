import type { CompanyAssetKind, CompanyAssetSummary, ServiceOrderFileSummary } from '@/types';
import { getSupabaseUserConfig } from './supabase-user';

type StorageObjectRow = {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
};

type StorageErrorPayload = {
  message?: string;
  error?: string;
};

const BUCKET_SERVICE_ORDER_FILES = 'service-order-files';
const BUCKET_CUSTOMER_FILES = 'customer-files';
const BUCKET_COMPANY_ASSETS = 'company-assets';

const buildHeaders = (accessToken: string, contentType?: string) => {
  const { anonKey } = getSupabaseUserConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    ...(contentType ? { 'Content-Type': contentType } : {}),
  };
};

const buildStorageUrl = (path: string) => {
  const { url } = getSupabaseUserConfig();
  return `${url}/storage/v1${path}`;
};

const parseStorageError = async (response: Response) => {
  try {
    const payload = (await response.json()) as StorageErrorPayload;
    return payload.message || payload.error || `Falha na operacao (${response.status}).`;
  } catch {
    return `Falha na operacao (${response.status}).`;
  }
};

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize('NFD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'arquivo';

const buildServiceOrderPrefix = (companyId: string, serviceOrderId: string) =>
  `${companyId}/${serviceOrderId}`;

const buildCustomerPrefix = (companyId: string, customerId: string) => `${companyId}/${customerId}`;
const buildCompanyAssetsPrefix = (companyId: string) => `${companyId}`;
const buildCompanyAssetKindPrefix = (companyId: string, kind: CompanyAssetKind) => `${companyId}/${kind}`;

const buildDownloadUrl = (serviceOrderId: string, path: string) =>
  `/api/service-orders/files?serviceOrderId=${encodeURIComponent(serviceOrderId)}&path=${encodeURIComponent(
    path
  )}&download=1`;

const mapStorageObjects = (params: {
  rows: StorageObjectRow[];
  prefix: string;
  buildDownloadUrl: (path: string) => string;
}): ServiceOrderFileSummary[] =>
  params.rows
    .filter((row) => row.name && !row.id?.startsWith?.('folder'))
    .map((row) => {
      const path = `${params.prefix}/${row.name}`;
      return {
        path,
        name: row.name,
        size: row.metadata?.size || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        mimeType: row.metadata?.mimetype || null,
        downloadUrl: params.buildDownloadUrl(path),
      } satisfies ServiceOrderFileSummary;
    });

const inferCompanyAssetKind = (path: string): CompanyAssetKind => {
  const [, maybeKind] = path.split('/');
  if (maybeKind === 'logo' || maybeKind === 'notification-sound' || maybeKind === 'brand-media') {
    return maybeKind;
  }

  return 'brand-media';
};

const mapCompanyAssets = (rows: StorageObjectRow[], companyId: string): CompanyAssetSummary[] =>
  rows
    .filter((row) => row.name && !row.id?.startsWith?.('folder'))
    .map((row) => {
      const path = `${buildCompanyAssetsPrefix(companyId)}/${row.name}`;
      return {
        path,
        name: row.name.split('/').pop() || row.name,
        size: row.metadata?.size || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        mimeType: row.metadata?.mimetype || null,
        downloadUrl: `/api/tenant/assets?path=${encodeURIComponent(path)}&download=1`,
        kind: inferCompanyAssetKind(path),
      } satisfies CompanyAssetSummary;
    });

export const listSaasServiceOrderFiles = async (params: {
  accessToken: string;
  companyId: string;
  serviceOrderId: string;
}): Promise<ServiceOrderFileSummary[]> => {
  const prefix = buildServiceOrderPrefix(params.companyId, params.serviceOrderId);
  const response = await fetch(buildStorageUrl(`/object/list/${BUCKET_SERVICE_ORDER_FILES}`), {
    method: 'POST',
    headers: buildHeaders(params.accessToken, 'application/json'),
    body: JSON.stringify({
      prefix,
      limit: 100,
      sortBy: { column: 'updated_at', order: 'desc' },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  const rows = (await response.json()) as StorageObjectRow[];
  return mapStorageObjects({
    rows,
    prefix,
    buildDownloadUrl: (path) => buildDownloadUrl(params.serviceOrderId, path),
  });
};

export const uploadSaasServiceOrderFile = async (params: {
  accessToken: string;
  companyId: string;
  serviceOrderId: string;
  file: File;
}) => {
  const safeFileName = sanitizeFileName(params.file.name);
  const path = `${buildServiceOrderPrefix(params.companyId, params.serviceOrderId)}/${Date.now()}-${safeFileName}`;
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_SERVICE_ORDER_FILES}/${path}`), {
    method: 'POST',
    headers: buildHeaders(params.accessToken, params.file.type || 'application/octet-stream'),
    body: Buffer.from(await params.file.arrayBuffer()),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  return {
    path,
    name: params.file.name,
  };
};

export const deleteSaasServiceOrderFile = async (params: {
  accessToken: string;
  path: string;
}) => {
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_SERVICE_ORDER_FILES}/${params.path}`), {
    method: 'DELETE',
    headers: buildHeaders(params.accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }
};

export const downloadSaasServiceOrderFile = async (params: {
  accessToken: string;
  path: string;
}) => {
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_SERVICE_ORDER_FILES}/${params.path}`), {
    method: 'GET',
    headers: buildHeaders(params.accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  return response;
};

export const listSaasCustomerFiles = async (params: {
  accessToken: string;
  companyId: string;
  customerId: string;
}): Promise<ServiceOrderFileSummary[]> => {
  const prefix = buildCustomerPrefix(params.companyId, params.customerId);
  const response = await fetch(buildStorageUrl(`/object/list/${BUCKET_CUSTOMER_FILES}`), {
    method: 'POST',
    headers: buildHeaders(params.accessToken, 'application/json'),
    body: JSON.stringify({
      prefix,
      limit: 100,
      sortBy: { column: 'updated_at', order: 'desc' },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  const rows = (await response.json()) as StorageObjectRow[];
  return mapStorageObjects({
    rows,
    prefix,
    buildDownloadUrl: (path) =>
      `/api/clientes/files?customerId=${encodeURIComponent(params.customerId)}&path=${encodeURIComponent(
        path
      )}&download=1`,
  });
};

export const uploadSaasCustomerFile = async (params: {
  accessToken: string;
  companyId: string;
  customerId: string;
  file: File;
}) => {
  const safeFileName = sanitizeFileName(params.file.name);
  const path = `${buildCustomerPrefix(params.companyId, params.customerId)}/${Date.now()}-${safeFileName}`;
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_CUSTOMER_FILES}/${path}`), {
    method: 'POST',
    headers: buildHeaders(params.accessToken, params.file.type || 'application/octet-stream'),
    body: Buffer.from(await params.file.arrayBuffer()),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  return {
    path,
    name: params.file.name,
  };
};

export const deleteSaasCustomerFile = async (params: {
  accessToken: string;
  path: string;
}) => {
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_CUSTOMER_FILES}/${params.path}`), {
    method: 'DELETE',
    headers: buildHeaders(params.accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }
};

export const downloadSaasCustomerFile = async (params: {
  accessToken: string;
  path: string;
}) => {
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_CUSTOMER_FILES}/${params.path}`), {
    method: 'GET',
    headers: buildHeaders(params.accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  return response;
};

export const listSaasCompanyAssets = async (params: {
  accessToken: string;
  companyId: string;
}): Promise<CompanyAssetSummary[]> => {
  const prefix = buildCompanyAssetsPrefix(params.companyId);
  const response = await fetch(buildStorageUrl(`/object/list/${BUCKET_COMPANY_ASSETS}`), {
    method: 'POST',
    headers: buildHeaders(params.accessToken, 'application/json'),
    body: JSON.stringify({
      prefix,
      limit: 200,
      sortBy: { column: 'updated_at', order: 'desc' },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  const rows = (await response.json()) as StorageObjectRow[];
  return mapCompanyAssets(rows, params.companyId);
};

export const uploadSaasCompanyAsset = async (params: {
  accessToken: string;
  companyId: string;
  kind: CompanyAssetKind;
  file: File;
}): Promise<CompanyAssetSummary> => {
  const safeFileName = sanitizeFileName(params.file.name);
  const path = `${buildCompanyAssetKindPrefix(params.companyId, params.kind)}/${Date.now()}-${safeFileName}`;
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_COMPANY_ASSETS}/${path}`), {
    method: 'POST',
    headers: buildHeaders(params.accessToken, params.file.type || 'application/octet-stream'),
    body: Buffer.from(await params.file.arrayBuffer()),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  return {
    path,
    name: params.file.name,
    size: params.file.size,
    createdAt: null,
    updatedAt: null,
    mimeType: params.file.type || null,
    downloadUrl: `/api/tenant/assets?path=${encodeURIComponent(path)}&download=1`,
    kind: params.kind,
  };
};

export const deleteSaasCompanyAsset = async (params: {
  accessToken: string;
  path: string;
}) => {
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_COMPANY_ASSETS}/${params.path}`), {
    method: 'DELETE',
    headers: buildHeaders(params.accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }
};

export const downloadSaasCompanyAsset = async (params: {
  accessToken: string;
  path: string;
}) => {
  const response = await fetch(buildStorageUrl(`/object/${BUCKET_COMPANY_ASSETS}/${params.path}`), {
    method: 'GET',
    headers: buildHeaders(params.accessToken),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseStorageError(response));
  }

  return response;
};
