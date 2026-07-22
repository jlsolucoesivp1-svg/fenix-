import { unstable_noStore as noStore } from 'next/cache';
import { AdminConfigPage } from '@/components/admin/admin-config-page';
import { getSuperAdminSession } from '@/lib/server/superadmin';

export default async function AdminConfigRoute() {
  noStore();
  const context = await getSuperAdminSession();
  if (!context) {
    return null;
  }

  const operatorLabel =
    context.platformAdmin.displayName ||
    context.session.user?.name ||
    context.session.supabaseUser?.loginName ||
    context.session.supabaseUser?.email ||
    'JL Superadmin';
  const operatorEmail = context.session.supabaseUser?.email || context.platformAdmin.email || null;

  return <AdminConfigPage operatorLabel={operatorLabel} operatorEmail={operatorEmail} />;
}
