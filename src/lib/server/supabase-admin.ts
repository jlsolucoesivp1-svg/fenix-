const requireEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} nao configurada.`);
  }
  return value;
};

const readEnv = (name: string): string | null => {
  const value = process.env[name]?.trim();
  return value ? value : null;
};

export interface SupabaseAdminConfig {
  url: string;
  serviceRoleKey: string;
}

export const getOptionalSupabaseAdminConfig = (): SupabaseAdminConfig | null => {
  const url = readEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    serviceRoleKey,
  };
};

export const getSupabaseAdminConfig = (): SupabaseAdminConfig => ({
  url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  serviceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
});

export const assertServiceRoleUsageAllowed = (purpose: string) => {
  if (!purpose.trim()) {
    throw new Error('Uso de service role sem finalidade declarada.');
  }
};
