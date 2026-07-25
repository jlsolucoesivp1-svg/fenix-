import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  if (typeof password !== 'string' || password.trim().length < 8) {
    return NextResponse.json({ error: 'A senha deve ter ao menos 8 caracteres.' }, { status: 400 });
  }
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'Link de recuperacao invalido ou expirado.' }, { status: 401 });
  const { error } = await supabase.auth.updateUser({ password: password.trim() });
  if (error) return NextResponse.json({ error: 'Nao foi possivel redefinir a senha.' }, { status: 400 });
  return NextResponse.json({ success: true });
}
