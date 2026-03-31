'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getLoggedInUser, signOut } from '@/lib/storage';

export function BrowserSessionGuard() {
  const router = useRouter();

  React.useEffect(() => {
    void getLoggedInUser().then((user) => {
      if (user) {
        return;
      }

      void signOut().finally(() => {
        router.replace('/');
      });
    });
  }, [router]);

  return null;
}
