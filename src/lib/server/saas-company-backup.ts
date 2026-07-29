import { insertAuditLogs } from './audit';
import { getSupabaseUserConfig } from './supabase-user';
import { createStoredZip, sha256, type ZipEntry } from './zip-store';

const BACKUP_VERSION = 1;

const OPERATIONAL_TABLES = [
  'customers', 'appointments', 'quotes', 'quote_items', 'kits', 'kit_items',
  'products', 'inventory_movements', 'service_orders', 'service_order_items',
  'service_order_payments', 'service_order_notes', 'service_order_history',
  'service_order_views', 'sales', 'sale_items', 'financial_entries', 'idempotency_keys',
] as const;

type OperationalTable = (typeof OPERATIONAL_TABLES)[number];
type JsonRecord = Record<string, unknown>;
const STORAGE_BUCKETS = ['company-assets', 'customer-files', 'service-order-files'] as const;
const MAX_STORAGE_FILES = 250;
const MAX_STORAGE_BYTES = 25 * 1024 * 1024;

const headers = (accessToken: string) => ({
  apikey: getSupabaseUserConfig().anonKey,
  Authorization: `Bearer ${accessToken}`,
});

const restUrl = (table: string, params: Record<string, string>) => {
  const search = new URLSearchParams(params);
  return `${getSupabaseUserConfig().url}/rest/v1/${table}?${search.toString()}`;
};

