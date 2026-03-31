import { NextResponse } from 'next/server';
import type { User } from '@/types';
import { countUsers, getUserByLogin, listCollection, replaceCollection } from '@/lib/server/postgres';

export async function POST(request: Request) {
  try {
    const { name, login, password } = await request.json();

    if (typeof name !== 'string' || typeof login !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Dados invalidos para cadastro.' }, { status: 400 });
    }

    const totalUsers = await countUsers();
    if (totalUsers > 0) {
      return NextResponse.json({ error: 'Cadastro inicial nao esta mais disponivel.' }, { status: 403 });
    }

    const existingUser = await getUserByLogin<User>(login);
    if (existingUser) {
      return NextResponse.json({ error: 'Este login ja esta em uso.' }, { status: 409 });
    }

    const users = await listCollection<User>('users');
    const newUser: User = {
      id: `USER-${Date.now()}`,
      name,
      login,
      password: Buffer.from(password, 'utf8').toString('base64'),
      permissions: {
        accessDashboard: true, accessClients: true, accessServiceOrders: true,
        accessInventory: true, accessSales: true, accessFinancials: true,
        accessSettings: true, accessDangerZone: true, accessAgenda: true,
        accessQuotes: true, accessLaudos: true, canEdit: true, canDelete: true,
        canViewPasswords: true, canManageUsers: true
      }
    };

    await replaceCollection('users', [newUser, ...users]);
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    console.error('Erro no cadastro inicial:', error);
    return NextResponse.json({ error: 'Falha ao criar usuario inicial.' }, { status: 500 });
  }
}
