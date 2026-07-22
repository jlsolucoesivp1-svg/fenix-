import { NextResponse } from 'next/server';
import { getSuperAdminDashboardSummary } from '@/lib/server/saas-control-plane';
import { requireSuperAdminApiSession } from '@/lib/server/superadmin';
import { SaasBootstrapError } from '@/lib/server/saas-bootstrap';

export async function GET() {
  try {
    const auth = await requireSuperAdminApiSession();
    if (auth instanceof NextResponse) {
      return auth;
    }

    const summary = await getSuperAdminDashboardSummary();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Erro ao carregar dashboard administrativo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar dashboard administrativo.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}
