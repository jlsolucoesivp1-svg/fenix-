'use client';

import * as React from 'react';
import type { User } from '@/types';
import type {
  AppSessionAuthSource,
  SupabaseAuthUserSummary,
  TenantAccessState,
  TenantContext,
} from '@/types/saas';
import type { UserPermissions } from '@/types';
import { getCurrentAppSession, invalidateLoggedInUserCache } from '@/lib/storage';

interface CurrentAppSessionState {
  user: User | null;
  authSource: AppSessionAuthSource;
  tenantContext: TenantContext | null;
  supabaseUser: SupabaseAuthUserSummary | null;
  tenantAccess: TenantAccessState | null;
  effectivePermissions: UserPermissions | null;
  isLoading: boolean;
}

const EMPTY_SESSION: Omit<CurrentAppSessionState, 'isLoading'> = {
  user: null,
  authSource: 'none',
  tenantContext: null,
  supabaseUser: null,
  tenantAccess: null,
  effectivePermissions: null,
};

export function useCurrentAppSession(): CurrentAppSessionState {
  const [sessionState, setSessionState] = React.useState<CurrentAppSessionState>({
    ...EMPTY_SESSION,
    isLoading: true,
  });

  const refreshSession = React.useCallback(async () => {
    try {
      const session = await getCurrentAppSession();
      setSessionState({
        ...session,
        isLoading: false,
      });
    } catch {
      setSessionState({
        ...EMPTY_SESSION,
        isLoading: false,
      });
    }
  }, []);

  React.useEffect(() => {
    void refreshSession();

    const handleSessionChange = () => {
      invalidateLoggedInUserCache();
      void refreshSession();
    };

    window.addEventListener('auth-change', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);

    return () => {
      window.removeEventListener('auth-change', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, [refreshSession]);

  return sessionState;
}
