import type { User } from '@/types';
import type { AuditSeverity, MembershipStatus, TenantStatus } from '@/types/saas';
import { slugify } from '@/lib/text';
import { insertAuditLogs } from './audit';
import {
  SaasBootstrapError,
  bootstrapFirstCompanyForSupabaseUser,
  createSupabaseAuthUser,
  deleteSupabaseAuthUser,
} from './saas-bootstrap';
import { assertServiceRoleUsageAllowed, getSupabaseAdminConfig } from './supabase-admin';

type CompanyRow = {
  id: string;
  slug: string;
  trade_name: string;
  legal_name: string | null;
  document_number: string | null;
  phone: string | null;
  email: string | null;
  address_line: string | null;
  city: string | null;
  state_code: string | null;
  zip_code: string | null;
  status: TenantStatus;
  created_at: string;
};

type CompanySettingsRow = {
  company_id: string;
  default_warranty_days: number;
  timezone: string;
  currency_code: string;
  plan_name: string | null;
  internal_notes: string | null;
  trial_starts_at: string | null;
  trial_ends_at: string | null;
  require_password_change: boolean;
};

type CompanyBrandingRow = {
  company_id: string;
  address: string | null;
  phone: string | null;
  email_or_site: string | null;
};

type MembershipRow = {
  id: string;
  company_id: string;
  user_id: string;
  role_id: string | null;
  is_owner: boolean;
  status: MembershipStatus;
  is_default: boolean;
  created_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  login_name: string | null;
};

type RoleRow = {
  id: string;
  company_id: string | null;
  name: string;
  is_company_admin: boolean;
  is_system: boolean;
};

type SupabaseAuthUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

type AuditLogRow = {
  id: number;
  company_id: string | null;
  actor_user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  request_id: string | null;
  success: boolean;
  severity: AuditSeverity;
  metadata: Record<string, unknown>;
  created_at: string;
};

export interface SuperAdminCompanySummary {
  companyId: string;
  slug: string;
  tradeName: string;
  legalName: string | null;
  documentNumber: string | null;
  status: TenantStatus;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  defaultWarrantyDays: number;
  planName: string | null;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  internalNotes: string | null;
  requirePasswordChange: boolean;
  responsibleName: string | null;
  responsibleEmail: string | null;
  usersCount: number;
  createdAt: string;
  lastActivityAt: string | null;
}

export interface SuperAdminCompanyFormInput {
  companyTradeName: string;
  companyLegalName?: string | null;
  companySlug?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  stateCode?: string | null;
  zipCode?: string | null;
  status: TenantStatus;
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
  adminLoginName?: string | null;
  defaultWarrantyDays?: number | null;
  planName?: string | null;
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  internalNotes?: string | null;
  requirePasswordChange?: boolean;
}

export interface UpdateSuperAdminCompanyInput {
  companyId: string;
  companyTradeName: string;
  companyLegalName?: string | null;
  documentNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  addressLine?: string | null;
  city?: string | null;
  stateCode?: string | null;
  zipCode?: string | null;
  status: TenantStatus;
  defaultWarrantyDays?: number | null;
  planName?: string | null;
  trialStartsAt?: string | null;
  trialEndsAt?: string | null;
  internalNotes?: string | null;
  requirePasswordChange?: boolean;
}

export interface SuperAdminCompanyRole {
  id: string;
  name: string;
  isCompanyAdmin: boolean;
}

export interface SuperAdminCompanyUser {
  id: string;
  name: string;
  email: string | null;
  loginName: string | null;
  status: MembershipStatus;
  isOwner: boolean;
  roleId: string | null;
  roleName: string | null;
  roleIsCompanyAdmin: boolean;
}

export interface UpdateSuperAdminCompanyUserInput {
  companyId: string;
  userId: string;
  name: string;
  email: string;
  roleId: string;
  status: 'active' | 'inactive';
  actorSupabaseUserId: string | null;
  requestMetadata?: CreateCompanyFromPanelInput['requestMetadata'];
}

export interface CreateCompanyFromPanelInput extends SuperAdminCompanyFormInput {
  actor: User;
  actorSupabaseUserId?: string | null;
  requestMetadata?: {
    ipAddress?: string | null;
    userAgent?: string | null;
    requestId?: string | null;
    platformAdminId?: string | null;
  };
}

export interface CreateCompanyFromPanelResult {
  companyId: string;
  companySlug: string;
  roleId: string;
  membershipId: string;
  authUserId: string;
  profileUserId: string;
  activeCompanyId: string;
  tradeName: string;
  adminEmail: string | null;
  adminLoginName: string | null;
  status: TenantStatus;
}

