import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { AdminShell } from '@/components/admin/admin-shell';
import { getSuperAdminSession } from '@/lib/server/superadmin';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  noStore();

  const context = await getSuperAdminSession();
  if (!context) {
    redirect('/');
  }

  const operatorLabel =
    context.platformAdmin.displayName ||
    context.session.user?.name ||
    context.session.supabaseUser?.loginName ||
    context.session.supabaseUser?.email ||
    'JL Superadmin';
  const operatorEmail = context.session.supabaseUser?.email || context.platformAdmin.email || null;

  return (
    <AdminShell operatorLabel={operatorLabel} operatorEmail={operatorEmail}>
      {children}
    </AdminShell>
  );
}
