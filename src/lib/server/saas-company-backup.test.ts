import { beforeEach, describe, expect, it, vi } from 'vitest';

const { insertAuditLogs } = vi.hoisted(() => ({ insertAuditLogs: vi.fn() }));
vi.mock('./audit', () => ({ insertAuditLogs }));
vi.mock('./supabase-user', () => ({
  getSupabaseUserConfig: () => ({ url: 'https://example.supabase.co', anonKey: 'anon-key' }),
}));

import { buildSaasCompanyBackup } from './saas-company-backup';

const COMPANY_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COMPANY_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

describe('saas company backup', () => {
  const requestedUrls: URL[] = [];

  beforeEach(() => {
    requestedUrls.length = 0;
    insertAuditLogs.mockReset().mockResolvedValue(undefined);
    vi.stubGlobal('fetch', vi.fn(async (input: string | URL) => {
      const url = new URL(String(input));
      requestedUrls.push(url);
      const table = url.pathname.split('/').pop();
      const rows = table === 'companies'
        ? [{ id: COMPANY_A, slug: 'empresa-a', trade_name: 'Empresa A' }]
        : table === 'company_memberships'
          ? [{ id: 'membership-a', company_id: COMPANY_A, user_id: 'admin-a', role_id: 'role-a', is_owner: true }]
          : table === 'roles'
            ? [{ id: 'role-a', company_id: COMPANY_A, name: 'Admin', is_company_admin: true }]
            : table === 'role_permissions'
              ? [{ role_id: 'role-a', permission_id: 'permission-a' }]
              : [{ id: `${table}-a`, company_id: COMPANY_A }];
      return new Response(JSON.stringify(rows), { status: 200 });
    }));
  });

  it('gera JSON versionado somente com registros da empresa ativa e cria audit log', async () => {
    const backup = await buildSaasCompanyBackup({ accessToken: 'user-token', companyId: COMPANY_A, actorUserId: 'admin-a' });

    expect(backup.metadata).toMatchObject({ version: 1, type: 'fenix-saas-company-backup', company: { id: COMPANY_A, slug: 'empresa-a' } });
    expect(JSON.stringify(backup)).not.toContain(COMPANY_B);
    expect(JSON.stringify(backup)).not.toMatch(/service_role|user-token|anon-key/i);
    expect(insertAuditLogs).toHaveBeenCalledWith([expect.objectContaining({ companyId: COMPANY_A, actorUserId: 'admin-a', action: 'company_backup_exported' })]);
  });

  it('aplica company_id da sessao a todas as tabelas que possuem esse campo', async () => {
    await buildSaasCompanyBackup({ accessToken: 'user-token', companyId: COMPANY_A, actorUserId: 'admin-a' });

    const companyScoped = requestedUrls.filter((url) => !['companies', 'role_permissions'].includes(url.pathname.split('/').pop() || ''));
    expect(companyScoped).not.toHaveLength(0);
    for (const url of companyScoped) {
      expect(url.searchParams.get('company_id') ?? url.searchParams.get('id')).toBe(`eq.${COMPANY_A}`);
    }
  });
});
