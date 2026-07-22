import type { AppSettings, CompanyInfo, User } from '@/types';
import type { PermissionCode } from '@/types/saas';
import { buildAuditLogPayload } from './audit';
import { hasPermission } from './auth';
import { assertServiceRoleUsageAllowed, getSupabaseAdminConfig } from './supabase-admin';
import { getSingleton } from './postgres';
import { slugify } from '@/lib/text';

type BootstrapAuthUserResponse = {
  user?: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown> | null;
  } | null;
};

type CompanyRow = {
  id: string;
  slug: string;
  trade_name: string;
  legal_name: string | null;
  document_number: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
};

type RoleRow = {
  id: string;
  company_id: string;
  name: string;
};

type PermissionRow = {
  id: string;
  code: PermissionCode;
};

type MembershipRow = {
  id: string;
  company_id: string;
  user_id: string;
  role_id: string | null;
  status: 'active' | 'inactive' | 'invited' | 'revoked';
};

type BootstrapLegacyCompanyPayload = {
  tradeName: string;
  legalName: string | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  slug: string;
};

type BootstrapInput = {
  actor: User;
  supabaseUserId: string;
  companySlug?: string | null;
  companyTradeName?: string | null;
  companyLegalName?: string | null;
  companyDocumentNumber?: string | null;
  profileFullName?: string | null;
  profileEmail?: string | null;
  profileLoginName?: string | null;
  forceSetActiveCompany?: boolean;
};

type BootstrapResult = {
  companyId: string;
  companySlug: string;
  roleId: string;
  membershipId: string;
  profileUserId: string;
  authUserId: string;
  activeCompanyId: string;
};

type CreateAuthUserInput = {
  email: string;
  password: string;
  fullName: string;
  loginName?: string | null;
  appMetadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
};

type CreateAuthUserResult = {
  id: string;
  email: string | null;
  app_metadata?: Record<string, unknown> | null;
};

export class SaasBootstrapError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = 'SaasBootstrapError';
    this.status = status;
  }
}

const ADMIN_ROLE_NAME = 'Administrador Inicial';

const LEGACY_PERMISSION_TO_SAAS: Array<[keyof User['permissions'], PermissionCode]> = [
  ['accessDashboard', 'access_dashboard'],
  ['accessClients', 'access_clients'],
  ['accessServiceOrders', 'access_service_orders'],
  ['accessInventory', 'access_inventory'],
  ['accessSales', 'access_sales'],
  ['accessFinancials', 'access_financials'],
  ['accessSettings', 'access_settings'],
  ['accessDangerZone', 'access_danger_zone'],
  ['accessAgenda', 'access_agenda'],
  ['accessQuotes', 'access_quotes'],
  ['accessLaudos', 'access_laudos'],
  ['canEdit', 'can_edit'],
  ['canDelete', 'can_delete'],
  ['canViewPasswords', 'can_view_passwords'],
  ['canManageUsers', 'can_manage_users'],
];

const SUPABASE_USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const trimOrNull = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const getBootstrapSecret = () => {
  const secret = process.env.SAAS_BOOTSTRAP_SECRET?.trim();
  if (!secret) {
    throw new SaasBootstrapError('SAAS_BOOTSTRAP_SECRET nao configurado.', 500);
  }
  return secret;
};

const validateBootstrapSecret = (providedSecret: string | null) => {
  if (!providedSecret || providedSecret.trim() !== getBootstrapSecret()) {
    throw new SaasBootstrapError('Segredo de bootstrap invalido.', 403);
  }
};

const buildLegacyCompanyPayload = (
  companyInfo: CompanyInfo | null,
  input: BootstrapInput
): BootstrapLegacyCompanyPayload => {
  const tradeName =
    trimOrNull(input.companyTradeName) ||
    trimOrNull(companyInfo?.name) ||
    'Fenix SaaS';
  const legalName = trimOrNull(input.companyLegalName) || trimOrNull(companyInfo?.name);
  const slugBase = trimOrNull(input.companySlug) || slugify(tradeName) || 'fenix-saas';

  return {
    tradeName,
    legalName,
    documentNumber: trimOrNull(input.companyDocumentNumber) || trimOrNull(companyInfo?.document),
    phone: trimOrNull(companyInfo?.phone),
    email: trimOrNull(companyInfo?.emailOrSite),
    addressLine: trimOrNull(companyInfo?.address),
    slug: slugBase,
  };
};

