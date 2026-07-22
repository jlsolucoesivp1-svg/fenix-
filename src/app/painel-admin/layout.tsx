import { unstable_noStore as noStore } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { getSuperAdminSession } from '@/lib/server/superadmin';

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  noStore();

  const session = await getSuperAdminSession();

  if (!session) {
    redirect('/');
  }

  if (!session.session.user) {
    notFound();
  }

  return children;
}
