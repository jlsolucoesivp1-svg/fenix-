import { NextResponse } from 'next/server';
import { getSupabaseSessionState } from '@/lib/server/supabase-session';
import { assertActorCanAccessDashboard, buildSaasDashboardOverview } from '@/lib/server/saas-users';

export async function GET() {
  try {
    const supabaseSession = await getSupabaseSessionState();

    if (!supabaseSession || !supabaseSession.tenantAccess.canAccessTenant || !supabaseSession.tenantAccess.activeCompanyId) {
      return NextResponse.json({ error: 'Sessao SaaS invalida para dashboard.' }, { status: 401 });
    }

    await assertActorCanAccessDashboard(
      supabaseSession.user.id,
      supabaseSession.tenantAccess.activeCompanyId
    );

    const overview = await buildSaasDashboardOverview(supabaseSession.accessToken);
    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao carregar overview do dashboard.',
      },
      { status: 500 }
    );
  }
}
