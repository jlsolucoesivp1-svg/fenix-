import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/server/session';
import { clearSupabaseSessionCookies } from '@/lib/server/supabase-session';

export async function POST() {
  try {
    await Promise.all([clearSessionCookie(), clearSupabaseSessionCookies()]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json({ error: 'Falha ao encerrar sessao.' }, { status: 500 });
  }
}
