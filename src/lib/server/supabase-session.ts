import type { JwtAppMetadata, SupabaseAuthUserSummary, TenantAccessState, TenantContext } from '@/types/saas';
import { buildTenantContext } from './tenant-context';
import { resolveTenantAccessState } from './tenant-access';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface SupabaseSessionState {
  user: SupabaseAuthUserSummary;
  tenantContext: TenantContext;
  tenantAccess: TenantAccessState;
  accessToken: string;
}

export const fetchSupabaseUserByAccessToken = async (_accessToken: string): Promise<SupabaseSessionState | null> =>
  getSupabaseSessionState();

export const getSupabaseSessionState = async (): Promise<SupabaseSessionState | null> => {
  const supabase = await createSupabaseServerClient();
  const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ]);
  const user = userData.user;
  const accessToken = sessionData.session?.access_token;
  if (userError || !user || !accessToken) return null;

  const loginName = typeof user.app_metadata.login_name === 'string' ? user.app_metadata.login_name.trim() || null : null;
  const tenantContext = buildTenantContext(user.id, user.app_metadata as JwtAppMetadata);
  return {
    accessToken,
    user: { id: user.id, email: user.email?.trim() || null, loginName },
    tenantContext,
    tenantAccess: await resolveTenantAccessState({ accessToken, tenantContext }),
  };
};

export const clearSupabaseSessionCookies = async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
};

// Kept only for compatibility while the remaining callers migrate. Tokens are
// never written manually; @supabase/ssr owns the cookie lifecycle.
export const writeSupabaseSessionCookies = async () => undefined;