const getLegacyPermissionCodes = (actor: User): PermissionCode[] => {
  const granted = LEGACY_PERMISSION_TO_SAAS.flatMap(([legacyKey, saasCode]) =>
    hasPermission(actor, legacyKey) ? [saasCode] : []
  );

  if (hasPermission(actor, 'canManageUsers')) {
    granted.push('manage_company');
  }

  return Array.from(new Set(granted));
};

const buildAdminHeaders = (contentType = 'application/json') => {
  const { serviceRoleKey } = getSupabaseAdminConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': contentType,
  };
};

const buildRestUrl = (path: string, params?: Record<string, string>) => {
  const { url } = getSupabaseAdminConfig();
  const search = new URLSearchParams(params);
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return `${url}/rest/v1/${path}${suffix}`;
};

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Falha HTTP ${response.status}.`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const restSelectSingle = async <T>(table: string, params: Record<string, string>): Promise<T | null> => {
  const response = await fetch(
    buildRestUrl(table, {
      ...params,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildAdminHeaders(),
      cache: 'no-store',
    }
  );

  const rows = await parseJsonResponse<T[]>(response);
  return rows[0] ?? null;
};

const restUpsertSingle = async <T>(
  table: string,
  body: Record<string, unknown>,
  onConflict: string
): Promise<T> => {
  const response = await fetch(
    buildRestUrl(table, {
      on_conflict: onConflict,
      select: '*',
    }),
    {
      method: 'POST',
      headers: {
        ...buildAdminHeaders(),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    }
  );

  const rows = await parseJsonResponse<T[]>(response);
  if (!rows[0]) {
    throw new Error(`Upsert sem retorno para ${table}.`);
  }
  return rows[0];
};

const restUpsertMany = async (
  table: string,
  rows: Array<Record<string, unknown>>,
  onConflict: string
) => {
  if (rows.length === 0) {
    return;
  }

  const response = await fetch(
    buildRestUrl(table, {
      on_conflict: onConflict,
    }),
    {
      method: 'POST',
      headers: {
        ...buildAdminHeaders(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
      cache: 'no-store',
    }
  );

  await parseJsonResponse(response);
};

const restInsertMany = async (table: string, rows: Array<Record<string, unknown>>) => {
  if (rows.length === 0) {
    return;
  }

  const response = await fetch(buildRestUrl(table), {
    method: 'POST',
    headers: {
      ...buildAdminHeaders(),
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(rows),
    cache: 'no-store',
  });

  await parseJsonResponse(response);
};

const fetchSupabaseAuthUser = async (userId: string) => {
  const { url } = getSupabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: 'GET',
    headers: buildAdminHeaders(),
    cache: 'no-store',
  });

  const payload = await parseJsonResponse<BootstrapAuthUserResponse>(response);
  if (!payload.user?.id) {
    throw new SaasBootstrapError('Usuario do Supabase nao encontrado.', 404);
  }

  return payload.user;
};

export const createSupabaseAuthUser = async (
  input: CreateAuthUserInput
): Promise<CreateAuthUserResult> => {
  assertServiceRoleUsageAllowed('create_company_admin_auth_user');

  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();
  const fullName = input.fullName.trim();
  const loginName = trimOrNull(input.loginName)?.toLowerCase() || null;

  if (!email || !email.includes('@')) {
    throw new SaasBootstrapError('Email do administrador invalido.', 400);
  }

  if (password.length < 8) {
    throw new SaasBootstrapError('A senha inicial precisa ter pelo menos 8 caracteres.', 400);
  }

  if (!fullName) {
    throw new SaasBootstrapError('Nome do administrador obrigatorio.', 400);
  }

  const { url } = getSupabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: buildAdminHeaders(),
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        ...(input.appMetadata ?? {}),
        ...(loginName ? { login_name: loginName } : {}),
      },
      user_metadata: {
        full_name: fullName,
        ...(input.userMetadata ?? {}),
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    if (response.status === 422 || response.status === 409) {
      throw new SaasBootstrapError(
        'Ja existe um usuario no Supabase com este email. Use outro email para o administrador inicial.',
        409
      );
    }

    throw new SaasBootstrapError(message || 'Nao foi possivel criar o usuario no Supabase Auth.', 500);
  }

  const payload = (await response.json()) as BootstrapAuthUserResponse;
  if (!payload.user?.id) {
    throw new SaasBootstrapError('Supabase Auth nao retornou o usuario criado.', 500);
  }

  return {
    id: payload.user.id,
    email: payload.user.email?.trim() || null,
    app_metadata: payload.user.app_metadata ?? null,
  };
};

export const deleteSupabaseAuthUser = async (userId: string) => {
  assertServiceRoleUsageAllowed('delete_company_admin_auth_user');

  const { url } = getSupabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: buildAdminHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new SaasBootstrapError(
      message || 'Nao foi possivel remover o usuario criado no Supabase Auth.',
      response.status
    );
  }
};

const updateSupabaseAuthUserMetadata = async (params: {
  userId: string;
  activeCompanyId: string;
  loginName: string | null;
  existingAppMetadata?: Record<string, unknown> | null;
}) => {
  const { url } = getSupabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/users/${params.userId}`, {
    method: 'PUT',
    headers: buildAdminHeaders(),
    body: JSON.stringify({
      app_metadata: {
        ...(params.existingAppMetadata ?? {}),
        active_company_id: params.activeCompanyId,
        login_name: params.loginName,
      },
    }),
    cache: 'no-store',
  });

  await parseJsonResponse(response);
};

