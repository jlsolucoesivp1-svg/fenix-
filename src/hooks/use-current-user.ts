
'use client';

import * as React from 'react';
import type { User } from '@/types';
import { getLoggedInUser, invalidateLoggedInUserCache } from '@/lib/storage';

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

    const handleUserStateChange = () => {
      invalidateLoggedInUserCache();
      void checkUser();
    };

    window.addEventListener('auth-change', handleUserStateChange);
    // Also listen for the standard storage event for cross-tab sync
    window.addEventListener('storage', handleUserStateChange);
    
    return () => {
      window.removeEventListener('auth-change', handleUserStateChange);
      window.removeEventListener('storage', handleUserStateChange);
    };
  }, [checkUser]);

  return authState;
}
