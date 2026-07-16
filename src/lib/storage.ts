'use client';

import type {
  Appointment,
  AppSettings,
  CompanyAssetKind,
  CompanyAssetSummary,
  CompanyInfo,
  Customer,
  CustomerSearchResult,
  DashboardOverview,
  FinancialTransaction,
  Kit,
  OSPayment,
  Quote,
  Sale,
  SaleItem,
  ServiceOrder,
  ServiceOrderFileSummary,
  ServiceOrderViewMetadata,
  StockItem,
  User,
} from '@/types';
import type {
  AppSessionAuthSource,
  AppSessionSnapshot,
  SupabaseAuthUserSummary,
  TenantAccessState,
  TenantContext,
} from '@/types/saas';

type CollectionMap = {
  users: User[];
  customers: Customer[];
  serviceOrders: ServiceOrder[];
  stock: StockItem[];
  sales: Sale[];
  financialTransactions: FinancialTransaction[];
  appointments: Appointment[];
  quotes: Quote[];
  kits: Kit[];
  serviceOrderViews: ServiceOrderViewMetadata[];
};

type SingletonMap = {
  companyInfo: CompanyInfo;
  settings: AppSettings;
};

type DataType = keyof CollectionMap | keyof SingletonMap;

const BROWSER_SESSION_KEY = 'assistec-now-browser-session';
const SESSION_CACHE_TTL_MS = 30_000;
const DATA_CACHE_TTL_MS = 30_000;

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: 'Sua Empresa',
  address: '',
  phone: '',
  emailOrSite: '',
  document: '',
  logoUrl: '',
  pixKey: '',
};

const DEFAULT_SETTINGS: AppSettings = {
  defaultWarrantyDays: 90,
};

let currentUserCache: User | null | undefined;
let currentUserCacheExpiresAt = 0;
let currentUserRequest: Promise<User | null> | null = null;
let currentAppSessionCache: ClientAppSession | undefined;
let currentAppSessionCacheExpiresAt = 0;
let currentAppSessionRequest: Promise<ClientAppSession> | null = null;
const collectionCache = new Map<string, { expiresAt: number; value: unknown }>();
const collectionRequests = new Map<string, Promise<unknown>>();
const singletonCache = new Map<string, { expiresAt: number; value: unknown }>();
const singletonRequests = new Map<string, Promise<unknown>>();

const dispatchStorageChange = (suffix?: string) => {
  window.dispatchEvent(new Event('storage-change'));
  if (suffix) {
    window.dispatchEvent(new Event(`storage-change-${suffix}`));
  }
};

const dispatchAuthChange = () => {
  window.dispatchEvent(new Event('auth-change'));
};

const hasBrowserSessionMarker = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(BROWSER_SESSION_KEY) !== null;
};

const writeBrowserSessionMarker = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(BROWSER_SESSION_KEY, String(Date.now()));
};

const clearBrowserSessionMarker = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(BROWSER_SESSION_KEY);
};

const clearCurrentUserCache = () => {
  currentUserCache = undefined;
  currentUserCacheExpiresAt = 0;
  currentUserRequest = null;
};

type ClientAppSession = AppSessionSnapshot & {
  user: User | null;
};

type BootstrapSaasInput = {
  supabaseUserId: string;
  bootstrapSecret: string;
  companySlug?: string;
  companyTradeName?: string;
  companyLegalName?: string;
  forceSetActiveCompany?: boolean;
};

type BootstrapSaasResult = {
  companyId: string;
  companySlug: string;
  roleId: string;
  membershipId: string;
  profileUserId: string;
  authUserId: string;
  activeCompanyId: string;
};

export type SuperAdminCompanySummary = {
  companyId: string;
  slug: string;
  tradeName: string;
  legalName: string | null;
  documentNumber: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
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
};

export type CreateSuperAdminCompanyInput = {
  companyTradeName: string;
  companyLegalName?: string;
  companySlug?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  city?: string;
  stateCode?: string;
  zipCode?: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  adminFullName: string;
  adminEmail: string;
  adminPassword: string;
  adminLoginName?: string;
  defaultWarrantyDays?: number;
  planName?: string;
  trialStartsAt?: string;
  trialEndsAt?: string;
  internalNotes?: string;
  requirePasswordChange?: boolean;
};

export type CreateSuperAdminCompanyResult = {
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
  status: 'active' | 'inactive' | 'suspended' | 'trial';
};

export type UpdateSuperAdminCompanyInput = {
  companyId: string;
  companyTradeName: string;
  companyLegalName?: string;
  documentNumber?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  city?: string;
  stateCode?: string;
  zipCode?: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
  defaultWarrantyDays?: number;
  planName?: string;
  trialStartsAt?: string;
  trialEndsAt?: string;
  internalNotes?: string;
  requirePasswordChange?: boolean;
};

export type SuperAdminDashboardSummary = {
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
};

