
'use client';

import * as React from 'react';
import type { User } from '@/types';
import { getLoggedInUser } from '@/lib/storage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export function useCurrentUser(): AuthState {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isLoading: true,
  });

  const checkUser = React.useCallback(async () => {
    try {
      const user = await getLoggedInUser();
      setAuthState({ user, isLoading: false });
    } catch (error) {
      setAuthState({ user: null, isLoading: false });
    }
  }, []);

  React.useEffect(() => {
    checkUser();
    
    // Listen for custom storage event to re-check user
    window.addEventListener('storage-change', checkUser);
    // Also listen for the standard storage event for cross-tab sync
    window.addEventListener('storage', checkUser);
    
    return () => {
      window.removeEventListener('storage-change', checkUser);
      window.removeEventListener('storage', checkUser);
    };
  }, [checkUser]);

  return authState;
}
