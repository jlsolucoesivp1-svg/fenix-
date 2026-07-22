'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';
import { hasActiveBrowserSession, signOut } from '@/lib/storage';

export function BrowserSessionGuard() {
  const router = useRouter();
  const { authSource, isLoading } = useCurrentAppSession();

  React.useEffect(() => {
    if (isLoading) {
      return;
    }

    if (authSource === 'supabase-only') {
      return;
    }

    if (hasActiveBrowserSession()) {
      return;
    }

    void signOut().finally(() => {
      router.replace('/');
    });
  }, [authSource, isLoading, router]);

  return null;
}
