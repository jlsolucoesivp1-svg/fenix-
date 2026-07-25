import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const getConfig = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) throw new Error('Supabase nao configurado.');
  return { url, key };
};

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();
  const { url, key } = getConfig();

  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (items) => {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot mutate cookies; middleware refreshes them.
        }
      },
    },
  });
};
