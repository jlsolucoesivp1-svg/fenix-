import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/server/session';

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json({ error: 'Falha ao encerrar sessao.' }, { status: 500 });
  }
}
