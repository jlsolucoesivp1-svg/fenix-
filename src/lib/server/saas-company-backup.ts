import { insertAuditLogs } from './audit';
import { getSupabaseUserConfig } from './supabase-user';

const BACKUP_VERSION = 1;

const OPERATIONAL_TABLES = [
  'customers', 'appointments', 'quotes', 'quote_items', 'kits', 'kit_items',
  'products', 'inventory_movements', 'service_orders', 'service_order_items',
  'service_order_payments', 'service_order_notes', 'service_order_history',
  'service_order_views', 'sales', 'sale_items', 'financial_entries', 'idempotency_keys',
] as const;

type OperationalTable = (typeof OPERATIONAL_TABLES)[number];
type JsonRecord = Record<string, unknown>;

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

  await insertAuditLogs([{
    companyId: params.companyId,
    actorUserId: params.actorUserId,
    action: 'company_backup_exported',
    entity: 'company_backup',
    entityId: params.companyId,
    metadata: { version: BACKUP_VERSION, type: backup.metadata.type },
  }]);

  return backup;
};
