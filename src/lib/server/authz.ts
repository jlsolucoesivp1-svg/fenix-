import { NextResponse } from 'next/server';
import type { User, UserPermissions } from '@/types';
import { hasPermission } from './auth';
import { getAuthenticatedUser } from './session';

export const requireAuthenticatedUser = async (): Promise<User | NextResponse> => {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Nao autenticado.' },
      { status: 401 }
    );
  }

  return user;
};

export const requirePermission = async (
  permission: keyof UserPermissions,
  errorMessage = 'Acesso negado.'
): Promise<User | NextResponse> => {
  const authResult = await requireAuthenticatedUser();

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!hasPermission(authResult, permission)) {
    return NextResponse.json(
      { error: errorMessage },
      { status: 403 }
    );
  }

  return authResult;
};