const readRows = async (params: { accessToken: string; table: string; query: Record<string, string> }) => {
  const response = await fetch(restUrl(params.table, { select: '*', ...params.query }), {
    headers: headers(params.accessToken),
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Falha ao ler ${params.table} para backup (${response.status}).`);
  }
  return (await response.json()) as JsonRecord[];
};

export type SaasCompanyBackup = {
  metadata: {
    version: number;
    type: 'fenix-saas-company-backup';
    createdAt: string;
    company: { id: string; slug: string; tradeName: string };
    storage: { binaryFilesIncluded: false; note: string };
  };
  data: {
    company: JsonRecord | null;
    settings: JsonRecord | null;
    branding: JsonRecord | null;
    memberships: JsonRecord[];
    roles: JsonRecord[];
    rolePermissions: JsonRecord[];
    operational: Partial<Record<OperationalTable, JsonRecord[]>>;
  };
};

export const buildSaasCompanyBackup = async (params: {
  accessToken: string;
  companyId: string;
  actorUserId: string;
  auditAction?: string | null;
}): Promise<SaasCompanyBackup> => {
  const [companies, settings, branding, memberships, roles, ...operationalRows] = await Promise.all([
    readRows({ accessToken: params.accessToken, table: 'companies', query: { id: `eq.${params.companyId}`, limit: '1' } }),
    readRows({ accessToken: params.accessToken, table: 'company_settings', query: { company_id: `eq.${params.companyId}`, limit: '1' } }),
    readRows({ accessToken: params.accessToken, table: 'company_branding', query: { company_id: `eq.${params.companyId}`, limit: '1' } }),
    readRows({ accessToken: params.accessToken, table: 'company_memberships', query: { company_id: `eq.${params.companyId}` } }),
    readRows({ accessToken: params.accessToken, table: 'roles', query: { company_id: `eq.${params.companyId}` } }),
    ...OPERATIONAL_TABLES.map((table) =>
      readRows({ accessToken: params.accessToken, table, query: { company_id: `eq.${params.companyId}` } })
    ),
  ]);

  const company = companies[0] ?? null;
  if (!company || typeof company.slug !== 'string' || typeof company.trade_name !== 'string') {
    throw new Error('Empresa ativa nao encontrada para gerar o backup.');
  }

  const roleIds = roles.map((role) => role.id).filter((id): id is string => typeof id === 'string');
  const rolePermissions = roleIds.length === 0
    ? []
    : await readRows({
        accessToken: params.accessToken,
        table: 'role_permissions',
        query: { role_id: `in.(${roleIds.join(',')})` },
      });

  const operational = Object.fromEntries(
    OPERATIONAL_TABLES.map((table, index) => [table, operationalRows[index]])
  ) as Partial<Record<OperationalTable, JsonRecord[]>>;

  const backup: SaasCompanyBackup = {
    metadata: {
      version: BACKUP_VERSION,
      type: 'fenix-saas-company-backup',
      createdAt: new Date().toISOString(),
      company: { id: params.companyId, slug: company.slug, tradeName: company.trade_name },
      storage: {
        binaryFilesIncluded: false,
        note: 'Arquivos dos buckets company-assets, customer-files e service-order-files nao fazem parte deste JSON.',
      },
    },
    data: {
      company,
      settings: settings[0] ?? null,
      branding: branding[0] ?? null,
      memberships,
      roles,
      rolePermissions,
      operational,
    },
  };

  if (params.auditAction !== null) await insertAuditLogs([{
    companyId: params.companyId,
    actorUserId: params.actorUserId,
    action: params.auditAction || 'company_backup_exported',
    entity: 'company_backup',
    entityId: params.companyId,
    metadata: { version: BACKUP_VERSION, type: backup.metadata.type },
  }]);

  return backup;
};

type StorageListRow = { name: string; id?: string | null; metadata?: { size?: number; mimetype?: string } | null };
type ManifestFile = { originalPath: string; zipPath: string; bucket: string; size: number; contentType: string | null; checksumSha256: string };

const storageUrl = (path: string) => `${getSupabaseUserConfig().url}/storage/v1${path}`;
const storageHeaders = (accessToken: string) => ({ ...headers(accessToken), 'Content-Type': 'application/json' });
const isTenantPath = (path: string, companyId: string) => path.startsWith(`${companyId}/`) && !path.includes('..') && !path.startsWith('/');

const listTenantStorage = async (accessToken: string, bucket: string, companyId: string) => {
  const response = await fetch(storageUrl(`/object/list/${bucket}`), {
    method: 'POST', headers: storageHeaders(accessToken),
    body: JSON.stringify({ prefix: companyId, limit: MAX_STORAGE_FILES, sortBy: { column: 'name', order: 'asc' } }), cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Falha ao listar bucket ${bucket} (${response.status}).`);
  const rows = await response.json() as StorageListRow[];
  return rows.filter((row) => row.name && !row.id?.startsWith('folder')).map((row) => ({ ...row, path: `${companyId}/${row.name}` }));
};

export type FullBackupResult = { archive: Buffer; fileName: string; warnings: string[]; totalFiles: number; totalBytes: number };

export const buildSaasCompanyFullBackup = async (params: { accessToken: string; companyId: string; actorUserId: string }): Promise<FullBackupResult> => {
  const backup = await buildSaasCompanyBackup({ ...params, auditAction: null });
  const backupId = crypto.randomUUID();
  const warnings: string[] = [];
  const entries: ZipEntry[] = [];
  const manifestFiles: ManifestFile[] = [];
  let totalBytes = 0;

  for (const bucket of STORAGE_BUCKETS) {
    let objects: Array<StorageListRow & { path: string }>;
    try { objects = await listTenantStorage(params.accessToken, bucket, params.companyId); }
    catch (error) { warnings.push(error instanceof Error ? error.message : `Bucket ${bucket} indisponivel.`); continue; }
    for (const object of objects) {
      if (!isTenantPath(object.path, params.companyId)) throw new Error(`Risco de isolamento detectado no bucket ${bucket}.`);
      if (entries.length >= MAX_STORAGE_FILES) throw new Error(`Limite de ${MAX_STORAGE_FILES} arquivos do backup completo excedido.`);
      const response = await fetch(storageUrl(`/object/${bucket}/${object.path}`), { headers: headers(params.accessToken), cache: 'no-store' });
      if (!response.ok) { warnings.push(`Arquivo ignorado: ${bucket}/${object.path} (${response.status}).`); continue; }
      const content = Buffer.from(await response.arrayBuffer());
      if (totalBytes + content.length > MAX_STORAGE_BYTES) throw new Error('Limite de 25 MB de arquivos do backup completo excedido.');
      const zipPath = `storage/${bucket}/${object.path}`;
      entries.push({ path: zipPath, content }); totalBytes += content.length;
      manifestFiles.push({ originalPath: object.path, zipPath, bucket, size: content.length, contentType: response.headers.get('content-type'), checksumSha256: sha256(content) });
    }
  }

  const enriched = {
    ...backup,
    metadata: {
      ...backup.metadata,
      backupId, backupFormatVersion: 1, schemaVersion: 1, applicationVersion: process.env.npm_package_version || null,
      storage: { binaryFilesIncluded: true, bucketList: STORAGE_BUCKETS, fileCount: manifestFiles.length, totalBytes },
      integrity: { algorithm: 'SHA-256', dataChecksum: sha256(Buffer.from(JSON.stringify(backup.data))) },
    },
  };
  const backupJson = Buffer.from(JSON.stringify(enriched, null, 2));
  const manifest = {
    backupId, backupFormatVersion: 1, schemaVersion: 1, applicationVersion: enriched.metadata.applicationVersion,
    createdAt: backup.metadata.createdAt, companyId: params.companyId, companySlug: backup.metadata.company.slug,
    companyTradeName: backup.metadata.company.tradeName, backupType: 'full', databaseFile: 'backup.json', includedBuckets: STORAGE_BUCKETS,
    totalFiles: manifestFiles.length, totalStorageBytes: totalBytes, files: manifestFiles, backupJsonChecksumSha256: sha256(backupJson),
    ignoredItems: warnings, warnings, integrityStatus: warnings.length ? 'complete_with_warnings' : 'complete',
  };
  entries.unshift({ path: 'backup.json', content: backupJson }, { path: 'manifest.json', content: Buffer.from(JSON.stringify(manifest, null, 2)) });
  const archive = createStoredZip(entries);
  await insertAuditLogs([{ companyId: params.companyId, actorUserId: params.actorUserId, action: 'company_full_backup_exported', entity: 'company_backup', entityId: backupId, metadata: { fileCount: manifestFiles.length, totalBytes, warnings: warnings.length } }]);
  return { archive, fileName: `fenix-saas-${backup.metadata.company.slug}-${backup.metadata.createdAt.slice(0, 10)}.zip`, warnings, totalFiles: manifestFiles.length, totalBytes };
};
