import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/server/session';
import {
  getSupabaseSessionState,
} from '@/lib/server/supabase-session';
import { getSaasUserPermissions } from '@/lib/server/saas-users';
import { findPlatformAdminForSession } from '@/lib/server/superadmin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (!normalizedEmail || !normalizedEmail.includes('@') || !normalizedPassword) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
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
