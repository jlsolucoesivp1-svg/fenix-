import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/server/session';
import { isCollectionDataType, isSingletonDataType } from '@/lib/server/data-types';
import { getSingleton, listCollection, replaceCollection, saveSingleton } from '@/lib/server/postgres';

type RouteContext = {
  params: Promise<{ dataType: string }>;
};

const requireUser = async () => {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
  }
  return user;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;

    const { dataType } = await context.params;

    if (isCollectionDataType(dataType)) {
      const records = await listCollection(dataType);
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
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;

    const { dataType } = await context.params;
    const payload = await request.json();

    if (isCollectionDataType(dataType)) {
      if (!Array.isArray(payload)) {
        return NextResponse.json({ error: 'Payload invalido para colecao.' }, { status: 400 });
      }

      await replaceCollection(dataType, payload);
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
