import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseSessionState } from '@/lib/server/supabase-session';
import { assertActorCanManageUsers, createSaasUser, listSaasUsers } from '@/lib/server/saas-users';

const getTenantSession = async () => {
  const session = await getSupabaseSessionState();

  if (!session || !session.tenantAccess.canAccessTenant || !session.tenantAccess.activeCompanyId) {
    throw new Error('Sessao SaaS invalida para gerenciamento de usuarios.');
  }

  await assertActorCanManageUsers(session.user.id, session.tenantAccess.activeCompanyId);
  return session;
};

export async function GET() {
  try {
    const session = await getTenantSession();
    const users = await listSaasUsers(session.tenantAccess.activeCompanyId!);
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao carregar usuarios.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getTenantSession();
    const payload = await request.json();
    const createdUser = await createSaasUser({
      companyId: session.tenantAccess.activeCompanyId!,
      input: payload,
    });

    return NextResponse.json(createdUser);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao criar usuario.',
      },
      { status: 500 }
    );
  }
}
