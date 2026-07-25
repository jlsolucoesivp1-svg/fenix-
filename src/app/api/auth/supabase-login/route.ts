import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/server/session';
import {
  getSupabaseSessionState,
} from '@/lib/server/supabase-session';
import { assertServiceRoleUsageAllowed, getSupabaseAdminConfig } from '@/lib/server/supabase-admin';
import { getSaasUserPermissions } from '@/lib/server/saas-users';
import { findPlatformAdminForSession } from '@/lib/server/superadmin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type ProfileLookup = {
  id: string;
  email: string | null;
};

type AdminAuthUserResponse = {
  id?: string;
  email?: string | null;
  user?: {
    id?: string;
    email?: string | null;
  };
};

const isEmailIdentifier = (value: string) => value.includes('@');

/**
 * Supabase accepts an e-mail/password grant. The SaaS UI also exposes the
 * optional login_name, so resolve it server-side through the profile that was
 * provisioned with the same Auth UUID. No credential is logged or persisted.
 */
const resolveSupabaseEmail = async (identifier: string): Promise<string | null> => {
  if (isEmailIdentifier(identifier)) {
    return identifier.toLowerCase();
  }

  assertServiceRoleUsageAllowed('resolve_saas_login_name');
  const { url, serviceRoleKey } = getSupabaseAdminConfig();
  const query = new URLSearchParams({
    select: 'id,email',
    login_name: `eq.${identifier.toLowerCase()}`,
    limit: '1',
  });
  const profileResponse = await fetch(`${url}/rest/v1/profiles?${query.toString()}`, {
    method: 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });

  if (!profileResponse.ok) {
    throw new Error(`Falha ao resolver login SaaS (${profileResponse.status}).`);
  }

  const profiles = (await profileResponse.json()) as ProfileLookup[];
  const profile = profiles[0];
  if (!profile?.id) {
    console.info('[auth:supabase-login] login_name_not_found');
    return null;
  }

  // Confirm that the profile still points to an existing Auth user and use the
  // Auth e-mail as the source of truth in case the profile is stale.
  const authResponse = await fetch(`${url}/auth/v1/admin/users/${profile.id}`, {
    method: 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: 'no-store',
  });
  if (!authResponse.ok) {
    console.info('[auth:supabase-login] profile_auth_user_missing', { status: authResponse.status });
    return null;
  }

  const authPayload = (await authResponse.json()) as AdminAuthUserResponse;
  const authUser = authPayload.user ?? authPayload;
  const email = authUser.email?.trim().toLowerCase() || null;
  if (!email || authUser.id !== profile.id) {
    console.info('[auth:supabase-login] profile_auth_user_mismatch');
    return null;
  }

  console.info('[auth:supabase-login] login_name_resolved');
  return email;
};

const parseSupabaseError = async (response: Response) => {
  try {
    const payload = (await response.json()) as {
      error?: string;
      error_code?: string;
      code?: string;
      msg?: string;
      error_description?: string;
      message?: string;
    };
    return {
      message: payload.error_description || payload.msg || payload.message || payload.error || 'Credenciais invalidas.',
      reason: payload.error_code || payload.code || payload.error || null,
    };
  } catch {
    return { message: 'Credenciais invalidas.', reason: 'unparseable_supabase_error' };
  }
};

export async function POST(request: Request) {
  try {
    const { identifier, email, password } = await request.json();
    const rawIdentifier = typeof identifier === 'string' ? identifier : email;

    if (typeof rawIdentifier !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
    }

    const normalizedIdentifier = rawIdentifier.trim();
    const normalizedPassword = password.trim();
    if (!normalizedIdentifier || !normalizedPassword) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
    }
    console.info('[auth:supabase-login] email_received_by_api', { email: normalizedIdentifier });

    const normalizedEmail = await resolveSupabaseEmail(normalizedIdentifier);
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 401 });
    }
    console.info('[auth:supabase-login] email_sent_to_supabase', { email: normalizedEmail });

    const supabase = await createSupabaseServerClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: normalizedPassword,
    });

    if (signInError) {
      console.info('[auth:supabase-login] sign_in_with_password_response', {
        ok: false,
        status: signInError.status || 400,
        reason: signInError.code || null,
        message: signInError.message,
      });
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 401 });
    }

    console.info('[auth:supabase-login] sign_in_with_password_response', { ok: true, status: 200 });
    await clearSessionCookie();
    const supabaseSession = await getSupabaseSessionState();
    if (!supabaseSession) {
      console.info('[auth:supabase-login] authenticated_session_unavailable');
      return NextResponse.json({ error: 'Nao foi possivel carregar a sessao Supabase.' }, { status: 500 });
    }

    const effectivePermissions =
      supabaseSession.tenantAccess.canAccessTenant && supabaseSession.tenantAccess.activeCompanyId
        ? await getSaasUserPermissions(supabaseSession.tenantAccess.activeCompanyId, supabaseSession.user.id)
        : null;

    const appSession = {
      user: null,
      authSource: 'supabase-only' as const,
      tenantContext: supabaseSession.tenantContext,
      supabaseUser: supabaseSession.user,
      tenantAccess: supabaseSession.tenantAccess,
      effectivePermissions,
    };
    const isPlatformAdmin = Boolean(await findPlatformAdminForSession(appSession));
    console.info('[auth:supabase-login] authenticated', {
      tenantAccess: supabaseSession.tenantAccess.status,
      isPlatformAdmin,
    });

    return NextResponse.json({
      ...appSession,
      isPlatformAdmin,
    });
  } catch (error) {
    console.error('Erro no login Supabase:', error);
    return NextResponse.json({ error: 'Falha ao autenticar usuario Supabase.' }, { status: 500 });
  }
}
