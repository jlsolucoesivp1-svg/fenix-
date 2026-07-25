import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { currentPassword, newPassword } = await request.json();
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.trim().length < 8) {
    return NextResponse.json({ error: 'Dados de senha invalidos.' }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email;
  if (!email) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });

  const { error: verifyError } = await supabase.auth.signInWithPassword({ email, password: currentPassword.trim() });
  if (verifyError) return NextResponse.json({ error: 'Senha atual invalida.' }, { status: 401 });

  const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
  if (error) return NextResponse.json({ error: 'Nao foi possivel alterar a senha.' }, { status: 400 });
  return NextResponse.json({ success: true });
}
