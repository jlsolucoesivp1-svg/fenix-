'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  getFirstAllowedPath,
  getModuleLabelForPath,
  getRequiredPermissionForPath,
  hasUserPermission,
} from '@/lib/permissions';
import { useCurrentAppSession } from '@/hooks/use-current-app-session';

export function SupabaseModuleGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { authSource, effectivePermissions, isLoading } = useCurrentAppSession();

  React.useEffect(() => {
    if (isLoading || authSource !== 'supabase-only') {
      return;
    }

    const requiredPermission = getRequiredPermissionForPath(pathname);
    if (!requiredPermission) {
      return;
    }

    if (hasUserPermission(effectivePermissions, requiredPermission)) {
      return;
    }

    const fallbackPath = getFirstAllowedPath(effectivePermissions) || '/';
    const blockedModule = getModuleLabelForPath(pathname) || pathname;
    window.sessionStorage.setItem('fenix:last-denied-module', blockedModule);
    router.replace(fallbackPath);
  }, [authSource, effectivePermissions, isLoading, pathname, router]);

  return null;
}
