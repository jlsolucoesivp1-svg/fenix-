import { NextResponse } from 'next/server';
import { listSuperAdminAuditLogs } from '@/lib/server/saas-control-plane';
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
    const limit = Number(searchParams.get('limit') || '50');
    const logs = await listSuperAdminAuditLogs({
      companyId,
      limit: Number.isFinite(limit) ? limit : 50,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Erro ao carregar auditoria administrativa:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao carregar auditoria administrativa.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}
