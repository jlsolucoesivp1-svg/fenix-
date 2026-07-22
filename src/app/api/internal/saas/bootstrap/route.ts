import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server/authz';
import {
  SaasBootstrapError,
  assertSaasBootstrapRequestAllowed,
  bootstrapFirstCompanyForSupabaseUser,
} from '@/lib/server/saas-bootstrap';

export async function POST(request: Request) {
  try {
    const authResult = await requirePermission(
      'accessDangerZone',
      'Voce nao tem permissao para executar bootstrap SaaS.'
    );
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    assertSaasBootstrapRequestAllowed({
      actor: authResult,
      providedSecret: request.headers.get('x-saas-bootstrap-secret'),
    });

    const body = (await request.json()) as {
      supabaseUserId?: string;
      companySlug?: string | null;
      companyTradeName?: string | null;
      companyLegalName?: string | null;
      forceSetActiveCompany?: boolean;
    };

    if (typeof body.supabaseUserId !== 'string' || !body.supabaseUserId.trim()) {
      return NextResponse.json({ error: 'supabaseUserId obrigatorio.' }, { status: 400 });
    }

    const result = await bootstrapFirstCompanyForSupabaseUser({
      actor: authResult,
      supabaseUserId: body.supabaseUserId,
      companySlug: body.companySlug,
      companyTradeName: body.companyTradeName,
      companyLegalName: body.companyLegalName,
      forceSetActiveCompany: body.forceSetActiveCompany,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Erro no bootstrap SaaS:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Falha ao executar bootstrap SaaS.' },
      { status: error instanceof SaasBootstrapError ? error.status : 500 }
    );
  }
}
