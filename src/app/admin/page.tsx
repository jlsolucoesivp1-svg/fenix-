import { unstable_noStore as noStore } from 'next/cache';
import { AdminDashboardPage } from '@/components/admin/admin-dashboard-page';
import { getSuperAdminDashboardSummary } from '@/lib/server/saas-control-plane';

export default async function AdminDashboardRoute() {
  noStore();
  const summary = await getSuperAdminDashboardSummary();
  return <AdminDashboardPage summary={summary} />;
}
