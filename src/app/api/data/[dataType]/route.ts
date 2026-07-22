import { NextResponse } from 'next/server';
import type { User, UserPermissions } from '@/types';
import { normalizeIncomingPassword, sanitizeUsers } from '@/lib/server/auth';
import { requireAuthenticatedUser, requirePermission } from '@/lib/server/authz';
import { isCollectionDataType, isSingletonDataType } from '@/lib/server/data-types';
import { getSingleton, listCollection, replaceCollection, saveSingleton } from '@/lib/server/postgres';

type RouteContext = {
  params: Promise<{ dataType: string }>;
};

const collectionPermissions: Partial<Record<string, keyof UserPermissions>> = {
  customers: 'accessClients',
  serviceOrders: 'accessServiceOrders',
  stock: 'accessInventory',
  sales: 'accessSales',
  financialTransactions: 'accessFinancials',
  appointments: 'accessAgenda',
  quotes: 'accessQuotes',
  kits: 'accessInventory',
  serviceOrderViews: 'accessServiceOrders',
};

const singletonPermissions: Partial<Record<string, keyof UserPermissions>> = {
  companyInfo: 'accessSettings',
  settings: 'accessSettings',
};

const requireDataAccess = async (dataType: string) => {
  if (dataType === 'users') {
    return requirePermission('canManageUsers', 'Voce nao tem permissao para gerenciar usuarios.');
  }

  const singletonPermission = singletonPermissions[dataType];
  if (singletonPermission) {
    return requirePermission(singletonPermission, 'Voce nao tem permissao para alterar configuracoes.');
  }

  const collectionPermission = collectionPermissions[dataType];
  if (collectionPermission) {
    return requirePermission(collectionPermission, 'Voce nao tem permissao para acessar este modulo.');
  }

  return requireAuthenticatedUser();
};

const normalizeUsersPayload = async (payload: unknown): Promise<User[]> => {
  if (!Array.isArray(payload)) {
    throw new Error('Payload invalido para usuarios.');
  }

  const existingUsers = await listCollection<User>('users');
  const existingUsersById = new Map(existingUsers.map((user) => [user.id, user]));
  const existingUsersByLogin = new Map(existingUsers.map((user) => [user.login, user]));

  return Promise.all(
    payload.map(async (item) => {
      const user = item as User;
      const existingUser = existingUsersById.get(user.id) ?? existingUsersByLogin.get(user.login);
      const normalizedPassword = await normalizeIncomingPassword(user.password, existingUser?.password);

      if (!normalizedPassword) {
        throw new Error(`Usuario ${user.login || user.id || 'sem identificador'} sem senha valida.`);
      }

      return {
        ...user,
        password: normalizedPassword,
      };
    })
  );
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { dataType } = await context.params;
    const authResult = await requireDataAccess(dataType);
    if (authResult instanceof NextResponse) return authResult;

    if (isCollectionDataType(dataType)) {
      const records = await listCollection(dataType);
      if (dataType === 'users') {
        return NextResponse.json(sanitizeUsers(records as User[]));
      }
      return NextResponse.json(records);
    }

    if (isSingletonDataType(dataType)) {
      const record = await getSingleton(dataType);
      return NextResponse.json(record);
    }

    return NextResponse.json({ error: 'Tipo de dado invalido.' }, { status: 404 });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    return NextResponse.json({ error: 'Falha ao buscar dados.' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { dataType } = await context.params;
    const authResult = await requireDataAccess(dataType);
    if (authResult instanceof NextResponse) return authResult;
    const payload = await request.json();

    if (isCollectionDataType(dataType)) {
      if (!Array.isArray(payload)) {
        return NextResponse.json({ error: 'Payload invalido para colecao.' }, { status: 400 });
      }

      if (dataType === 'users') {
        let normalizedUsers: User[];
        try {
          normalizedUsers = await normalizeUsersPayload(payload);
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Payload invalido para usuarios.' },
            { status: 400 }
          );
        }
        await replaceCollection(dataType, normalizedUsers);
      } else {
        await replaceCollection(dataType, payload);
      }

      return NextResponse.json({ success: true });
    }

    if (isSingletonDataType(dataType)) {
      if (!payload || typeof payload !== 'object') {
        return NextResponse.json({ error: 'Payload invalido para singleton.' }, { status: 400 });
      }

      await saveSingleton(dataType, payload);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Tipo de dado invalido.' }, { status: 404 });
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    return NextResponse.json({ error: 'Falha ao salvar dados.' }, { status: 500 });
  }
}
