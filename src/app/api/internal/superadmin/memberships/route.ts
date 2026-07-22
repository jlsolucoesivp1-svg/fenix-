import { NextResponse } from 'next/server';
import { listSuperAdminMemberships } from '@/lib/server/saas-control-plane';
import { requireSuperAdminApiSession } from '@/lib/server/superadmin';
import { SaasBootstrapError } from '@/lib/server/saas-bootstrap';

export async function GET(request: Request) {
  try {
    const auth = await requireSuperAdminApiSession();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId')?.trim() || undefined;
    const memberships = await listSuperAdminMemberships(companyId);
    return NextResponse.json({ memberships });
  } catch (error) {
    console.error('Erro ao carregar memberships administrativas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar memberships.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}
