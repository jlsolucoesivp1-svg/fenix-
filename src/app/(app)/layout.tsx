import { unstable_noStore as noStore } from 'next/cache';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { getAuthenticatedUser } from '@/lib/server/session';
import { getSystemActivation } from '@/lib/server/activation';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  noStore();

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect('/');
  }

  const activation = await getSystemActivation();
  if (activation.status !== 'active') {
    redirect('/');
  }

  return <AppShell>{children}</AppShell>;
}
