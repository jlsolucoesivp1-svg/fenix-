import { NextResponse } from 'next/server';
import type { UserPermissions } from '@/types';
import { hasUserPermission } from '@/lib/permissions';
import { getAuthenticatedAppSession } from './session';
import { getSupabaseSessionState, type SupabaseSessionState } from './supabase-session';

export interface SaasRequestContext {
  accessToken: string;
  companyId: string;
  userId: string;
  effectivePermissions: UserPermissions | null;
  supabaseSession: SupabaseSessionState;
}

export const requireSaasPermission = async (
  permission: keyof UserPermissions,
  unavailableMessage: string,
  deniedMessage = 'Acesso negado.'
): Promise<SaasRequestContext | NextResponse> => {
  const session = await getAuthenticatedAppSession();
  if (
    session.authSource === 'legacy' ||
    !session.tenantAccess?.canAccessTenant ||
    !session.tenantAccess.activeCompanyId
  ) {
    return NextResponse.json({ error: unavailableMessage }, { status: 403 });
  }

  if (!hasUserPermission(session.effectivePermissions, permission)) {
    return NextResponse.json({ error: deniedMessage }, { status: 403 });
  }

  const supabaseSession = await getSupabaseSessionState();
  if (!supabaseSession) {
    return NextResponse.json({ error: 'Sessao Supabase indisponivel.' }, { status: 401 });
  }

  return {
    accessToken: supabaseSession.accessToken,
    companyId: session.tenantAccess.activeCompanyId,
    userId: supabaseSession.user.id,
    effectivePermissions: session.effectivePermissions,
    supabaseSession,
  };
};
