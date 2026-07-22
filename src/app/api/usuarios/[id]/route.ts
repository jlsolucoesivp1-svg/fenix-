import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSessionState } from '@/lib/server/supabase-session';
import {
  assertActorCanManageUsers,
  revokeSaasUserMembership,
  updateSaasUser,
} from '@/lib/server/saas-users';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const getTenantSession = async () => {
  const session = await getSupabaseSessionState();

  if (!session || !session.tenantAccess.canAccessTenant || !session.tenantAccess.activeCompanyId) {
    throw new Error('Sessao SaaS invalida para gerenciamento de usuarios.');
  }

  await assertActorCanManageUsers(session.user.id, session.tenantAccess.activeCompanyId);
  return session;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await getTenantSession();
    const { id } = await context.params;
    const payload = await request.json();

    const updatedUser = await updateSaasUser({
      companyId: session.tenantAccess.activeCompanyId!,
      userId: id,
      input: payload,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao atualizar usuario.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getTenantSession();
    const { id } = await context.params;

    await revokeSaasUserMembership({
      companyId: session.tenantAccess.activeCompanyId!,
      userId: id,
      actorUserId: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao remover usuario.',
      },
      { status: 500 }
    );
  }
}
