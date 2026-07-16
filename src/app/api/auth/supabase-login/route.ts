import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/server/session';
import {
  clearSupabaseSessionCookies,
  fetchSupabaseUserByAccessToken,
  writeSupabaseSessionCookies,
} from '@/lib/server/supabase-session';
import { getSupabaseUserConfig } from '@/lib/server/supabase-user';
import { getSaasUserPermissions } from '@/lib/server/saas-users';

type SupabasePasswordGrantResponse = {
  access_token?: string;
  refresh_token?: string;
};

const parseSupabaseError = async (response: Response) => {
  try {
    const payload = (await response.json()) as { msg?: string; error_description?: string; message?: string };
    return payload.error_description || payload.msg || payload.message || 'Credenciais invalidas.';
  } catch {
    return 'Credenciais invalidas.';
  }
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();
    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
    }

    const { url, anonKey } = getSupabaseUserConfig();
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        password: normalizedPassword,
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const message = await parseSupabaseError(response);
      const status = response.status === 400 || response.status === 401 ? 401 : 500;
      return NextResponse.json({ error: message }, { status });
    }

    const payload = (await response.json()) as SupabasePasswordGrantResponse;
    if (!payload.access_token) {
      return NextResponse.json({ error: 'Sessao Supabase nao retornou access token.' }, { status: 500 });
    }

    await Promise.all([
      clearSessionCookie(),
      clearSupabaseSessionCookies(),
      writeSupabaseSessionCookies({
        accessToken: payload.access_token,
        refreshToken: payload.refresh_token || null,
      }),
    ]);

    const supabaseSession = await fetchSupabaseUserByAccessToken(payload.access_token);
    if (!supabaseSession) {
      return NextResponse.json({ error: 'Nao foi possivel carregar a sessao Supabase.' }, { status: 500 });
    }

    const effectivePermissions =
      supabaseSession.tenantAccess.canAccessTenant && supabaseSession.tenantAccess.activeCompanyId
        ? await getSaasUserPermissions(supabaseSession.tenantAccess.activeCompanyId, supabaseSession.user.id)
        : null;

    return NextResponse.json({
      user: null,
      authSource: 'supabase-only',
      tenantContext: supabaseSession.tenantContext,
      supabaseUser: supabaseSession.user,
      tenantAccess: supabaseSession.tenantAccess,
      effectivePermissions,
    });
  } catch (error) {
    console.error('Erro no login Supabase:', error);
    return NextResponse.json({ error: 'Falha ao autenticar usuario Supabase.' }, { status: 500 });
  }
}
