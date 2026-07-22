import { unstable_noStore as noStore } from 'next/cache';
import { AdminUsersPage } from '@/components/admin/admin-users-page';
import { listCompaniesForSuperAdmin } from '@/lib/server/saas-control-plane';

export default async function AdminUsersRoute({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  noStore();
  const params = await searchParams;
  const companies = await listCompaniesForSuperAdmin();
  return <AdminUsersPage companies={companies} initialCompanyId={params.companyId || null} />;
}
