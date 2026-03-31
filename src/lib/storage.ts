'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote, Kit, AppSettings, ServiceOrderViewMetadata } from '@/types';

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

const dispatchStorageChange = (suffix?: string) => {
  window.dispatchEvent(new Event('storage-change'));
  if (suffix) {
    window.dispatchEvent(new Event(`storage-change-${suffix}`));
  }
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
  return apiFetch<CollectionMap[K]>(`/api/data/${dataType}`);
};

const saveCollection = async <K extends keyof CollectionMap>(dataType: K, payload: CollectionMap[K]): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/data/${dataType}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  dispatchStorageChange(dataType);
};

const getSingleton = async <K extends keyof SingletonMap>(dataType: K, fallback: SingletonMap[K]): Promise<SingletonMap[K]> => {
  const payload = await apiFetch<SingletonMap[K] | null>(`/api/data/${dataType}`);
  return payload || fallback;
};

const saveSingleton = async <K extends keyof SingletonMap>(dataType: K, payload: SingletonMap[K]): Promise<void> => {
  await apiFetch<{ success: boolean }>(`/api/data/${dataType}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  dispatchStorageChange(dataType);
};

// --- Authentication ---

export const signInWithLoginAndPassword = async (login: string, password: string): Promise<User> => {
  const payload = await apiFetch<{ user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
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
  await apiFetch<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
};

export const getLoggedInUser = async (): Promise<User | null> => {
  if (typeof window === 'undefined') return null;

  try {
    const payload = await apiFetch<{ user: User | null }>('/api/auth/session');
    return payload.user;
  } catch (error) {
    console.error('Erro ao buscar sessao atual:', error);
    return null;
  }
};

export const hasRegisteredUsers = async (): Promise<boolean> => {
  try {
    const payload = await apiFetch<{ hasUsers: boolean }>('/api/auth/bootstrap-status');
    return payload.hasUsers;
  } catch (error) {
    console.error('Erro ao verificar existencia de usuarios:', error);
    throw error;
  }
};

// --- Data Access Functions ---

export const getUsers = async (): Promise<User[]> => getCollection('users');
export const saveUsers = async (users: User[]): Promise<void> => saveCollection('users', users);

export const getCustomers = async (): Promise<Customer[]> => getCollection('customers');
export const saveCustomers = async (customers: Customer[]): Promise<void> => saveCollection('customers', customers);

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
