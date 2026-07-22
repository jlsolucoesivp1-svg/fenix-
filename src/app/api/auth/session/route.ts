import { NextResponse } from 'next/server';
import { sanitizeUser } from '@/lib/server/auth';
import { getAuthenticatedAppSession } from '@/lib/server/session';

export async function GET() {
  try {
    const session = await getAuthenticatedAppSession();

    return NextResponse.json({
      user: session.user ? sanitizeUser(session.user) : null,
      authSource: session.authSource,
      tenantContext: session.tenantContext,
      supabaseUser: session.supabaseUser,
      tenantAccess: session.tenantAccess,
      effectivePermissions: session.effectivePermissions,
    });
  } catch (error) {
    console.error('Erro ao carregar sessao:', error);
    return NextResponse.json({ error: 'Falha ao carregar sessao.' }, { status: 500 });
  }
}
