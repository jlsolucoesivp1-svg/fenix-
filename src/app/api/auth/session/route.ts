import { NextResponse } from 'next/server';
import { sanitizeUser } from '@/lib/server/auth';
import { getAuthenticatedAppSession } from '@/lib/server/session';
import { findPlatformAdminForSession } from '@/lib/server/superadmin';

export async function GET() {
  try {
    const session = await getAuthenticatedAppSession();
    const isPlatformAdmin = Boolean(await findPlatformAdminForSession(session));

    return NextResponse.json({
      user: session.user ? sanitizeUser(session.user) : null,
      authSource: session.authSource,
      tenantContext: session.tenantContext,
      supabaseUser: session.supabaseUser,
      tenantAccess: session.tenantAccess,
      effectivePermissions: session.effectivePermissions,
      isPlatformAdmin,
    });
  } catch (error) {
    console.error('Erro ao carregar sessao:', error);
    return NextResponse.json({ error: 'Falha ao carregar sessao.' }, { status: 500 });
  }
}
