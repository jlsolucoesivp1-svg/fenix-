import type { UserPermissions } from '@/types';

export const NO_USER_PERMISSIONS: UserPermissions = {
  accessDashboard: false,
  accessClients: false,
  accessServiceOrders: false,
  accessInventory: false,
  accessSales: false,
  accessFinancials: false,
  accessSettings: false,
  accessDangerZone: false,
  accessAgenda: false,
  accessQuotes: false,
  accessLaudos: false,
  canEdit: false,
  canDelete: false,
  canViewPasswords: false,
  canManageUsers: false,
};

export const ALL_USER_PERMISSIONS: UserPermissions = {
  accessDashboard: true,
  accessClients: true,
  accessServiceOrders: true,
  accessInventory: true,
  accessSales: true,
  accessFinancials: true,
  accessSettings: true,
  accessDangerZone: true,
  accessAgenda: true,
  accessQuotes: true,
  accessLaudos: true,
  canEdit: true,
  canDelete: true,
  canViewPasswords: true,
  canManageUsers: true,
};

export const SUPABASE_ROUTE_PERMISSIONS: Array<{
  path: string;
  label: string;
  permission: keyof UserPermissions;
}> = [
  { path: '/dashboard', label: 'Dashboard', permission: 'accessDashboard' },
  { path: '/agenda', label: 'Agenda', permission: 'accessAgenda' },
  { path: '/clientes', label: 'Clientes', permission: 'accessClients' },
  { path: '/ordens-de-servico', label: 'Ordens de Servico', permission: 'accessServiceOrders' },
  { path: '/produtos', label: 'Produtos', permission: 'accessInventory' },
  { path: '/vendas', label: 'Vendas', permission: 'accessSales' },
  { path: '/orcamentos', label: 'Orcamentos', permission: 'accessQuotes' },
  { path: '/laudos', label: 'Laudos Tecnicos', permission: 'accessLaudos' },
  { path: '/financeiro', label: 'Financeiro', permission: 'accessFinancials' },
  { path: '/usuarios', label: 'Usuarios', permission: 'canManageUsers' },
  { path: '/configuracoes', label: 'Configuracoes', permission: 'accessSettings' },
];

export const hasUserPermission = (
  permissions: Partial<UserPermissions> | null | undefined,
  permission: keyof UserPermissions
): boolean => permissions?.[permission] === true;

export const getRequiredPermissionForPath = (
  pathname: string
): keyof UserPermissions | null => {
  const match = SUPABASE_ROUTE_PERMISSIONS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  return match?.permission ?? null;
};

export const getModuleLabelForPath = (pathname: string): string | null => {
  const match = SUPABASE_ROUTE_PERMISSIONS.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`)
  );
  return match?.label ?? null;
};

export const getFirstAllowedPath = (
  permissions: Partial<UserPermissions> | null | undefined
): string | null => {
  const firstAllowed = SUPABASE_ROUTE_PERMISSIONS.find((item) =>
    hasUserPermission(permissions, item.permission)
  );
  return firstAllowed?.path ?? null;
};
