import { NextResponse } from 'next/server';
import {
  getSuperAdminCompanyUsers,
  resetSuperAdminCompanyUserPassword,
  updateSuperAdminCompanyUser,
} from '@/lib/server/saas-control-plane';
import { requireSuperAdminApiSession } from '@/lib/server/superadmin';
import { SaasBootstrapError } from '@/lib/server/saas-bootstrap';

export async function GET(request: Request) {
  try {
    const auth = await requireSuperAdminApiSession();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId')?.trim();
    if (!companyId) {
      return NextResponse.json({ error: 'companyId obrigatorio.' }, { status: 400 });
    }

    const result = await getSuperAdminCompanyUsers(companyId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao carregar usuarios administrativos por empresa:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar usuarios da empresa.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}

const getRequestMetadata = (request: Request) => ({
  requestId: request.headers.get('x-request-id') || null,
  ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
  userAgent: request.headers.get('user-agent') || null,
});

export async function PATCH(request: Request) {
  try {
    const auth = await requireSuperAdminApiSession();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as Record<string, unknown>;
    const companyId = String(body.companyId || '').trim();
    const userId = String(body.userId || '').trim();
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'companyId e userId obrigatorios.' }, { status: 400 });
    }

    const result = await updateSuperAdminCompanyUser({
      companyId,
      userId,
      name: String(body.name || ''),
      email: String(body.email || ''),
      roleId: String(body.roleId || ''),
      status: body.status === 'inactive' ? 'inactive' : 'active',
      actorSupabaseUserId: auth.session.supabaseUser?.id || null,
      requestMetadata: { ...getRequestMetadata(request), platformAdminId: auth.platformAdmin.id },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Erro ao atualizar usuario pelo Super Admin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao atualizar usuario.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdminApiSession();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as Record<string, unknown>;
    const companyId = String(body.companyId || '').trim();
    const userId = String(body.userId || '').trim();
    const password = String(body.password || '');
    if (body.operation !== 'reset-password' || !companyId || !userId) {
      return NextResponse.json({ error: 'Operacao de redefinicao de senha invalida.' }, { status: 400 });
    }

    const result = await resetSuperAdminCompanyUserPassword({
      companyId,
      userId,
      password,
      actorSupabaseUserId: auth.session.supabaseUser?.id || null,
      requestMetadata: { ...getRequestMetadata(request), platformAdminId: auth.platformAdmin.id },
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Erro ao redefinir senha pelo Super Admin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao redefinir senha.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}
