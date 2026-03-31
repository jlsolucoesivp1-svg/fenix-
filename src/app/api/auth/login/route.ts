import { NextResponse } from 'next/server';
import type { User } from '@/types';
import { getUserByLogin } from '@/lib/server/postgres';
import { writeSessionCookie } from '@/lib/server/session';

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    if (typeof login !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
    }

    const user = await getUserByLogin<User>(login);
    if (!user || Buffer.from(user.password || '', 'base64').toString('utf8') !== password) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 401 });
    }

    await writeSessionCookie(user.id);
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Falha ao autenticar usuario.' }, { status: 500 });
  }
}
