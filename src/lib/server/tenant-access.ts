import type {
  TenantAccessState,
  TenantCompanySummary,
  TenantContext,
  TenantMembershipSummary,
} from '@/types/saas';
import { getSupabaseUserConfig } from './supabase-user';

type MembershipApiRow = {
  id: string;
  company_id: string;
  role_id: string | null;
  is_owner: boolean;
  status: TenantMembershipSummary['status'];
  is_default: boolean;
};

type CompanyApiRow = {
  id: string;
  slug: string;
  trade_name: string;
  status: TenantCompanySummary['status'];
};

const buildRestUrl = (path: string, params: Record<string, string>) => {
  const { url } = getSupabaseUserConfig();
  const searchParams = new URLSearchParams(params);
  return `${url}/rest/v1/${path}?${searchParams.toString()}`;
};

const buildRestHeaders = (accessToken: string) => {
  const { anonKey } = getSupabaseUserConfig();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
  };
};

const fetchMembership = async (
  accessToken: string,
  tenantContext: TenantContext
): Promise<TenantMembershipSummary | null> => {
  if (!tenantContext.activeCompanyId) {
    return null;
  }

  const response = await fetch(
    buildRestUrl('company_memberships', {
      select: 'id,company_id,role_id,is_owner,status,is_default',
      user_id: `eq.${tenantContext.userId}`,
      company_id: `eq.${tenantContext.activeCompanyId}`,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildRestHeaders(accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao consultar membership ativa (${response.status}).`);
  }

  const rows = (await response.json()) as MembershipApiRow[];
  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    companyId: row.company_id,
    roleId: row.role_id,
    isOwner: row.is_owner,
    status: row.status,
    isDefault: row.is_default,
  };
};

const fetchCompany = async (
  accessToken: string,
  activeCompanyId: string
): Promise<TenantCompanySummary | null> => {
  const response = await fetch(
    buildRestUrl('companies', {
      select: 'id,slug,trade_name,status',
      id: `eq.${activeCompanyId}`,
      limit: '1',
    }),
    {
      method: 'GET',
      headers: buildRestHeaders(accessToken),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao consultar empresa ativa (${response.status}).`);
  }

  const rows = (await response.json()) as CompanyApiRow[];
  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    slug: row.slug,
    tradeName: row.trade_name,
    status: row.status,
  };
};

export const resolveTenantAccessState = async (params: {
  accessToken: string;
  tenantContext: TenantContext;
}): Promise<TenantAccessState> => {
  const { accessToken, tenantContext } = params;

  if (!tenantContext.activeCompanyId) {
    return {
      status: 'no_active_company',
      canAccessTenant: false,
      activeCompanyId: null,
      membership: null,
      company: null,
    };
  }

  const [membership, company] = await Promise.all([
    fetchMembership(accessToken, tenantContext),
    fetchCompany(accessToken, tenantContext.activeCompanyId),
  ]);

  if (!membership) {
    return {
      status: 'membership_not_found',
      canAccessTenant: false,
      activeCompanyId: tenantContext.activeCompanyId,
      membership: null,
      company,
    };
  }

  if (membership.status !== 'active') {
    return {
      status: 'membership_inactive',
      canAccessTenant: false,
      activeCompanyId: tenantContext.activeCompanyId,
      membership,
      company,
    };
  }

  if (!company) {
    return {
      status: 'company_not_found',
      canAccessTenant: false,
      activeCompanyId: tenantContext.activeCompanyId,
      membership,
      company: null,
    };
  }

  if (company.status !== 'active' && company.status !== 'trial') {
    return {
      status: 'company_inactive',
      canAccessTenant: false,
      activeCompanyId: tenantContext.activeCompanyId,
      membership,
      company,
    };
  }

  return {
    status: 'ready',
    canAccessTenant: true,
    activeCompanyId: tenantContext.activeCompanyId,
    membership,
    company,
  };
};
