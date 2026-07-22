import { NextResponse } from 'next/server';
import type { User } from '@/types';
import { sanitizeUser, verifyPassword } from '@/lib/server/auth';
import { getUserByLogin, upsertCollectionRecord } from '@/lib/server/postgres';
import { writeSessionCookie } from '@/lib/server/session';

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();

    if (typeof login !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
    }

    const normalizedLogin = login.trim();
    const normalizedPassword = password.trim();
    if (!normalizedLogin || !normalizedPassword) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 400 });
    }

    const user = await getUserByLogin<User>(normalizedLogin);
    const passwordCheck = await verifyPassword(user?.password, normalizedPassword);
    if (!user || !passwordCheck.valid) {
      return NextResponse.json({ error: 'Credenciais invalidas.' }, { status: 401 });
    }

    if (passwordCheck.needsUpgrade && passwordCheck.upgradedHash) {
      await upsertCollectionRecord('users', {
        ...user,
        password: passwordCheck.upgradedHash,
      });
    }

    await writeSessionCookie(user.id);
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Falha ao autenticar usuario.' }, { status: 500 });
  }
}
