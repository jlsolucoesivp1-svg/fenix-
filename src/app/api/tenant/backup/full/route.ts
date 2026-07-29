import { NextResponse } from 'next/server';
import { requireSaasCompanyAdmin } from '@/lib/server/saas-authz';
import { buildSaasCompanyFullBackup } from '@/lib/server/saas-company-backup';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const context = await requireSaasCompanyAdmin('Backup completo SaaS indisponivel para a sessao atual.');
  if (context instanceof NextResponse) return context;
  try {
    const result = await buildSaasCompanyFullBackup({
      accessToken: context.accessToken,
      companyId: context.companyId,
      actorUserId: context.userId,
    });
    return new NextResponse(result.archive, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${result.fileName}"`, 'Cache-Control': 'no-store', 'X-Backup-Warnings': String(result.warnings.length) } });
  } catch (error) {
    console.error('Erro ao gerar backup completo SaaS:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao gerar backup completo SaaS.' }, { status: 500 });
  }
}