export interface SuperAdminDashboardSummary {
  totalCompanies: number;
  activeCompanies: number;
  trialCompanies: number;
  suspendedCompanies: number;
  inactiveCompanies: number;
  totalUsers: number;
  blockedCompanies: number;
  latestCompanies: SuperAdminCompanySummary[];
  latestActions: Array<{
    id: number;
    action: string;
    entity: string;
    success: boolean;
    createdAt: string;
    companyId: string | null;
  }>;
}

export interface SuperAdminAuditLogSummary {
  id: number;
  companyId: string | null;
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  requestId: string | null;
  success: boolean;
  severity: AuditSeverity;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export interface SuperAdminMembershipSummary {
  membershipId: string;
  companyId: string;
  userId: string;
  roleId: string | null;
  isOwner: boolean;
  isDefault: boolean;
  status: MembershipStatus;
  createdAt: string;
  fullName: string | null;
  email: string | null;
  loginName: string | null;
}

const normalizeText = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const normalizeDate = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
};

const normalizeStatus = (value: string | null | undefined): TenantStatus => {
  if (value === 'active' || value === 'inactive' || value === 'suspended' || value === 'trial') {
    return value;
  }
  throw new SaasBootstrapError('Status da empresa invalido.', 400);
};

const buildAdminHeaders = () => {
  const { serviceRoleKey } = getSupabaseAdminConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
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
    throw new SaasBootstrapError(message || `Falha HTTP ${response.status}.`, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.text();
  if (!body.trim()) {
    return undefined as T;
  }

  return JSON.parse(body) as T;
};

const listRows = async <T>(table: string, params: Record<string, string>) => {
  assertServiceRoleUsageAllowed(`list_${table}_for_superadmin`);
  const response = await fetch(buildRestUrl(table, params), {
    method: 'GET',
    headers: buildAdminHeaders(),
    cache: 'no-store',
  });

  return parseJsonResponse<T[]>(response);
};

const selectSingle = async <T>(table: string, params: Record<string, string>) => {
  const rows = await listRows<T>(table, {
    ...params,
    limit: '1',
  });

  return rows[0] ?? null;
};

const insertRows = async <T>(table: string, payload: Record<string, unknown> | Array<Record<string, unknown>>, params?: Record<string, string>) => {
  assertServiceRoleUsageAllowed(`insert_${table}_for_superadmin`);
  const response = await fetch(
    buildRestUrl(table, {
      ...(params ?? {}),
      select: '*',
    }),
    {
      method: 'POST',
      headers: {
        ...buildAdminHeaders(),
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    }
  );

  return parseJsonResponse<T[]>(response);
};

const patchRows = async <T>(table: string, payload: Record<string, unknown>, params: Record<string, string>) => {
  assertServiceRoleUsageAllowed(`patch_${table}_for_superadmin`);
  const response = await fetch(
    buildRestUrl(table, {
      ...params,
      select: '*',
    }),
    {
      method: 'PATCH',
      headers: {
        ...buildAdminHeaders(),
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    }
  );

  return parseJsonResponse<T[]>(response);
};

const deleteRows = async (table: string, params: Record<string, string>) => {
  assertServiceRoleUsageAllowed(`delete_${table}_for_superadmin`);
  const response = await fetch(buildRestUrl(table, params), {
    method: 'DELETE',
    headers: {
      ...buildAdminHeaders(),
      Prefer: 'return=minimal',
    },
    cache: 'no-store',
  });

  await parseJsonResponse(response);
};

const validateCompanyInput = (input: SuperAdminCompanyFormInput | UpdateSuperAdminCompanyInput) => {
  const companyTradeName = input.companyTradeName.trim();
  if (!companyTradeName) {
    throw new SaasBootstrapError('Nome fantasia da empresa obrigatorio.', 400);
  }

  const status = normalizeStatus(input.status);
  const slug =
    'companySlug' in input ? normalizeText(input.companySlug) || slugify(companyTradeName) : null;

  if ('companySlug' in input && !slug) {
    throw new SaasBootstrapError('Nao foi possivel gerar um slug valido para a empresa.', 400);
  }

  const defaultWarrantyDays = Number(input.defaultWarrantyDays ?? 90);
  if (!Number.isFinite(defaultWarrantyDays) || defaultWarrantyDays < 0) {
    throw new SaasBootstrapError('Dias de garantia padrao invalido.', 400);
  }

  const trialStartsAt = normalizeDate(input.trialStartsAt);
  const trialEndsAt = normalizeDate(input.trialEndsAt);
  if ((input.trialStartsAt && !trialStartsAt) || (input.trialEndsAt && !trialEndsAt)) {
    throw new SaasBootstrapError('Datas de teste invalidas. Use o formato YYYY-MM-DD.', 400);
  }

  if (status === 'trial' && trialStartsAt && trialEndsAt && trialStartsAt > trialEndsAt) {
    throw new SaasBootstrapError('A data final do teste deve ser maior ou igual a data inicial.', 400);
  }

  return {
    companyTradeName,
    companyLegalName: normalizeText(input.companyLegalName),
    companySlug: slug,
    documentNumber: normalizeText(input.documentNumber),
    phone: normalizeText(input.phone),
    email: normalizeText(input.email),
    addressLine: normalizeText(input.addressLine),
    city: normalizeText(input.city),
    stateCode: normalizeText(input.stateCode)?.toUpperCase() || null,
    zipCode: normalizeText(input.zipCode),
    status,
    defaultWarrantyDays,
    planName: normalizeText(input.planName),
    trialStartsAt,
    trialEndsAt,
    internalNotes: normalizeText(input.internalNotes),
    requirePasswordChange: Boolean(input.requirePasswordChange),
  };
};

const fetchCompanyBySlug = async (slug: string) =>
  selectSingle<CompanyRow>('companies', {
    select:
      'id,slug,trade_name,legal_name,document_number,phone,email,address_line,city,state_code,zip_code,status,created_at',
    slug: `eq.${slug}`,
  });

const fetchCompanies = async () =>
  listRows<CompanyRow>('companies', {
    select:
      'id,slug,trade_name,legal_name,document_number,phone,email,address_line,city,state_code,zip_code,status,created_at',
    order: 'created_at.desc',
  });

const fetchCompanySettings = async () =>
  listRows<CompanySettingsRow>('company_settings', {
    select:
      'company_id,default_warranty_days,timezone,currency_code,plan_name,internal_notes,trial_starts_at,trial_ends_at,require_password_change',
  });

const fetchMemberships = async () =>
  listRows<MembershipRow>('company_memberships', {
    select: 'id,company_id,user_id,role_id,is_owner,status,is_default,created_at',
  });

const fetchProfiles = async (userIds: string[]) => {
  if (userIds.length === 0) {
    return [] as ProfileRow[];
  }

  return listRows<ProfileRow>('profiles', {
    select: 'id,full_name,email,login_name',
    id: `in.(${userIds.join(',')})`,
  });
};

const fetchCompanyRoles = async (companyId: string) =>
  listRows<RoleRow>('roles', {
    select: 'id,company_id,name,is_company_admin,is_system',
    company_id: `eq.${companyId}`,
    order: 'name.asc',
  });

const fetchSupabaseAuthUser = async (userId: string): Promise<SupabaseAuthUser> => {
  assertServiceRoleUsageAllowed('read_company_user_auth_for_superadmin');
  const { url } = getSupabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: 'GET',
    headers: buildAdminHeaders(),
    cache: 'no-store',
  });

  const payload = await parseJsonResponse<SupabaseAuthUser | { user?: SupabaseAuthUser }>(response);
  const user = (payload as { user?: SupabaseAuthUser }).user ?? (payload as SupabaseAuthUser);
  if (!user?.id) {
    throw new SaasBootstrapError('Usuario nao encontrado no Supabase Auth.', 404);
  }
  return user;
};

const updateSupabaseAuthUserForSuperAdmin = async (params: {
  user: SupabaseAuthUser;
  email?: string;
  name?: string;
  loginName?: string | null;
  password?: string;
  activeCompanyId?: string | null;
}) => {
  assertServiceRoleUsageAllowed('update_company_user_auth_for_superadmin');
  const { url } = getSupabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/users/${params.user.id}`, {
    method: 'PUT',
    headers: buildAdminHeaders(),
    body: JSON.stringify({
      ...(params.email ? { email: params.email } : {}),
      ...(params.name ? { user_metadata: { ...(params.user.user_metadata ?? {}), full_name: params.name } } : {}),
      ...(params.password ? { password: params.password } : {}),
      ...(params.activeCompanyId !== undefined
        ? {
            app_metadata: {
              ...(params.user.app_metadata ?? {}),
              ...(params.activeCompanyId !== undefined ? { active_company_id: params.activeCompanyId } : {}),
            },
          }
        : {}),
    }),
    cache: 'no-store',
  });

  await parseJsonResponse(response);
};

const fetchAuditLogs = async (params?: { companyId?: string; limit?: number }) =>
  listRows<AuditLogRow>('audit_logs', {
    select: 'id,company_id,actor_user_id,action,entity,entity_id,request_id,success,severity,metadata,created_at',
    ...(params?.companyId ? { company_id: `eq.${params.companyId}` } : {}),
    order: 'created_at.desc',
    limit: String(params?.limit ?? 20),
  });

const patchCompanyOperationalData = async (params: {
  companyId: string;
  companyTradeName: string;
  companyLegalName: string | null;
  documentNumber: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  status: TenantStatus;
  defaultWarrantyDays: number;
  planName: string | null;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  internalNotes: string | null;
  requirePasswordChange: boolean;
}) => {
  await Promise.all([
    patchRows<CompanyRow>(
      'companies',
      {
        trade_name: params.companyTradeName,
        legal_name: params.companyLegalName,
        document_number: params.documentNumber,
        phone: params.phone,
        email: params.email,
        address_line: params.addressLine,
        city: params.city,
        state_code: params.stateCode,
        zip_code: params.zipCode,
        status: params.status,
      },
      {
        id: `eq.${params.companyId}`,
      }
    ),
    patchRows<CompanyBrandingRow>(
      'company_branding',
      {
        address: params.addressLine,
        phone: params.phone,
        email_or_site: params.email,
      },
      {
        company_id: `eq.${params.companyId}`,
      }
    ),
    patchRows<CompanySettingsRow>(
      'company_settings',
      {
        default_warranty_days: params.defaultWarrantyDays,
        plan_name: params.planName,
        internal_notes: params.internalNotes,
        trial_starts_at: params.trialStartsAt,
        trial_ends_at: params.trialEndsAt,
        require_password_change: params.requirePasswordChange,
      },
      {
        company_id: `eq.${params.companyId}`,
      }
    ),
  ]);
};

const deleteCompanyDeep = async (params: { companyId: string; authUserId: string }) => {
  try {
    await deleteRows('companies', { id: `eq.${params.companyId}` });
  } finally {
    try {
      await deleteSupabaseAuthUser(params.authUserId);
    } catch (error) {
      console.error('Falha ao remover usuario Auth durante rollback logico:', error);
    }
  }
};

export const listCompaniesForSuperAdmin = async (): Promise<SuperAdminCompanySummary[]> => {
  assertServiceRoleUsageAllowed('list_companies_for_superadmin');

  const [companies, settingsRows, memberships, auditLogs] = await Promise.all([
    fetchCompanies(),
    fetchCompanySettings(),
    fetchMemberships(),
    fetchAuditLogs({ limit: 500 }),
  ]);

  const ownerMemberships = memberships.filter((membership) => membership.is_owner && membership.status === 'active');
  const activeMemberships = memberships.filter((membership) => membership.status === 'active');
  const profileIds = Array.from(
    new Set(ownerMemberships.map((membership) => membership.user_id))
  );
  const profiles = await fetchProfiles(profileIds);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const settingsByCompanyId = new Map(settingsRows.map((row) => [row.company_id, row]));
  const usersCountByCompany = new Map<string, number>();
  const lastActivityByCompany = new Map<string, string>();

  for (const membership of activeMemberships) {
    usersCountByCompany.set(
      membership.company_id,
      (usersCountByCompany.get(membership.company_id) ?? 0) + 1
    );
  }

  for (const log of auditLogs) {
    if (!log.company_id || lastActivityByCompany.has(log.company_id)) {
      continue;
    }
    lastActivityByCompany.set(log.company_id, log.created_at);
  }

  return companies.map((company) => {
    const ownerMembership = ownerMemberships.find((membership) => membership.company_id === company.id) || null;
    const ownerProfile = ownerMembership ? profileById.get(ownerMembership.user_id) || null : null;
    const settings = settingsByCompanyId.get(company.id);

    return {
      companyId: company.id,
      slug: company.slug,
      tradeName: company.trade_name,
      legalName: company.legal_name,
      documentNumber: company.document_number,
      status: company.status,
      phone: company.phone,
      email: company.email,
      addressLine: company.address_line,
      city: company.city,
      stateCode: company.state_code,
      zipCode: company.zip_code,
      defaultWarrantyDays: settings?.default_warranty_days ?? 90,
      planName: settings?.plan_name ?? null,
      trialStartsAt: settings?.trial_starts_at ?? null,
      trialEndsAt: settings?.trial_ends_at ?? null,
      internalNotes: settings?.internal_notes ?? null,
      requirePasswordChange: settings?.require_password_change ?? false,
      responsibleName: ownerProfile?.full_name || ownerProfile?.email || null,
      responsibleEmail: ownerProfile?.email || null,
      usersCount: usersCountByCompany.get(company.id) ?? 0,
      createdAt: company.created_at,
      lastActivityAt: lastActivityByCompany.get(company.id) ?? null,
    };
  });
};

export const getSuperAdminDashboardSummary = async (): Promise<SuperAdminDashboardSummary> => {
  const [companies, memberships, latestAuditLogs] = await Promise.all([
    listCompaniesForSuperAdmin(),
    fetchMemberships(),
    fetchAuditLogs({ limit: 10 }),
  ]);

  const totalUsers = new Set(
    memberships.filter((membership) => membership.status === 'active').map((membership) => membership.user_id)
  ).size;

  return {
    totalCompanies: companies.length,
    activeCompanies: companies.filter((company) => company.status === 'active').length,
    trialCompanies: companies.filter((company) => company.status === 'trial').length,
    suspendedCompanies: companies.filter((company) => company.status === 'suspended').length,
    inactiveCompanies: companies.filter((company) => company.status === 'inactive').length,
    totalUsers,
    blockedCompanies: companies.filter(
      (company) => company.status === 'inactive' || company.status === 'suspended'
    ).length,
    latestCompanies: companies.slice(0, 5),
    latestActions: latestAuditLogs.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entity: entry.entity,
      success: entry.success,
      createdAt: entry.created_at,
      companyId: entry.company_id,
    })),
  };
};

export const listSuperAdminAuditLogs = async (params?: {
  companyId?: string;
  limit?: number;
}): Promise<SuperAdminAuditLogSummary[]> => {
  const rows = await fetchAuditLogs(params);
  return rows.map((row) => ({
    id: row.id,
    companyId: row.company_id,
    actorUserId: row.actor_user_id,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    requestId: row.request_id,
    success: row.success,
    severity: row.severity,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
  }));
};

export const getSuperAdminCompanyUsers = async (companyId: string): Promise<{
  users: SuperAdminCompanyUser[];
  roles: SuperAdminCompanyRole[];
}> => {
  const [company, memberships, roles] = await Promise.all([
    selectSingle<CompanyRow>('companies', {
      select: 'id,slug,trade_name,legal_name,document_number,phone,email,address_line,city,state_code,zip_code,status,created_at',
      id: `eq.${companyId}`,
    }),
    listRows<MembershipRow>('company_memberships', {
      select: 'id,company_id,user_id,role_id,is_owner,status,is_default,created_at',
      company_id: `eq.${companyId}`,
      order: 'created_at.asc',
    }),
    fetchCompanyRoles(companyId),
  ]);

  if (!company) {
    throw new SaasBootstrapError('Empresa nao encontrada.', 404);
  }

  const profiles = await fetchProfiles(memberships.map((membership) => membership.user_id));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const roleById = new Map(roles.map((role) => [role.id, role]));

  return {
    users: memberships
      .filter((membership) => membership.status !== 'revoked')
      .map((membership) => {
        const profile = profileById.get(membership.user_id);
        const role = membership.role_id ? roleById.get(membership.role_id) : null;
        return {
          id: membership.user_id,
          name: profile?.full_name || profile?.email || membership.user_id,
          email: profile?.email || null,
          loginName: profile?.login_name || null,
          status: membership.status,
          isOwner: membership.is_owner,
          roleId: membership.role_id,
          roleName: role?.name || null,
          roleIsCompanyAdmin: Boolean(role?.is_company_admin),
        };
      }),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      isCompanyAdmin: role.is_company_admin,
    })),
  };
};

const loadSuperAdminCompanyUser = async (companyId: string, userId: string) => {
  const [company, membership, authUser] = await Promise.all([
    selectSingle<CompanyRow>('companies', {
      select: 'id,slug,trade_name,legal_name,document_number,phone,email,address_line,city,state_code,zip_code,status,created_at',
      id: `eq.${companyId}`,
    }),
    selectSingle<MembershipRow>('company_memberships', {
      select: 'id,company_id,user_id,role_id,is_owner,status,is_default,created_at',
      company_id: `eq.${companyId}`,
      user_id: `eq.${userId}`,
    }),
    fetchSupabaseAuthUser(userId),
  ]);

  if (!company) throw new SaasBootstrapError('Empresa nao encontrada.', 404);
  if (!membership) throw new SaasBootstrapError('Usuario nao possui membership nesta empresa.', 404);

  const [profiles, roles] = await Promise.all([
    fetchProfiles([userId]),
    fetchCompanyRoles(companyId),
  ]);
  const profile = profiles[0] ?? null;
  const role = membership.role_id ? roles.find((item) => item.id === membership.role_id) ?? null : null;
  return { company, membership, authUser, profile, roles, role };
};

const auditSuperAdminUserChanges = async (params: {
  companyId: string;
  userId: string;
  actorSupabaseUserId: string | null;
  requestMetadata?: CreateCompanyFromPanelInput['requestMetadata'];
  actions: Array<{ action: string; metadata?: Record<string, unknown>; severity?: AuditSeverity }>;
}) => {
  await insertAuditLogs(
    params.actions.map((item) => ({
      companyId: params.companyId,
      actorUserId: params.actorSupabaseUserId,
      action: item.action,
      entity: 'company_user',
      entityId: params.userId,
      severity: item.severity ?? 'info',
      requestId: params.requestMetadata?.requestId || null,
      ipAddress: params.requestMetadata?.ipAddress || null,
      userAgent: params.requestMetadata?.userAgent || null,
      metadata: {
        platform_admin_id: params.requestMetadata?.platformAdminId || null,
        ...(item.metadata ?? {}),
      },
    }))
  );
};

export const updateSuperAdminCompanyUser = async (input: UpdateSuperAdminCompanyUserInput) => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name) throw new SaasBootstrapError('Nome do usuario obrigatorio.', 400);
  if (!email || !email.includes('@')) throw new SaasBootstrapError('E-mail do usuario invalido.', 400);
  if (input.status !== 'active' && input.status !== 'inactive') {
    throw new SaasBootstrapError('Status do usuario invalido.', 400);
  }

  const current = await loadSuperAdminCompanyUser(input.companyId, input.userId);
  if (!current.profile) {
    throw new SaasBootstrapError('Profile do usuario nao encontrado.', 409);
  }
  const nextRole = current.roles.find((role) => role.id === input.roleId);
  if (!nextRole) throw new SaasBootstrapError('Role invalida para esta empresa.', 400);

  const activeCompanyId =
    typeof current.authUser.app_metadata?.active_company_id === 'string' && current.authUser.app_metadata.active_company_id.trim()
      ? current.authUser.app_metadata.active_company_id
      : current.company.id;

  await updateSupabaseAuthUserForSuperAdmin({
    user: current.authUser,
    email,
    name,
    activeCompanyId,
  });
  await Promise.all([
    patchRows<ProfileRow>(
      'profiles',
      { full_name: name, email },
      { id: `eq.${input.userId}` }
    ),
    patchRows<MembershipRow>(
      'company_memberships',
      { role_id: nextRole.id, status: input.status },
      { company_id: `eq.${input.companyId}`, user_id: `eq.${input.userId}` }
    ),
  ]);

  const actions: Array<{ action: string; metadata?: Record<string, unknown>; severity?: AuditSeverity }> = [];
  if (current.profile?.full_name !== name) actions.push({ action: 'superadmin_user_name_updated' });
  if ((current.authUser.email || '').toLowerCase() !== email) actions.push({ action: 'superadmin_user_email_updated' });
  if (current.membership.role_id !== nextRole.id) {
    actions.push({ action: 'superadmin_user_role_updated', metadata: { previous_role_id: current.membership.role_id, next_role_id: nextRole.id } });
  }
  if (current.membership.status !== input.status) {
    actions.push({
      action: input.status === 'inactive' ? 'superadmin_user_suspended' : 'superadmin_user_reactivated',
      severity: input.status === 'inactive' ? 'warn' : 'info',
    });
  }
  if (actions.length > 0) {
    await auditSuperAdminUserChanges({
      companyId: input.companyId,
      userId: input.userId,
      actorSupabaseUserId: input.actorSupabaseUserId,
      requestMetadata: input.requestMetadata,
      actions,
    });
  }

  const result = await getSuperAdminCompanyUsers(input.companyId);
  const user = result.users.find((item) => item.id === input.userId);
  if (!user) throw new SaasBootstrapError('Usuario atualizado, mas nao retornado pela listagem.', 500);
  return user;
};

export const resetSuperAdminCompanyUserPassword = async (params: {
  companyId: string;
  userId: string;
  password: string;
  actorSupabaseUserId: string | null;
  requestMetadata?: CreateCompanyFromPanelInput['requestMetadata'];
}) => {
  const password = params.password.trim();
  if (password.length < 8) {
    throw new SaasBootstrapError('A nova senha temporaria precisa ter pelo menos 8 caracteres.', 400);
  }

  const current = await loadSuperAdminCompanyUser(params.companyId, params.userId);
  await updateSupabaseAuthUserForSuperAdmin({ user: current.authUser, password });
  await auditSuperAdminUserChanges({
    companyId: params.companyId,
    userId: params.userId,
    actorSupabaseUserId: params.actorSupabaseUserId,
    requestMetadata: params.requestMetadata,
    actions: [{ action: 'superadmin_user_password_reset', severity: 'warn' }],
  });
  return { userId: params.userId };
};

export const listSuperAdminMemberships = async (companyId?: string): Promise<SuperAdminMembershipSummary[]> => {
  const memberships = await listRows<MembershipRow>('company_memberships', {
    select: 'id,company_id,user_id,role_id,is_owner,status,is_default,created_at',
    ...(companyId ? { company_id: `eq.${companyId}` } : {}),
    order: 'created_at.desc',
  });
  const profiles = await fetchProfiles(Array.from(new Set(memberships.map((membership) => membership.user_id))));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

  return memberships.map((membership) => {
    const profile = profileById.get(membership.user_id) || null;
    return {
      membershipId: membership.id,
      companyId: membership.company_id,
      userId: membership.user_id,
      roleId: membership.role_id,
      isOwner: membership.is_owner,
      isDefault: membership.is_default,
      status: membership.status,
      createdAt: membership.created_at,
      fullName: profile?.full_name || null,
      email: profile?.email || null,
      loginName: profile?.login_name || null,
    };
  });
};

export const createCompanyFromPanel = async (
  input: CreateCompanyFromPanelInput
): Promise<CreateCompanyFromPanelResult> => {
  const normalized = validateCompanyInput(input);
  const adminFullName = input.adminFullName.trim();
  const adminEmail = input.adminEmail.trim().toLowerCase();
  const adminPassword = input.adminPassword.trim();
  const adminLoginName = normalizeText(input.adminLoginName)?.toLowerCase() || null;

  if (!adminFullName) {
    throw new SaasBootstrapError('Nome completo do administrador obrigatorio.', 400);
  }

  if (!adminEmail || !adminEmail.includes('@')) {
    throw new SaasBootstrapError('E-mail do administrador invalido.', 400);
  }

  if (!adminPassword || adminPassword.length < 8) {
    throw new SaasBootstrapError('A senha temporaria precisa ter pelo menos 8 caracteres.', 400);
  }

  const existingCompany = await fetchCompanyBySlug(normalized.companySlug!);
  if (existingCompany) {
    throw new SaasBootstrapError(
      `Ja existe uma empresa com o slug "${normalized.companySlug}". Escolha outro slug.`,
      409
    );
  }

  let authUser: Awaited<ReturnType<typeof createSupabaseAuthUser>> | null = null;
  let bootstrapResult: Awaited<ReturnType<typeof bootstrapFirstCompanyForSupabaseUser>> | null = null;

  try {
    authUser = await createSupabaseAuthUser({
      email: adminEmail,
      password: adminPassword,
      fullName: adminFullName,
      loginName: adminLoginName,
      userMetadata: {
        require_password_change: normalized.requirePasswordChange,
      },
    });

    bootstrapResult = await bootstrapFirstCompanyForSupabaseUser({
      actor: input.actor,
      supabaseUserId: authUser.id,
      authUser,
      companySlug: normalized.companySlug,
      companyTradeName: normalized.companyTradeName,
      companyLegalName: normalized.companyLegalName,
      companyDocumentNumber: normalized.documentNumber,
      profileFullName: adminFullName,
      profileEmail: authUser.email || adminEmail,
      profileLoginName: adminLoginName,
      forceSetActiveCompany: true,
    });

    await patchCompanyOperationalData({
      companyId: bootstrapResult.companyId,
      companyTradeName: normalized.companyTradeName,
      companyLegalName: normalized.companyLegalName,
      documentNumber: normalized.documentNumber,
      phone: normalized.phone,
      email: normalized.email,
      addressLine: normalized.addressLine,
      city: normalized.city,
      stateCode: normalized.stateCode,
      zipCode: normalized.zipCode,
      status: normalized.status,
      defaultWarrantyDays: normalized.defaultWarrantyDays,
      planName: normalized.planName,
      trialStartsAt: normalized.trialStartsAt,
      trialEndsAt: normalized.trialEndsAt,
      internalNotes: normalized.internalNotes,
      requirePasswordChange: normalized.requirePasswordChange,
    });

    await insertAuditLogs([
      {
        companyId: bootstrapResult.companyId,
        actorUserId: input.actorSupabaseUserId || null,
        action: 'superadmin_company_provisioned',
        entity: 'company',
        entityId: bootstrapResult.companyId,
        severity: 'info',
        success: true,
        requestId: input.requestMetadata?.requestId || null,
        ipAddress: input.requestMetadata?.ipAddress || null,
        userAgent: input.requestMetadata?.userAgent || null,
        metadata: {
          platform_admin_id: input.requestMetadata?.platformAdminId || null,
          company_slug: bootstrapResult.companySlug,
          company_status: normalized.status,
          admin_auth_user_id: bootstrapResult.authUserId,
          admin_login_name: adminLoginName,
          require_password_change: normalized.requirePasswordChange,
        },
      },
    ]);
  } catch (error) {
    if (bootstrapResult?.companyId && authUser) {
      await deleteCompanyDeep({
        companyId: bootstrapResult.companyId,
        authUserId: authUser.id,
      });
    } else if (authUser) {
      try {
        await deleteSupabaseAuthUser(authUser.id);
      } catch (cleanupError) {
        console.error('Falha ao limpar usuario do Supabase apos erro no bootstrap:', cleanupError);
      }
    }

    throw error;
  }

  if (!bootstrapResult || !authUser) {
    throw new SaasBootstrapError('Bootstrap administrativo nao retornou resultado.', 500);
  }

  return {
    ...bootstrapResult,
    tradeName: normalized.companyTradeName,
    adminEmail: authUser.email || adminEmail,
    adminLoginName,
    status: normalized.status,
  };
};

export const updateCompanyFromPanel = async (
  actorSupabaseUserId: string | null,
  input: UpdateSuperAdminCompanyInput,
  requestMetadata?: { requestId?: string | null; ipAddress?: string | null; userAgent?: string | null; platformAdminId?: string | null }
) => {
  const normalized = validateCompanyInput(input);
  const existing = await selectSingle<CompanyRow>('companies', {
    select:
      'id,slug,trade_name,legal_name,document_number,phone,email,address_line,city,state_code,zip_code,status,created_at',
    id: `eq.${input.companyId}`,
  });

  if (!existing) {
    throw new SaasBootstrapError('Empresa nao encontrada.', 404);
  }

  await patchCompanyOperationalData({
    companyId: input.companyId,
    companyTradeName: normalized.companyTradeName,
    companyLegalName: normalized.companyLegalName,
    documentNumber: normalized.documentNumber,
    phone: normalized.phone,
    email: normalized.email,
    addressLine: normalized.addressLine,
    city: normalized.city,
    stateCode: normalized.stateCode,
    zipCode: normalized.zipCode,
    status: normalized.status,
    defaultWarrantyDays: normalized.defaultWarrantyDays,
    planName: normalized.planName,
    trialStartsAt: normalized.trialStartsAt,
    trialEndsAt: normalized.trialEndsAt,
    internalNotes: normalized.internalNotes,
    requirePasswordChange: normalized.requirePasswordChange,
  });

  await insertAuditLogs([
    {
      companyId: input.companyId,
      actorUserId: actorSupabaseUserId,
      action: 'superadmin_company_updated',
      entity: 'company',
      entityId: input.companyId,
      severity: 'info',
      success: true,
      requestId: requestMetadata?.requestId || null,
      ipAddress: requestMetadata?.ipAddress || null,
      userAgent: requestMetadata?.userAgent || null,
      metadata: {
        platform_admin_id: requestMetadata?.platformAdminId || null,
        previous_status: existing.status,
        next_status: normalized.status,
      },
    },
  ]);

  return {
    companyId: input.companyId,
    status: normalized.status,
  };
};

export const setCompanyStatusFromPanel = async (params: {
  actorSupabaseUserId: string | null;
  companyId: string;
  status: TenantStatus;
  requestMetadata?: {
    requestId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    platformAdminId?: string | null;
  };
}) => {
  const status = normalizeStatus(params.status);
  const existing = await selectSingle<CompanyRow>('companies', {
    select:
      'id,slug,trade_name,legal_name,document_number,phone,email,address_line,city,state_code,zip_code,status,created_at',
    id: `eq.${params.companyId}`,
  });

  if (!existing) {
    throw new SaasBootstrapError('Empresa nao encontrada.', 404);
  }

  await patchRows<CompanyRow>(
    'companies',
    {
      status,
    },
    {
      id: `eq.${params.companyId}`,
    }
  );

  const action =
    status === 'suspended'
      ? 'superadmin_company_suspended'
      : status === 'active'
        ? 'superadmin_company_activated'
        : status === 'trial'
          ? 'superadmin_company_trial_enabled'
          : 'superadmin_company_inactivated';

  await insertAuditLogs([
    {
      companyId: params.companyId,
      actorUserId: params.actorSupabaseUserId,
      action,
      entity: 'company',
      entityId: params.companyId,
      severity: 'warn',
      success: true,
      requestId: params.requestMetadata?.requestId || null,
      ipAddress: params.requestMetadata?.ipAddress || null,
      userAgent: params.requestMetadata?.userAgent || null,
      metadata: {
        platform_admin_id: params.requestMetadata?.platformAdminId || null,
        previous_status: existing.status,
        next_status: status,
      },
    },
  ]);

  return {
    companyId: params.companyId,
    previousStatus: existing.status,
    nextStatus: status,
  };
};
