import { unstable_noStore as noStore } from 'next/cache';
import { AdminMembershipsPage } from '@/components/admin/admin-memberships-page';
import { listCompaniesForSuperAdmin } from '@/lib/server/saas-control-plane';

export default async function AdminMembershipsRoute({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  noStore();
  const params = await searchParams;
  const companies = await listCompaniesForSuperAdmin();
  return <AdminMembershipsPage companies={companies} initialCompanyId={params.companyId || null} />;
}