const ensureCompany = async (payload: BootstrapLegacyCompanyPayload): Promise<CompanyRow> => {
  const existing = await restSelectSingle<CompanyRow>('companies', {
    select: 'id,slug,trade_name,legal_name,document_number,status',
    slug: `eq.${payload.slug}`,
  });

  if (existing) {
    return restUpsertSingle<CompanyRow>(
      'companies',
      {
        id: existing.id,
        slug: payload.slug,
        trade_name: payload.tradeName,
        legal_name: payload.legalName,
        document_number: payload.documentNumber,
        phone: payload.phone,
        email: payload.email,
        address_line: payload.addressLine,
        status: 'active',
      },
      'slug'
    );
  }

  return restUpsertSingle<CompanyRow>(
    'companies',
    {
      slug: payload.slug,
      trade_name: payload.tradeName,
      legal_name: payload.legalName,
      document_number: payload.documentNumber,
      phone: payload.phone,
      email: payload.email,
      address_line: payload.addressLine,
      status: 'active',
    },
    'slug'
  );
};

const ensureProfile = async (params: {
  userId: string;
  fullName: string;
  email: string | null;
  loginName: string | null;
}) =>
  restUpsertSingle(
    'profiles',
    {
      id: params.userId,
      full_name: params.fullName,
      email: params.email,
      login_name: params.loginName,
    },
    'id'
  );

const ensureRole = async (params: {
  companyId: string;
  permissionCodes: PermissionCode[];
}) => {
  const role = await restUpsertSingle<RoleRow>(
    'roles',
    {
      company_id: params.companyId,
      name: ADMIN_ROLE_NAME,
      description: 'Role administrativa inicial criada pelo bootstrap SaaS.',
      is_system: false,
      is_company_admin: true,
    },
    'company_id,name'
  );

  const permissions = await fetchPermissionsByCodes(params.permissionCodes);
  await restUpsertMany(
    'role_permissions',
    permissions.map((permission) => ({
      role_id: role.id,
      permission_id: permission.id,
    })),
    'role_id,permission_id'
  );

  return role;
};

const fetchPermissionsByCodes = async (codes: PermissionCode[]) => {
  if (codes.length === 0) {
    return [] as PermissionRow[];
  }

  const response = await fetch(
    buildRestUrl('permissions', {
      select: 'id,code',
      code: `in.(${codes.map((code) => `"${code}"`).join(',')})`,
    }),
    {
      method: 'GET',
      headers: buildAdminHeaders(),
      cache: 'no-store',
    }
  );

  return parseJsonResponse<PermissionRow[]>(response);
};

const ensureMembership = async (params: {
  companyId: string;
  userId: string;
  roleId: string;
}) =>
  restUpsertSingle<MembershipRow>(
    'company_memberships',
    {
      company_id: params.companyId,
      user_id: params.userId,
      role_id: params.roleId,
      is_owner: true,
      status: 'active',
      is_default: true,
    },
    'company_id,user_id'
  );

