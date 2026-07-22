import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getAuthenticatedAppSession } from '@/lib/server/session';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  noStore();

  const session = await getAuthenticatedAppSession();
  const canAccessApp = Boolean(session.user) || session.tenantAccess?.canAccessTenant === true;

  if (!canAccessApp) {
    redirect('/');
  }

  return <AppShell>{children}</AppShell>;
}
