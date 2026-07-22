import { unstable_noStore as noStore } from 'next/cache';
import { AdminCompaniesPage } from '@/components/admin/admin-companies-page';
import { listCompaniesForSuperAdmin } from '@/lib/server/saas-control-plane';

export default async function AdminCompaniesRoute() {
  noStore();
  const companies = await listCompaniesForSuperAdmin();
  return <AdminCompaniesPage initialCompanies={companies} />;
}
