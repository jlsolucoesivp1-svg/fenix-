import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/session';

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro ao carregar sessao:', error);
    return NextResponse.json({ error: 'Falha ao carregar sessao.' }, { status: 500 });
  }
}
