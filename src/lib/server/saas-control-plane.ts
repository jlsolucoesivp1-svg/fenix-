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
import { listSaasUsers } from './saas-users';

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

export const getSuperAdminCompanyUsers = async (companyId: string) => listSaasUsers(companyId);

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
