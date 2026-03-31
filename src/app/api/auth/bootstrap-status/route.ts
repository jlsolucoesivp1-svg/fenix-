import { NextResponse } from 'next/server';
import { countUsers } from '@/lib/server/postgres';

export async function GET() {
  try {
    const totalUsers = await countUsers();
    return NextResponse.json({ hasUsers: totalUsers > 0 });
  } catch (error) {
    console.error('Erro ao consultar status inicial do sistema:', error);
    return NextResponse.json({ error: 'Falha ao consultar status inicial.' }, { status: 500 });
  }
}
