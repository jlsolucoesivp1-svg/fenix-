import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { email } = await request.json();
  if (typeof email !== 'string' || !email.trim()) return NextResponse.json({ error: 'E-mail invalido.' }, { status: 400 });
  const origin = (await headers()).get('origin') || new URL(request.url).origin;
  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });
  // Always return success to avoid account enumeration.
  return NextResponse.json({ success: true });
}
