'use client';

import type {
  Appointment,
  AppSettings,
  CompanyInfo,
  Customer,
  CustomerSearchResult,
  FinancialTransaction,
  Kit,
  OSPayment,
  Quote,
  Sale,
  SaleItem,
  ServiceOrder,
  ServiceOrderViewMetadata,
  StockItem,
  User,
} from '@/types';

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

export const invalidateLoggedInUserCache = () => {
  clearCurrentUserCache();
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
  dispatchAuthChange();
  return payload.user;
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
  clearCurrentUserCache();
  try {
    await apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  } finally {
    clearBrowserSessionMarker();
    clearCurrentUserCache();
    dispatchAuthChange();
  }
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
    currentUserRequest = apiFetch<{ user: User | null }>('/api/auth/session')
      .then((payload) => {
        currentUserCache = payload.user;
        currentUserCacheExpiresAt = Date.now() + SESSION_CACHE_TTL_MS;
        return payload.user;
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

export const getCustomers = async (): Promise<Customer[]> => getCollection('customers');
export const saveCustomers = async (customers: Customer[]): Promise<void> => saveCollection('customers', customers);
export const searchCustomers = async (name: string, limit = 10): Promise<CustomerSearchResult[]> => {
  const params = new URLSearchParams({
    nome: name,
    limit: String(limit),
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

export const getStock = async (): Promise<StockItem[]> => getCollection('stock');
export const saveStock = async (stock: StockItem[]): Promise<void> => saveCollection('stock', stock);

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

  dispatchStorageChange('stock');
  if (result.transaction) {
    dispatchStorageChange('financialTransactions');
  }

  return result;
};

export const finalizarVenda = async (payload: FinalizarVendaInput): Promise<FinalizarVendaResult> => {
  const result = await apiFetch<FinalizarVendaResult>('/api/sales/finalize', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

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

  dispatchStorageChange('financialTransactions');
  if (result.order) {
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

  dispatchStorageChange('financialTransactions');

  return result;
};

export const getSales = async (): Promise<Sale[]> => getCollection('sales');
export const saveSales = async (sales: Sale[]): Promise<void> => saveCollection('sales', sales);

export const getFinancialTransactions = async (): Promise<FinancialTransaction[]> => getCollection('financialTransactions');
export const saveFinancialTransactions = async (transactions: FinancialTransaction[]): Promise<void> => saveCollection('financialTransactions', transactions);

export const getAppointments = async (): Promise<Appointment[]> => getCollection('appointments');
export const saveAppointments = async (appointments: Appointment[]): Promise<void> => saveCollection('appointments', appointments);

export const getQuotes = async (): Promise<Quote[]> => getCollection('quotes');
export const saveQuotes = async (quotes: Quote[]): Promise<void> => saveCollection('quotes', quotes);

export const getKits = async (): Promise<Kit[]> => getCollection('kits');
export const saveKits = async (kits: Kit[]): Promise<void> => saveCollection('kits', kits);

export const getCompanyInfo = async (): Promise<CompanyInfo> => getSingleton('companyInfo', DEFAULT_COMPANY_INFO);
export const saveCompanyInfo = async (info: CompanyInfo): Promise<void> => saveSingleton('companyInfo', { ...info, id: 1 });

export const getSettings = async (): Promise<AppSettings> => getSingleton('settings', DEFAULT_SETTINGS);
export const saveSettings = async (settings: AppSettings): Promise<void> => saveSingleton('settings', { ...settings, id: 1 });

export const getServiceOrderViewMetadata = async (): Promise<ServiceOrderViewMetadata[]> => getCollection('serviceOrderViews');

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