export type SuperAdminAuditLogSummary = {
  id: number;
  companyId: string | null;
  actorUserId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  requestId: string | null;
  success: boolean;
  severity: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type SuperAdminMembershipSummary = {
  membershipId: string;
  companyId: string;
  userId: string;
  roleId: string | null;
  isOwner: boolean;
  isDefault: boolean;
  status: 'active' | 'inactive' | 'invited' | 'revoked';
  createdAt: string;
  fullName: string | null;
  email: string | null;
  loginName: string | null;
};

export const invalidateLoggedInUserCache = () => {
  clearCurrentUserCache();
  currentAppSessionCache = undefined;
  currentAppSessionCacheExpiresAt = 0;
  currentAppSessionRequest = null;
};

export const invalidateDataCache = (dataType?: string) => {
  if (dataType) {
    collectionCache.delete(dataType);
    collectionRequests.delete(dataType);
    singletonCache.delete(dataType);
    singletonRequests.delete(dataType);
    return;
  }

  collectionCache.clear();
  collectionRequests.clear();
  singletonCache.clear();
  singletonRequests.clear();
};

const readTimedCache = <T>(cache: Map<string, { expiresAt: number; value: unknown }>, key: string): T | undefined => {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return entry.value as T;
};

const writeTimedCache = <T>(
  cache: Map<string, { expiresAt: number; value: unknown }>,
  key: string,
  value: T,
  ttlMs = DATA_CACHE_TTL_MS
): T => {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  return value;
};

const apiFetch = async <T>(input: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `Falha na requisicao: ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        errorMessage = payload.error;
      }
    } catch {
      // noop
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
};

const getCollection = async <K extends keyof CollectionMap>(dataType: K): Promise<CollectionMap[K]> => {
  const cached = readTimedCache<CollectionMap[K]>(collectionCache, dataType);
  if (cached !== undefined) {
    return cached;
  }

  const pendingRequest = collectionRequests.get(dataType) as Promise<CollectionMap[K]> | undefined;
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = apiFetch<CollectionMap[K]>(`/api/data/${dataType}`)
    .then((payload) => writeTimedCache(collectionCache, dataType, payload))
    .finally(() => {
      collectionRequests.delete(dataType);
    });

  collectionRequests.set(dataType, request);
  return request;
};

const saveCollection = async <K extends keyof CollectionMap>(dataType: K, payload: CollectionMap[K]): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/data/${dataType}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  writeTimedCache(collectionCache, dataType, payload);
  collectionRequests.delete(dataType);
  dispatchStorageChange(dataType);
};

const getSingleton = async <K extends keyof SingletonMap>(dataType: K, fallback: SingletonMap[K]): Promise<SingletonMap[K]> => {
  const cached = readTimedCache<SingletonMap[K] | null>(singletonCache, dataType);
  if (cached !== undefined) {
    return cached || fallback;
  }

  const pendingRequest = singletonRequests.get(dataType) as Promise<SingletonMap[K] | null> | undefined;
  if (pendingRequest) {
    const payload = await pendingRequest;
    return payload || fallback;
  }

  const request = apiFetch<SingletonMap[K] | null>(`/api/data/${dataType}`)
    .then((payload) => writeTimedCache(singletonCache, dataType, payload))
    .finally(() => {
      singletonRequests.delete(dataType);
    });

  singletonRequests.set(dataType, request);
  const payload = await request;
  return payload || fallback;
};

const saveSingleton = async <K extends keyof SingletonMap>(dataType: K, payload: SingletonMap[K]): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/data/${dataType}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  writeTimedCache(singletonCache, dataType, payload);
  singletonRequests.delete(dataType);
  dispatchStorageChange(dataType);
};

// --- Authentication ---

export const signInWithLoginAndPassword = async (login: string, password: string): Promise<User> => {
  const payload = await apiFetch<{ user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
  writeBrowserSessionMarker();
  currentUserCache = payload.user;
  currentUserCacheExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
  currentUserRequest = null;
  currentAppSessionCache = {
    user: payload.user,
      authSource: 'legacy',
      tenantContext: null,
      supabaseUser: null,
      tenantAccess: null,
      effectivePermissions: payload.user.permissions,
    };
  currentAppSessionCacheExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
  currentAppSessionRequest = null;
  dispatchAuthChange();
  return payload.user;
};

export const signInWithSupabaseEmailAndPassword = async (
  email: string,
  password: string
): Promise<ClientAppSession> => {
  const payload = await apiFetch<ClientAppSession>('/api/auth/supabase-login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  clearBrowserSessionMarker();
  currentUserCache = null;
  currentUserCacheExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
  currentUserRequest = null;
  currentAppSessionCache = payload;
  currentAppSessionCacheExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
  currentAppSessionRequest = null;
  dispatchAuthChange();

  return payload;
};

export const registerUser = async (name: string, login: string, password: string): Promise<User> => {
  const payload = await apiFetch<{ user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, login, password }),
  });
  return payload.user;
};

export const signOut = async (): Promise<void> => {
  clearBrowserSessionMarker();
  invalidateLoggedInUserCache();
  try {
    await apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  } finally {
    clearBrowserSessionMarker();
    invalidateLoggedInUserCache();
    dispatchAuthChange();
  }
};

export const getCurrentAppSession = async (): Promise<ClientAppSession> => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      authSource: 'none',
      tenantContext: null,
      supabaseUser: null,
      tenantAccess: null,
      effectivePermissions: null,
    };
  }

  if (currentAppSessionCache && currentAppSessionCacheExpiresAt > Date.now()) {
    return currentAppSessionCache;
  }

  if (currentAppSessionRequest) {
    return currentAppSessionRequest;
  }

  currentAppSessionRequest = apiFetch<{
    user: User | null;
    authSource: AppSessionAuthSource;
    tenantContext: TenantContext | null;
    supabaseUser: SupabaseAuthUserSummary | null;
    tenantAccess: TenantAccessState | null;
    effectivePermissions: User['permissions'] | null;
  }>('/api/auth/session')
    .then((payload) => {
      currentAppSessionCache = payload;
      currentAppSessionCacheExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
      currentUserCache = payload.user;
      currentUserCacheExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
      return payload;
    })
    .catch((error) => {
      currentAppSessionCache = {
        user: null,
        authSource: 'none',
        tenantContext: null,
        supabaseUser: null,
        tenantAccess: null,
        effectivePermissions: null,
      };
      currentAppSessionCacheExpiresAt = 0;
      clearCurrentUserCache();
      throw error;
    })
    .finally(() => {
      currentAppSessionRequest = null;
    });

  return currentAppSessionRequest;
};

export const bootstrapSaasTenant = async (
  payload: BootstrapSaasInput
): Promise<BootstrapSaasResult> => {
  const response = await fetch('/api/internal/saas/bootstrap', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-saas-bootstrap-secret': payload.bootstrapSecret,
    },
    body: JSON.stringify({
      supabaseUserId: payload.supabaseUserId,
      companySlug: payload.companySlug?.trim() || undefined,
      companyTradeName: payload.companyTradeName?.trim() || undefined,
      companyLegalName: payload.companyLegalName?.trim() || undefined,
      forceSetActiveCompany: payload.forceSetActiveCompany ?? true,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Falha na requisicao: ${response.status}`;
    try {
      const errorPayload = await response.json();
      if (errorPayload?.error) {
        errorMessage = errorPayload.error;
      }
    } catch {
      // noop
    }

    throw new Error(errorMessage);
  }

  const result = (await response.json()) as {
    success: boolean;
    result: BootstrapSaasResult;
  };

  invalidateLoggedInUserCache();
  dispatchAuthChange();

  return result.result;
};

