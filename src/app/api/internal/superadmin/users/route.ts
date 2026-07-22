import { NextResponse } from 'next/server';
import { getSuperAdminCompanyUsers } from '@/lib/server/saas-control-plane';
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

    const users = await getSuperAdminCompanyUsers(companyId);
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao carregar usuarios administrativos por empresa:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar usuarios da empresa.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}
