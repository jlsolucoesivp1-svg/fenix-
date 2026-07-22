import { unstable_noStore as noStore } from 'next/cache';
import { AdminAuditPage } from '@/components/admin/admin-audit-page';
import { listCompaniesForSuperAdmin, listSuperAdminAuditLogs } from '@/lib/server/saas-control-plane';

export default async function AdminAuditRoute({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  noStore();
  const params = await searchParams;
  const [companies, logs] = await Promise.all([
    listCompaniesForSuperAdmin(),
    listSuperAdminAuditLogs({ companyId: params.companyId || undefined, limit: 50 }),
  ]);

  return <AdminAuditPage companies={companies} initialLogs={logs} initialCompanyId={params.companyId || null} />;
}
