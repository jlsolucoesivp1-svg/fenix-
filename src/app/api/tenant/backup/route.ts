import { NextResponse } from 'next/server';
import { requireSaasCompanyAdmin } from '@/lib/server/saas-authz';
import { buildSaasCompanyBackup } from '@/lib/server/saas-company-backup';

export async function GET() {
  const context = await requireSaasCompanyAdmin('Backup SaaS indisponivel para a sessao atual.');
  if (context instanceof NextResponse) return context;

  try {
    const backup = await buildSaasCompanyBackup({
      accessToken: context.accessToken,
      companyId: context.companyId,
      actorUserId: context.userId,
    });
    const date = backup.metadata.createdAt.slice(0, 10);
    return NextResponse.json(backup, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Disposition': `attachment; filename="fenix-saas-${backup.metadata.company.slug}-${date}.json"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar backup SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao gerar backup SaaS.' },
      { status: 500 }
    );
  }
}
