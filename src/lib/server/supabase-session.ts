import { cookies } from 'next/headers';
import type { SupabaseAuthUserSummary, TenantAccessState, TenantContext } from '@/types/saas';
import { buildTenantContext } from './tenant-context';
import { resolveTenantAccessState } from './tenant-access';
import { getSupabaseUserConfig } from './supabase-user';

const ACCESS_TOKEN_COOKIE_NAME = 'fenix-supabase-access-token';
const REFRESH_TOKEN_COOKIE_NAME = 'fenix-supabase-refresh-token';

type SupabaseUserResponse = {
  id: string;
  email?: string | null;
  app_metadata?: {
    active_company_id?: string;
    login_name?: string;
  } | null;
};

export interface SupabaseSessionState {
  user: SupabaseAuthUserSummary;
  tenantContext: TenantContext;
  tenantAccess: TenantAccessState;
  accessToken: string;
}

const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

const shouldUseSecureCookie = () => {
  if (process.env.SESSION_COOKIE_SECURE === 'true') return true;
  if (process.env.SESSION_COOKIE_SECURE === 'false') return false;
  return process.env.NODE_ENV === 'production';
};

const readSupabaseSessionTokens = async () => {
  const cookieStore = await cookies();
  return {
    accessToken: cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value?.trim() || null,
    refreshToken: cookieStore.get(REFRESH_TOKEN_COOKIE_NAME)?.value?.trim() || null,
  };
};

export const writeSupabaseSessionCookies = async (params: {
  accessToken: string;
  refreshToken?: string | null;
}) => {
  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE_NAME, params.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
  });

  if (params.refreshToken?.trim()) {
    cookieStore.set(REFRESH_TOKEN_COOKIE_NAME, params.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: shouldUseSecureCookie(),
      path: '/',
    });
  }
};

export const clearSupabaseSessionCookies = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE_NAME);
  cookieStore.delete(REFRESH_TOKEN_COOKIE_NAME);
};

export const fetchSupabaseUserByAccessToken = async (
  accessToken: string
): Promise<SupabaseSessionState | null> => {
  if (!accessToken.trim() || !isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabaseUserConfig();
  const response = await fetch(`${url}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as SupabaseUserResponse;
  const loginName = payload.app_metadata?.login_name?.trim() || null;
  const tenantContext = buildTenantContext(payload.id, payload.app_metadata);

  return {
    accessToken,
    user: {
      id: payload.id,
      email: payload.email?.trim() || null,
      loginName,
    },
    tenantContext,
    tenantAccess: await resolveTenantAccessState({ accessToken, tenantContext }),
  };
};

export const getSupabaseSessionState = async (): Promise<SupabaseSessionState | null> => {
  const { accessToken } = await readSupabaseSessionTokens();
  if (!accessToken) {
    return null;
  }

  return fetchSupabaseUserByAccessToken(accessToken);
};
