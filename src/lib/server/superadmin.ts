import { NextResponse } from 'next/server';
import { insertAuditLogs } from './audit';
import type { AuthenticatedAppSession } from './session';
import { getAuthenticatedAppSession } from './session';
import {
  assertServiceRoleUsageAllowed,
  getOptionalSupabaseAdminConfig,
  getSupabaseAdminConfig,
} from './supabase-admin';

type PlatformAdminRow = {
  id: string;
  supabase_user_id: string | null;
  legacy_user_id: string | null;
  email: string | null;
  display_name: string | null;
  status: 'active' | 'inactive';
};

export interface PlatformAdminIdentity {
  id: string;
  supabaseUserId: string | null;
  legacyUserId: string | null;
  email: string | null;
  displayName: string | null;
  status: 'active' | 'inactive';
}

export interface SuperAdminSessionContext {
  session: AuthenticatedAppSession;
  platformAdmin: PlatformAdminIdentity;
}

let hasWarnedMissingAdminConfig = false;

const buildRestUrl = (params: Record<string, string>) => {
  const { url } = getSupabaseAdminConfig();
  const search = new URLSearchParams({
    select: 'id,supabase_user_id,legacy_user_id,email,display_name,status',
    ...params,
    limit: '1',
  });
  return `${url}/rest/v1/platform_admins?${search.toString()}`;
};

const buildHeaders = () => {
  const { serviceRoleKey } = getSupabaseAdminConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
};

const normalizePlatformAdmin = (row: PlatformAdminRow): PlatformAdminIdentity => ({
  id: row.id,
  supabaseUserId: row.supabase_user_id,
  legacyUserId: row.legacy_user_id,
  email: row.email,
  displayName: row.display_name,
  status: row.status,
});

const restFindPlatformAdmin = async (params: Record<string, string>) => {
  assertServiceRoleUsageAllowed('find_platform_admin');

  if (!getOptionalSupabaseAdminConfig()) {
    if (!hasWarnedMissingAdminConfig) {
      hasWarnedMissingAdminConfig = true;
      console.warn(
        'Painel administrativo indisponivel: NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY nao configurada(s).'
      );
    }
    return null;
  }

  const response = await fetch(buildRestUrl(params), {
    method: 'GET',
    headers: buildHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao consultar platform_admins.');
  }

  const rows = (await response.json()) as PlatformAdminRow[];
  return rows[0] ? normalizePlatformAdmin(rows[0]) : null;
};

export const findPlatformAdminForSession = async (
  session: AuthenticatedAppSession
): Promise<PlatformAdminIdentity | null> => {
  const supabaseUserId = session.supabaseUser?.id?.trim() || null;
  const legacyUserId = session.user?.id?.trim() || null;
  const email = session.supabaseUser?.email?.trim().toLowerCase() || null;

  const lookups: Array<Record<string, string> | null> = [
    supabaseUserId ? { supabase_user_id: `eq.${supabaseUserId}`, status: 'eq.active' } : null,
    legacyUserId ? { legacy_user_id: `eq.${legacyUserId}`, status: 'eq.active' } : null,
    email ? { email: `ilike.${email}`, status: 'eq.active' } : null,
  ];

  for (const lookup of lookups) {
    if (!lookup) {
      continue;
    }

    const match = await restFindPlatformAdmin(lookup);
    if (match) {
      return match;
    }
  }

  return null;
};

export const getSuperAdminSession = async (): Promise<SuperAdminSessionContext | null> => {
  const session = await getAuthenticatedAppSession();
  if (session.authSource === 'none') {
    return null;
  }

  const platformAdmin = await findPlatformAdminForSession(session);
  if (!platformAdmin) {
    return null;
  }

  return {
    session,
    platformAdmin,
  };
};

export const requireSuperAdminApiSession = async (
  errorMessage = 'Acesso restrito ao painel administrativo da JL Informatica.'
): Promise<SuperAdminSessionContext | NextResponse> => {
  const session = await getAuthenticatedAppSession();
  const platformAdmin = session.authSource === 'none' ? null : await findPlatformAdminForSession(session);

  if (!platformAdmin) {
    if (session.authSource === 'none') {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    try {
      await insertAuditLogs([
        {
          actorUserId: session.supabaseUser?.id || null,
          action: 'superadmin_access_denied',
          entity: 'platform_admin',
          success: false,
          severity: 'warn',
          metadata: {
            legacy_user_id: session.user?.id || null,
            legacy_login: session.user?.login || null,
            supabase_email: session.supabaseUser?.email || null,
          },
        },
      ]);
    } catch (error) {
      console.error('Falha ao registrar tentativa negada de acesso superadmin:', error);
    }

    return NextResponse.json({ error: errorMessage }, { status: 403 });
  }

  return {
    session,
    platformAdmin,
  };
};