const ensureCompanySettings = async (companyId: string, settings: AppSettings | null) =>
  restUpsertSingle(
    'company_settings',
    {
      company_id: companyId,
      default_warranty_days: settings?.defaultWarrantyDays ?? 90,
      timezone: 'America/Sao_Paulo',
      currency_code: 'BRL',
    },
    'company_id'
  );

const ensureCompanyBranding = async (companyId: string, companyInfo: CompanyInfo | null) =>
  restUpsertSingle(
    'company_branding',
    {
      company_id: companyId,
      address: trimOrNull(companyInfo?.address),
      phone: trimOrNull(companyInfo?.phone),
      email_or_site: trimOrNull(companyInfo?.emailOrSite),
      pix_key: trimOrNull(companyInfo?.pixKey),
      logo_path: null,
      notification_sound_path: null,
    },
    'company_id'
  );

const insertBootstrapAuditLog = async (params: {
  companyId: string;
  actorUserId: string;
  authUserId: string;
  legacyLogin: string;
  companySlug: string;
}) => {
  await restInsertMany('audit_logs', [
    buildAuditLogPayload({
      companyId: params.companyId,
      actorUserId: params.authUserId,
      action: 'bootstrap_company_admin',
      entity: 'company',
      entityId: params.companyId,
      severity: 'info',
      metadata: {
        actor_legacy_user_id: params.actorUserId,
        actor_legacy_login: params.legacyLogin,
        company_slug: params.companySlug,
      },
    }),
  ]);
};

export const assertSaasBootstrapRequestAllowed = (params: {
  actor: User;
  providedSecret: string | null;
}) => {
  validateBootstrapSecret(params.providedSecret);

  if (!hasPermission(params.actor, 'accessDangerZone') || !hasPermission(params.actor, 'canManageUsers')) {
    throw new SaasBootstrapError('Usuario legado sem permissao suficiente para bootstrap SaaS.', 403);
  }
};

export const bootstrapFirstCompanyForSupabaseUser = async (
  input: BootstrapInput
): Promise<BootstrapResult> => {
  assertServiceRoleUsageAllowed('bootstrap_first_company');

  const supabaseUserId = input.supabaseUserId.trim();
  if (!SUPABASE_USER_ID_PATTERN.test(supabaseUserId)) {
    throw new SaasBootstrapError('supabaseUserId invalido.', 400);
  }

  const [companyInfo, settings, authUser] = await Promise.all([
    getSingleton<CompanyInfo>('companyInfo'),
    getSingleton<AppSettings>('settings'),
    fetchSupabaseAuthUser(supabaseUserId),
  ]);

  const companyPayload = buildLegacyCompanyPayload(companyInfo, input);
  const permissionCodes = getLegacyPermissionCodes(input.actor);
  const company = await ensureCompany(companyPayload);
  const role = await ensureRole({
    companyId: company.id,
    permissionCodes,
  });
  const membership = await ensureMembership({
    companyId: company.id,
    userId: authUser.id,
    roleId: role.id,
  });

  await Promise.all([
    ensureProfile({
      userId: authUser.id,
      fullName: trimOrNull(input.profileFullName) || input.actor.name,
      email: trimOrNull(input.profileEmail) || trimOrNull(authUser.email),
      loginName: trimOrNull(input.profileLoginName) || trimOrNull(input.actor.login),
    }),
    ensureCompanySettings(company.id, settings),
    ensureCompanyBranding(company.id, companyInfo),
  ]);

  if (input.forceSetActiveCompany !== false) {
    await updateSupabaseAuthUserMetadata({
      userId: authUser.id,
      activeCompanyId: company.id,
      loginName: trimOrNull(input.profileLoginName) || trimOrNull(input.actor.login),
      existingAppMetadata: authUser.app_metadata,
    });
  }

  await insertBootstrapAuditLog({
    companyId: company.id,
    actorUserId: input.actor.id,
    authUserId: authUser.id,
    legacyLogin: input.actor.login,
    companySlug: company.slug,
  });

  return {
    companyId: company.id,
    companySlug: company.slug,
    roleId: role.id,
    membershipId: membership.id,
    profileUserId: authUser.id,
    authUserId: authUser.id,
    activeCompanyId: company.id,
  };
};