export const listSuperAdminCompanies = async (): Promise<SuperAdminCompanySummary[]> => {
  const payload = await apiFetch<{ companies: SuperAdminCompanySummary[] }>('/api/internal/superadmin/companies');
  return payload.companies;
};

export const createSuperAdminCompany = async (
  payload: CreateSuperAdminCompanyInput
): Promise<CreateSuperAdminCompanyResult> => {
  const response = await apiFetch<{ result: CreateSuperAdminCompanyResult }>(
    '/api/internal/superadmin/companies',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return response.result;
};

export const updateSuperAdminCompany = async (payload: UpdateSuperAdminCompanyInput) => {
  const response = await apiFetch<{ result: { companyId: string; status: 'active' | 'inactive' | 'suspended' | 'trial' } }>(
    '/api/internal/superadmin/companies',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );

  return response.result;
};

export const setSuperAdminCompanyStatus = async (payload: {
  companyId: string;
  status: 'active' | 'inactive' | 'suspended' | 'trial';
}) => {
  const response = await apiFetch<{ result: { companyId: string; previousStatus: string; nextStatus: string } }>(
    '/api/internal/superadmin/companies',
    {
      method: 'PATCH',
      body: JSON.stringify({
        operation: 'set-status',
        ...payload,
      }),
    }
  );

  return response.result;
};

export const getSuperAdminDashboardSummary = async (): Promise<SuperAdminDashboardSummary> => {
  const payload = await apiFetch<{ summary: SuperAdminDashboardSummary }>('/api/internal/superadmin/dashboard');
  return payload.summary;
};

export const listSuperAdminAuditLogs = async (params?: { companyId?: string; limit?: number }) => {
  const search = new URLSearchParams();
  if (params?.companyId) {
    search.set('companyId', params.companyId);
  }
  if (typeof params?.limit === 'number') {
    search.set('limit', String(params.limit));
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  const payload = await apiFetch<{ logs: SuperAdminAuditLogSummary[] }>(`/api/internal/superadmin/audit${suffix}`);
  return payload.logs;
};

export const listSuperAdminCompanyUsers = async (companyId: string) => {
  const payload = await apiFetch<{ users: User[] }>(
    `/api/internal/superadmin/users?companyId=${encodeURIComponent(companyId)}`
  );
  return payload.users;
};

export const listSuperAdminMemberships = async (companyId?: string) => {
  const search = new URLSearchParams();
  if (companyId) {
    search.set('companyId', companyId);
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  const payload = await apiFetch<{ memberships: SuperAdminMembershipSummary[] }>(
    `/api/internal/superadmin/memberships${suffix}`
  );
  return payload.memberships;
};

export const getLoggedInUser = async (): Promise<User | null> => {
  if (typeof window === 'undefined') return null;
  if (!hasBrowserSessionMarker()) {
    clearCurrentUserCache();
    return null;
  }

  if (currentUserCache !== undefined && currentUserCacheExpiresAt > Date.now()) {
    return currentUserCache;
  }

  if (currentUserRequest) {
    return currentUserRequest;
  }

  try {
    currentUserRequest = getCurrentAppSession()
      .then((session) => {
        currentUserCache = session.user;
        currentUserCacheExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
        return session.user;
      })
      .finally(() => {
        currentUserRequest = null;
      });

    return await currentUserRequest;
  } catch (error) {
    console.error('Erro ao buscar sessao atual:', error);
    clearCurrentUserCache();
    return null;
  }
};

export const hasRegisteredUsers = async (): Promise<boolean> => {
  try {
    const payload = await apiFetch<{ hasUsers: boolean }>('/api/auth/bootstrap-status');
    return payload.hasUsers;
  } catch (error) {
    console.error('Erro ao verificar existencia de usuarios:', error);
    return false;
  }
};

export const hasActiveBrowserSession = (): boolean => hasBrowserSessionMarker();

// --- Data Access Functions ---

export const getUsers = async (): Promise<User[]> => getCollection('users');
export const saveUsers = async (users: User[]): Promise<void> => saveCollection('users', users);
export const listTenantUsers = async (): Promise<User[]> => {
  return apiFetch<User[]>('/api/usuarios');
};

export const createTenantUser = async (user: Partial<User>): Promise<User> => {
  const createdUser = await apiFetch<User>('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(user),
  });

  invalidateDataCache('users');
  dispatchStorageChange('users');

  return createdUser;
};

export const updateTenantUser = async (user: Partial<User> & { id: string }): Promise<User> => {
  const updatedUser = await apiFetch<User>(`/api/usuarios/${encodeURIComponent(user.id)}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  });

  invalidateDataCache('users');
  dispatchStorageChange('users');

  return updatedUser;
};

export const deleteTenantUser = async (userId: string): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/usuarios/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });

  invalidateDataCache('users');
  dispatchStorageChange('users');
};

export const getCustomers = async (): Promise<Customer[]> => getCollection('customers');
export const saveCustomers = async (customers: Customer[]): Promise<void> => saveCollection('customers', customers);
export const searchCustomers = async (name: string, limit = 10): Promise<CustomerSearchResult[]> => {
  const params = new URLSearchParams({
    nome: name,
    limit: String(limit),
  });

  return apiFetch<CustomerSearchResult[]>(`/api/clientes/search?${params.toString()}`);
};

export const listTenantCustomers = async (): Promise<Customer[]> => {
  return apiFetch<Customer[]>('/api/clientes');
};

export const getEffectiveCompanyInfo = async (): Promise<CompanyInfo> => {
  const session = await getCurrentAppSession();
  if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
    return getTenantCompanyInfo();
  }

  return getCompanyInfo();
};

export const getEffectiveSettings = async (): Promise<AppSettings> => {
  const session = await getCurrentAppSession();
  if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
    return getTenantSettings();
  }

  return getSettings();
};

export const getEffectiveCustomers = async (): Promise<Customer[]> => {
  const session = await getCurrentAppSession();
  if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
    return listTenantCustomers();
  }

  return getCustomers();
};

export const listTenantCustomerFiles = async (
  customerId: string
): Promise<ServiceOrderFileSummary[]> => {
  return apiFetch<ServiceOrderFileSummary[]>(
    `/api/clientes/files?customerId=${encodeURIComponent(customerId)}`
  );
};

export const uploadTenantCustomerFile = async (
  customerId: string,
  file: File
): Promise<ServiceOrderFileSummary[]> => {
  const formData = new FormData();
  formData.append('customerId', customerId);
  formData.append('file', file);

  const response = await fetch('/api/clientes/files', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Falha na requisicao: ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        errorMessage = payload.error;
      }
    } catch {
      // noop
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as ServiceOrderFileSummary[];
};

export const deleteTenantCustomerFile = async (
  customerId: string,
  path: string
): Promise<ServiceOrderFileSummary[]> => {
  return apiFetch<ServiceOrderFileSummary[]>(
    `/api/clientes/files?customerId=${encodeURIComponent(customerId)}&path=${encodeURIComponent(path)}`,
    {
      method: 'DELETE',
    }
  );
};

export const createTenantCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
  const createdCustomer = await apiFetch<Customer>('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(customer),
  });

  invalidateDataCache('customers');
  dispatchStorageChange('customers');

  return createdCustomer;
};

export const updateTenantCustomer = async (customer: Customer): Promise<Customer> => {
  const updatedCustomer = await apiFetch<Customer>(`/api/clientes/${encodeURIComponent(customer.id)}`, {
    method: 'PUT',
    body: JSON.stringify(customer),
  });

  invalidateDataCache('customers');
  dispatchStorageChange('customers');

  return updatedCustomer;
};

export const deleteTenantCustomer = async (customerId: string): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/clientes/${encodeURIComponent(customerId)}`, {
    method: 'DELETE',
  });

  invalidateDataCache('customers');
  dispatchStorageChange('customers');
};

export const searchTenantCustomers = async (name: string, limit = 10): Promise<CustomerSearchResult[]> => {
  const params = new URLSearchParams({
    nome: name,
    limit: String(limit),
    runtime: 'saas',
  });

  return apiFetch<CustomerSearchResult[]>(`/api/clientes/search?${params.toString()}`);
};

export const importCustomers = async (
  customersToImport: Customer[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ imported: number; total: number }> => {
  const sanitizedCustomers = customersToImport.filter(
    (customer) => customer.id && customer.name.trim().length > 0
  );

  if (mode === 'replace') {
    await saveCustomers(sanitizedCustomers);
    return { imported: sanitizedCustomers.length, total: sanitizedCustomers.length };
  }

  const currentCustomers = await getCustomers();
  const mergedCustomers = [...currentCustomers];
  const indexByDocument = new Map<string, number>();
  const indexByNamePhone = new Map<string, number>();

  for (let i = 0; i < mergedCustomers.length; i += 1) {
    const customer = mergedCustomers[i];
    const documentKey = customer.document.trim();
    const namePhoneKey = `${customer.name.trim().toLowerCase()}|${customer.phone.trim()}`;

    if (documentKey) {
      indexByDocument.set(documentKey, i);
    }
    indexByNamePhone.set(namePhoneKey, i);
  }

  let imported = 0;

  for (const customer of sanitizedCustomers) {
    const documentKey = customer.document.trim();
    const namePhoneKey = `${customer.name.trim().toLowerCase()}|${customer.phone.trim()}`;
    const existingIndex =
      (documentKey ? indexByDocument.get(documentKey) : undefined) ??
      indexByNamePhone.get(namePhoneKey);

    if (existingIndex !== undefined) {
      mergedCustomers[existingIndex] = {
        ...mergedCustomers[existingIndex],
        ...customer,
        id: mergedCustomers[existingIndex].id,
      };
    } else {
      mergedCustomers.push(customer);
      const newIndex = mergedCustomers.length - 1;
      if (documentKey) {
        indexByDocument.set(documentKey, newIndex);
      }
      indexByNamePhone.set(namePhoneKey, newIndex);
    }

    imported += 1;
  }

  await saveCustomers(mergedCustomers);
  return { imported, total: mergedCustomers.length };
};

export const getServiceOrders = async (): Promise<ServiceOrder[]> => getCollection('serviceOrders');
export const saveServiceOrders = async (orders: ServiceOrder[]): Promise<void> => saveCollection('serviceOrders', orders);
export const listTenantServiceOrders = async (): Promise<ServiceOrder[]> => {
  return apiFetch<ServiceOrder[]>('/api/service-orders/overview');
};

export const listTenantServiceOrderFiles = async (
  serviceOrderId: string
): Promise<ServiceOrderFileSummary[]> => {
  return apiFetch<ServiceOrderFileSummary[]>(
    `/api/service-orders/files?serviceOrderId=${encodeURIComponent(serviceOrderId)}`
  );
};

export const uploadTenantServiceOrderFile = async (
  serviceOrderId: string,
  file: File
): Promise<ServiceOrderFileSummary[]> => {
  const formData = new FormData();
  formData.append('serviceOrderId', serviceOrderId);
  formData.append('file', file);

  const response = await fetch('/api/service-orders/files', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Falha na requisicao: ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        errorMessage = payload.error;
      }
    } catch {
      // noop
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as ServiceOrderFileSummary[];
};

export const deleteTenantServiceOrderFile = async (
  serviceOrderId: string,
  path: string
): Promise<ServiceOrderFileSummary[]> => {
  return apiFetch<ServiceOrderFileSummary[]>(
    `/api/service-orders/files?serviceOrderId=${encodeURIComponent(serviceOrderId)}&path=${encodeURIComponent(path)}`,
    {
      method: 'DELETE',
    }
  );
};

export const getStock = async (): Promise<StockItem[]> => getCollection('stock');
export const saveStock = async (stock: StockItem[]): Promise<void> => saveCollection('stock', stock);
export const listTenantProducts = async (): Promise<StockItem[]> => {
  return apiFetch<StockItem[]>('/api/produtos');
};

export const createTenantProduct = async (item: StockItem): Promise<StockItem> => {
  const savedProduct = await apiFetch<StockItem>('/api/produtos', {
    method: 'POST',
    body: JSON.stringify(item),
  });

  invalidateDataCache('stock');
  dispatchStorageChange('stock');

  return savedProduct;
};

export const updateTenantProduct = async (item: StockItem): Promise<StockItem> => {
  const savedProduct = await apiFetch<StockItem>(`/api/produtos/${encodeURIComponent(item.id)}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });

  invalidateDataCache('stock');
  dispatchStorageChange('stock');

  return savedProduct;
};

export const deleteTenantProduct = async (productId: string): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/produtos/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });

  invalidateDataCache('stock');
  dispatchStorageChange('stock');
};

export const registerTenantStockEntry = async (params: {
  itemId: string;
  quantity: number;
  cost: number;
  entryId: string;
}): Promise<{ duplicated: boolean; updatedStock: StockItem[] }> => {
  const result = await apiFetch<{ duplicated: boolean; updatedStock: StockItem[] }>('/api/produtos/entrada', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  invalidateDataCache('stock');
  dispatchStorageChange('stock');

  return result;
};

type RegistrarDespesaEntradaEstoqueInput = {
  itemId: string;
  quantity: number;
  cost: number;
  entryId?: string;
};

type RegistrarDespesaEntradaEstoqueResult = {
  duplicated: boolean;
  updatedStock: StockItem[];
  transaction: FinancialTransaction | null;
};

export const registrarDespesaEntradaEstoque = async ({
  itemId,
  quantity,
  cost,
  entryId = `STOCK-ENTRY-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
}: RegistrarDespesaEntradaEstoqueInput): Promise<RegistrarDespesaEntradaEstoqueResult> => {
  const result = await apiFetch<RegistrarDespesaEntradaEstoqueResult>('/api/stock/entries', {
    method: 'POST',
    body: JSON.stringify({ itemId, quantity, cost, entryId }),
  });

  invalidateDataCache('stock');
  invalidateDataCache('financialTransactions');
  dispatchStorageChange('stock');
  dispatchStorageChange('financialTransactions');

  return result;
};

type SalvarItemEstoqueComFinanceiroInput = {
  item: StockItem;
  previousQuantity?: number;
  operationId?: string;
};

type SalvarItemEstoqueComFinanceiroResult = {
  duplicated: boolean;
  updatedStock: StockItem[];
  transaction: FinancialTransaction | null;
};

type FinalizarVendaInput = {
  saleId: string;
  items: SaleItem[];
  discount: number;
  paymentMethod: string;
  observations?: string;
  customerId?: string;
  customerName?: string;
  relatedQuoteId?: string;
  userName?: string;
  installments?: {
    enabled: boolean;
    count: number;
    firstDueDate?: string;
  };
};

type FinalizarVendaResult = {
  duplicated: boolean;
  sale: Sale;
  stock: StockItem[];
  transactions: FinancialTransaction[];
};

type EstornarVendaInput = {
  saleId: string;
  reason: string;
};

type EstornarVendaResult = {
  duplicated: boolean;
  sale: Sale;
  stock: StockItem[];
  transactions: FinancialTransaction[];
};

type FinalizarOrdemServicoInput = {
  orderId: string;
  newPayments: OSPayment[];
  newTransactions: FinancialTransaction[];
  nextStatus?: ServiceOrder['status'];
  deliveredDate?: string;
};

type FinalizarOrdemServicoResult = {
  duplicated: boolean;
  order: ServiceOrder;
  transactions: FinancialTransaction[];
};

type AtualizarStatusOrdemServicoInput = {
  orderId: string;
  status: ServiceOrder['status'];
};

type AtualizarStatusOrdemServicoResult = {
  duplicated: boolean;
  order: ServiceOrder;
};

type MarcarTransacaoComoPagaInput = {
  transactionId: string;
};

type MarcarTransacaoComoPagaResult = {
  duplicated: boolean;
  transaction: FinancialTransaction;
  order?: ServiceOrder;
};

type SalvarOrdemServicoComEstoqueInput = {
  serviceOrder: ServiceOrder;
};

type SalvarOrdemServicoComEstoqueResult = {
  duplicated: boolean;
  order: ServiceOrder;
  stock: StockItem[];
};

type ExcluirOrdemServicoInput = {
  orderId: string;
};

type ExcluirOrdemServicoResult = {
  duplicated: boolean;
  orderId: string;
  stock: StockItem[];
};

type CriarLancamentoManualInput = {
  transaction: Omit<FinancialTransaction, 'id' | 'relatedSaleId' | 'relatedServiceOrderId'>;
};

type CriarLancamentoManualResult = {
  duplicated: boolean;
  transaction: FinancialTransaction;
};

export const salvarItemEstoqueComFinanceiro = async ({
  item,
  previousQuantity = 0,
  operationId = `STOCK-SAVE-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
}: SalvarItemEstoqueComFinanceiroInput): Promise<SalvarItemEstoqueComFinanceiroResult> => {
  const result = await apiFetch<SalvarItemEstoqueComFinanceiroResult>('/api/stock/items', {
    method: 'POST',
    body: JSON.stringify({ item, previousQuantity, operationId }),
  });

  invalidateDataCache('stock');
  dispatchStorageChange('stock');
  if (result.transaction) {
    invalidateDataCache('financialTransactions');
    dispatchStorageChange('financialTransactions');
  }

  return result;
};

export const finalizarVenda = async (payload: FinalizarVendaInput): Promise<FinalizarVendaResult> => {
  const result = await apiFetch<FinalizarVendaResult>('/api/sales/finalize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  invalidateDataCache('sales');
  invalidateDataCache('stock');
  invalidateDataCache('financialTransactions');
  dispatchStorageChange('sales');
  dispatchStorageChange('stock');
  dispatchStorageChange('financialTransactions');

  return result;
};

export const estornarVenda = async (payload: EstornarVendaInput): Promise<EstornarVendaResult> => {
  const result = await apiFetch<EstornarVendaResult>('/api/sales/reverse', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  invalidateDataCache('sales');
  invalidateDataCache('stock');
  invalidateDataCache('financialTransactions');
  dispatchStorageChange('sales');
  dispatchStorageChange('stock');
  dispatchStorageChange('financialTransactions');

  return result;
};

export const finalizarOrdemServico = async (
  payload: FinalizarOrdemServicoInput
): Promise<FinalizarOrdemServicoResult> => {
  const result = await apiFetch<FinalizarOrdemServicoResult>('/api/service-orders/finalize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  invalidateDataCache('serviceOrders');
  invalidateDataCache('financialTransactions');
  dispatchStorageChange('serviceOrders');
  dispatchStorageChange('financialTransactions');

  return result;
};

export const atualizarStatusOrdemServico = async (
  payload: AtualizarStatusOrdemServicoInput
): Promise<AtualizarStatusOrdemServicoResult> => {
  const result = await apiFetch<AtualizarStatusOrdemServicoResult>('/api/service-orders/status', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  invalidateDataCache('serviceOrders');
  dispatchStorageChange('serviceOrders');

  return result;
};

export const marcarTransacaoComoPaga = async (
  payload: MarcarTransacaoComoPagaInput
): Promise<MarcarTransacaoComoPagaResult> => {
  const result = await apiFetch<MarcarTransacaoComoPagaResult>('/api/financial/mark-paid', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  invalidateDataCache('financialTransactions');
  dispatchStorageChange('financialTransactions');
  if (result.order) {
    invalidateDataCache('serviceOrders');
    dispatchStorageChange('serviceOrders');
  }

  return result;
};

export const salvarOrdemServicoComEstoque = async (
  payload: SalvarOrdemServicoComEstoqueInput
): Promise<SalvarOrdemServicoComEstoqueResult> => {
  const result = await apiFetch<SalvarOrdemServicoComEstoqueResult>('/api/service-orders/save', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  invalidateDataCache('serviceOrders');
  invalidateDataCache('stock');
  dispatchStorageChange('serviceOrders');
  dispatchStorageChange('stock');

  return result;
};

export const excluirOrdemServico = async (
  payload: ExcluirOrdemServicoInput
): Promise<ExcluirOrdemServicoResult> => {
  const result = await apiFetch<ExcluirOrdemServicoResult>('/api/service-orders/delete', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  invalidateDataCache('serviceOrders');
  invalidateDataCache('stock');
  invalidateDataCache('financialTransactions');
  dispatchStorageChange('serviceOrders');
  dispatchStorageChange('stock');
  dispatchStorageChange('financialTransactions');

  return result;
};

export const criarLancamentoManual = async (
  payload: CriarLancamentoManualInput
): Promise<CriarLancamentoManualResult> => {
  const result = await apiFetch<CriarLancamentoManualResult>('/api/financial/manual-transaction', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  invalidateDataCache('financialTransactions');
  dispatchStorageChange('financialTransactions');

  return result;
};

export const getSales = async (): Promise<Sale[]> => getCollection('sales');
export const saveSales = async (sales: Sale[]): Promise<void> => saveCollection('sales', sales);

export const getFinancialTransactions = async (): Promise<FinancialTransaction[]> => getCollection('financialTransactions');
export const saveFinancialTransactions = async (transactions: FinancialTransaction[]): Promise<void> => saveCollection('financialTransactions', transactions);
export const getTenantFinancialOverview = async (): Promise<{
  transactions: FinancialTransaction[];
  sales: Sale[];
}> => {
  return apiFetch<{ transactions: FinancialTransaction[]; sales: Sale[] }>('/api/financeiro/overview');
};

export const getTenantDashboardOverview = async (): Promise<DashboardOverview> => {
  return apiFetch<DashboardOverview>('/api/dashboard/overview');
};

export const deleteTenantFinancialTransaction = async (transactionId: string): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/financeiro/${encodeURIComponent(transactionId)}`, {
    method: 'DELETE',
  });

  invalidateDataCache('financialTransactions');
  dispatchStorageChange('financialTransactions');
};

export const getAppointments = async (): Promise<Appointment[]> => getCollection('appointments');
export const saveAppointments = async (appointments: Appointment[]): Promise<void> => saveCollection('appointments', appointments);
export const listTenantAppointments = async (): Promise<Appointment[]> => {
  return apiFetch<Appointment[]>('/api/agenda');
};

export const createTenantAppointment = async (appointment: Appointment): Promise<Appointment> => {
  const createdAppointment = await apiFetch<Appointment>('/api/agenda', {
    method: 'POST',
    body: JSON.stringify(appointment),
  });

  invalidateDataCache('appointments');
  dispatchStorageChange('appointments');

  return createdAppointment;
};

export const updateTenantAppointment = async (appointment: Appointment): Promise<Appointment> => {
  const updatedAppointment = await apiFetch<Appointment>(`/api/agenda/${encodeURIComponent(appointment.id)}`, {
    method: 'PUT',
    body: JSON.stringify(appointment),
  });

  invalidateDataCache('appointments');
  dispatchStorageChange('appointments');

  return updatedAppointment;
};

export const deleteTenantAppointment = async (appointmentId: string): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/agenda/${encodeURIComponent(appointmentId)}`, {
    method: 'DELETE',
  });

  invalidateDataCache('appointments');
  dispatchStorageChange('appointments');
};

export const getQuotes = async (): Promise<Quote[]> => getCollection('quotes');
export const saveQuotes = async (quotes: Quote[]): Promise<void> => saveCollection('quotes', quotes);
export const listTenantQuotes = async (): Promise<Quote[]> => {
  return apiFetch<Quote[]>('/api/orcamentos');
};

export const saveTenantQuote = async (quote: Quote): Promise<Quote> => {
  const hasExistingId = quote.id?.trim().length > 0;
  const savedQuote = await apiFetch<Quote>(`/api/orcamentos${hasExistingId ? `/${encodeURIComponent(quote.id)}` : ''}`, {
    method: hasExistingId ? 'PUT' : 'POST',
    body: JSON.stringify(quote),
  });

  invalidateDataCache('quotes');
  dispatchStorageChange('quotes');

  return savedQuote;
};

export const createTenantQuote = async (quote: Quote): Promise<Quote> => {
  const savedQuote = await apiFetch<Quote>('/api/orcamentos', {
    method: 'POST',
    body: JSON.stringify(quote),
  });

  invalidateDataCache('quotes');
  dispatchStorageChange('quotes');

  return savedQuote;
};

export const updateTenantQuote = async (quote: Quote): Promise<Quote> => {
  const savedQuote = await apiFetch<Quote>(`/api/orcamentos/${encodeURIComponent(quote.id)}`, {
    method: 'PUT',
    body: JSON.stringify(quote),
  });

  invalidateDataCache('quotes');
  dispatchStorageChange('quotes');

  return savedQuote;
};

export const deleteTenantQuote = async (quoteId: string): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/orcamentos/${encodeURIComponent(quoteId)}`, {
    method: 'DELETE',
  });

  invalidateDataCache('quotes');
  dispatchStorageChange('quotes');
};

export const getKits = async (): Promise<Kit[]> => getCollection('kits');
export const saveKits = async (kits: Kit[]): Promise<void> => saveCollection('kits', kits);
export const listTenantKits = async (): Promise<Kit[]> => {
  return apiFetch<Kit[]>('/api/kits');
};

export const saveTenantKit = async (kit: Kit): Promise<Kit> => {
  const savedKit = await apiFetch<Kit>('/api/kits', {
    method: 'POST',
    body: JSON.stringify(kit),
  });

  invalidateDataCache('kits');
  dispatchStorageChange('kits');

  return savedKit;
};

export const getCompanyInfo = async (): Promise<CompanyInfo> => getSingleton('companyInfo', DEFAULT_COMPANY_INFO);
export const saveCompanyInfo = async (info: CompanyInfo): Promise<void> => saveSingleton('companyInfo', { ...info, id: 1 });

export const getSettings = async (): Promise<AppSettings> => getSingleton('settings', DEFAULT_SETTINGS);
export const saveSettings = async (settings: AppSettings): Promise<void> => saveSingleton('settings', { ...settings, id: 1 });

export const getTenantCompanyInfo = async (): Promise<CompanyInfo> => {
  return apiFetch<CompanyInfo>('/api/tenant/company');
};

export const listTenantCompanyAssets = async (): Promise<CompanyAssetSummary[]> => {
  return apiFetch<CompanyAssetSummary[]>('/api/tenant/assets');
};

export const uploadTenantCompanyAsset = async (
  kind: CompanyAssetKind,
  file: File
): Promise<CompanyAssetSummary[]> => {
  const formData = new FormData();
  formData.append('kind', kind);
  formData.append('file', file);

  const response = await fetch('/api/tenant/assets', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `Falha na requisicao: ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.error) {
        errorMessage = payload.error;
      }
    } catch {
      // noop
    }
    throw new Error(errorMessage);
  }

  return (await response.json()) as CompanyAssetSummary[];
};

export const deleteTenantCompanyAsset = async (path: string): Promise<CompanyAssetSummary[]> => {
  return apiFetch<CompanyAssetSummary[]>(`/api/tenant/assets?path=${encodeURIComponent(path)}`, {
    method: 'DELETE',
  });
};

export const saveTenantCompanyInfo = async (info: CompanyInfo): Promise<CompanyInfo> => {
  const savedInfo = await apiFetch<CompanyInfo>('/api/tenant/company', {
    method: 'PUT',
    body: JSON.stringify(info),
  });

  invalidateDataCache('companyInfo');
  dispatchStorageChange('companyInfo');

  return savedInfo;
};

export const getTenantSettings = async (): Promise<AppSettings> => {
  return apiFetch<AppSettings>('/api/tenant/settings');
};

export const saveTenantSettings = async (settings: AppSettings): Promise<AppSettings> => {
  const savedSettings = await apiFetch<AppSettings>('/api/tenant/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });

  invalidateDataCache('settings');
  dispatchStorageChange('settings');

  return savedSettings;
};

export const getServiceOrderViewMetadata = async (): Promise<ServiceOrderViewMetadata[]> => getCollection('serviceOrderViews');
export const getTenantServiceOrderViewMetadata = async (): Promise<ServiceOrderViewMetadata[]> => {
  return apiFetch<ServiceOrderViewMetadata[]>('/api/service-orders/views');
};

export const markServiceOrderAsViewed = async (serviceOrderId: string, viewedAt = new Date().toISOString()): Promise<void> => {
  try {
    const current = await getServiceOrderViewMetadata();
    const next = [
      { serviceOrderId, lastViewedAt: viewedAt },
      ...current.filter(item => item.serviceOrderId !== serviceOrderId),
    ];
    await saveCollection('serviceOrderViews', next);
  } catch (error) {
    console.error(`Erro ao salvar visualizacao da OS ${serviceOrderId}:`, error);
  }
};

export const markTenantServiceOrderAsViewed = async (
  serviceOrderId: string,
  viewedAt = new Date().toISOString()
): Promise<void> => {
  await apiFetch<{ success: boolean }>('/api/service-orders/views', {
    method: 'POST',
    body: JSON.stringify({ serviceOrderId, viewedAt }),
  });

  invalidateDataCache('serviceOrderViews');
  dispatchStorageChange('serviceOrderViews');
};

export const markEffectiveServiceOrderAsViewed = async (
  serviceOrderId: string,
  viewedAt = new Date().toISOString()
): Promise<void> => {
  const session = await getCurrentAppSession();
  if (session.authSource === 'supabase-only' && session.tenantAccess?.canAccessTenant) {
    await markTenantServiceOrderAsViewed(serviceOrderId, viewedAt);
    return;
  }

  await markServiceOrderAsViewed(serviceOrderId, viewedAt);
};

// --- Backup & Restore ---

export const restoreBackup = async (backupData: any): Promise<{ success: boolean; message: string }> => {
  if (!backupData.metadata || backupData.metadata.version !== 1 || !backupData.data) {
    throw new Error('Arquivo de backup invalido ou versao nao suportada.');
  }

  try {
    if (backupData.data.users) { await saveUsers(backupData.data.users); }
    if (backupData.data.customers) { await saveCustomers(backupData.data.customers); }
    if (backupData.data.serviceOrders) { await saveServiceOrders(backupData.data.serviceOrders); }
    if (backupData.data.stock) { await saveStock(backupData.data.stock); }
    if (backupData.data.sales) { await saveSales(backupData.data.sales); }
    if (backupData.data.financialTransactions) { await saveFinancialTransactions(backupData.data.financialTransactions); }
    if (backupData.data.appointments) { await saveAppointments(backupData.data.appointments); }
    if (backupData.data.quotes) { await saveQuotes(backupData.data.quotes); }
    if (backupData.data.kits) { await saveKits(backupData.data.kits); }
    if (backupData.data.companyInfo) { await saveCompanyInfo(backupData.data.companyInfo); }
    if (backupData.data.settings) { await saveSettings(backupData.data.settings); }

    dispatchStorageChange();
    return { success: true, message: 'Dados restaurados com sucesso.' };
  } catch (e: any) {
    console.error('Erro na restauracao do backup:', e);
    throw new Error(`Falha na restauracao: ${e.message}`);
  }
};
