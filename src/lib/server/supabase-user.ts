const readEnv = (name: string): string => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} nao configurada.`);
  }
  return value;
};

export interface SupabaseUserConfig {
  url: string;
  anonKey: string;
}

export const getSupabaseUserConfig = (): SupabaseUserConfig => ({
  url: readEnv('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
});
