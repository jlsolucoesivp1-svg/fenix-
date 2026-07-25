import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { User } from '@/types';
import type {
  AppSessionAuthSource,
  AppSessionSnapshot,
  SupabaseAuthUserSummary,
  TenantContext,
} from '@/types/saas';
import { getUserById } from './postgres';
import { getSaasUserPermissions } from './saas-users';
import { getSupabaseSessionState } from './supabase-session';

const SESSION_COOKIE_NAME = 'assistec-now-session';
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

export interface AuthenticatedAppSession extends AppSessionSnapshot {
  user: User | null;
}

const getSessionSecret = () => {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret) {
    throw new Error('SESSION_SECRET nao configurado.');
  }
  return secret;
};

const shouldUseSecureCookie = () => {
  if (process.env.SESSION_COOKIE_SECURE === 'true') return true;
  if (process.env.SESSION_COOKIE_SECURE === 'false') return false;
  return process.env.NODE_ENV === 'production';
};

const toBase64Url = (value: Buffer | string) =>
  Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
};

const sign = (payload: string) =>
  toBase64Url(crypto.createHmac('sha256', getSessionSecret()).update(payload).digest());

export const createSessionToken = (userId: string): string => {
  const payload: SessionPayload = {
    userId,
    expiresAt: Math.floor(Date.now() / 1000) + DEFAULT_SESSION_TTL_SECONDS,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
};

export const verifySessionToken = (token: string): SessionPayload | null => {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload).toString('utf8')) as SessionPayload;
    if (payload.expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
};

export const writeSessionCookie = async (userId: string) => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(),
    path: '/',
  });
};

export const clearSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
};

export const getAuthenticatedUser = async (): Promise<User | null> => {
  const session = await getAuthenticatedAppSession();
  return session.user;
};

const getLegacyAuthenticatedUser = async (): Promise<User | null> => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const payload = verifySessionToken(sessionToken);
  if (!payload) return null;

  return getUserById<User>(payload.userId);
};

export const getAuthenticatedAppSession = async (): Promise<AuthenticatedAppSession> => {
  const supabaseSession = await getSupabaseSessionState();
  const supabasePermissions =
    supabaseSession?.tenantAccess.canAccessTenant && supabaseSession.tenantAccess.activeCompanyId
      ? await getSaasUserPermissions(supabaseSession.tenantAccess.activeCompanyId, supabaseSession.user.id)
      : null;

  if (supabaseSession) {
    return {
      authSource: 'supabase-only',
      user: null,
      tenantContext: supabaseSession.tenantContext,
      supabaseUser: supabaseSession.user,
      tenantAccess: supabaseSession.tenantAccess,
      effectivePermissions: supabasePermissions,
    };
  }

  return {
    authSource: 'none',
      user: null,
      tenantContext: null,
      supabaseUser: null,
      tenantAccess: null,
      effectivePermissions: null,
    };
};
