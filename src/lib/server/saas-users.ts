import type { DashboardOverview, User, UserPermissions } from '@/types';
import { ALL_USER_PERMISSIONS, NO_USER_PERMISSIONS } from '@/lib/permissions';
import type { MembershipStatus, PermissionCode } from '@/types/saas';
import { getSupabaseAdminConfig } from './supabase-admin';
import { listSaasAppointments } from './saas-appointments';
import { listSaasCustomers } from './saas-customers';
import { listSaasServiceOrders } from './saas-service-orders';

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  login_name: string | null;
};

type MembershipRow = {
  id: string;
  company_id: string;
  user_id: string;
  role_id: string | null;
  is_owner: boolean;
  status: MembershipStatus;
  is_default: boolean;
};

type RoleRow = {
  id: string;
  company_id: string | null;
  name: string;
  description: string | null;
  is_system: boolean;
  is_company_admin: boolean;
};

type PermissionRow = {
  id: string;
  code: PermissionCode;
};

type RolePermissionRow = {
  role_id: string;
  permission_id: string;
};

type AuthAdminUserResponse = {
  user?: {
    id: string;
    email?: string | null;
    app_metadata?: Record<string, unknown> | null;
  } | null;
};

type UserInput = Partial<User> & {
  email?: string;
  password?: string;
};

const LEGACY_TO_SAAS_PERMISSIONS: Array<[keyof UserPermissions, PermissionCode]> = [
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

const normalizeText = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildAdminHeaders = (contentType = 'application/json') => {
  const { serviceRoleKey } = getSupabaseAdminConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': contentType,
  };
};

const buildRestUrl = (table: string, params?: Record<string, string>) => {
  const { url } = getSupabaseAdminConfig();
  const search = new URLSearchParams(params);
  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return `${url}/rest/v1/${table}${suffix}`;
};

const parseErrorMessage = async (response: Response) => {
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    return payload.message || payload.error || `Falha na operacao (${response.status}).`;
  } catch {
    return `Falha na operacao (${response.status}).`;
  }
};

const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
};

const listRows = async <T>(table: string, params: Record<string, string>): Promise<T[]> => {
  const response = await fetch(buildRestUrl(table, params), {
    method: 'GET',
    headers: buildAdminHeaders(),
    cache: 'no-store',
  });

  return parseJsonResponse<T[]>(response);
};

const upsertRows = async <T>(
  table: string,
  payload: Record<string, unknown> | Array<Record<string, unknown>>,
  params: Record<string, string>
): Promise<T[]> => {
  const response = await fetch(buildRestUrl(table, params), {
    method: 'POST',
    headers: {
      ...buildAdminHeaders(),
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  return parseJsonResponse<T[]>(response);
};

const patchRows = async <T>(
  table: string,
  payload: Record<string, unknown>,
  params: Record<string, string>
): Promise<T[]> => {
  const response = await fetch(buildRestUrl(table, params), {
    method: 'PATCH',
    headers: {
      ...buildAdminHeaders(),
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  return parseJsonResponse<T[]>(response);
};

const deleteRows = async (table: string, params: Record<string, string>) => {
  const response = await fetch(buildRestUrl(table, params), {
    method: 'DELETE',
    headers: buildAdminHeaders(),
    cache: 'no-store',
  });

  await parseJsonResponse(response);
};

const buildRoleName = (userId: string) => `Usuario ${userId.slice(0, 8).toUpperCase()}`;

const mapPermissionCodesToLegacy = (codes: PermissionCode[], isOwner: boolean): UserPermissions => {
  if (isOwner) {
    return { ...ALL_USER_PERMISSIONS };
  }

  const granted = new Set(codes);
  const permissions = { ...NO_USER_PERMISSIONS };

  for (const [legacyKey, saasCode] of LEGACY_TO_SAAS_PERMISSIONS) {
    permissions[legacyKey] = granted.has(saasCode);
  }

  return permissions;
};

export const getSaasUserPermissions = async (
  companyId: string,
  userId: string
): Promise<UserPermissions> => {
  const membership = await findMembership(companyId, userId);
  if (!membership || membership.status !== 'active') {
    return { ...NO_USER_PERMISSIONS };
  }

  if (membership.is_owner) {
    return { ...ALL_USER_PERMISSIONS };
  }

  if (!membership.role_id) {
    return { ...NO_USER_PERMISSIONS };
  }

  const [rolePermissions, permissionCatalog] = await Promise.all([
    fetchRolePermissions([membership.role_id]),
    fetchPermissionCatalog(),
  ]);
  const codeByPermissionId = new Map(
    Array.from(permissionCatalog.entries()).map(([code, id]) => [id, code])
  );
  const codes = rolePermissions
    .map((rolePermission) => codeByPermissionId.get(rolePermission.permission_id))
    .filter((code): code is PermissionCode => Boolean(code));

  return mapPermissionCodesToLegacy(codes, false);
};

const mapLegacyPermissionsToCodes = (permissions: Partial<UserPermissions> | undefined): PermissionCode[] => {
  if (!permissions) {
    return [];
  }

  return LEGACY_TO_SAAS_PERMISSIONS.flatMap(([legacyKey, saasCode]) =>
    permissions[legacyKey] ? [saasCode] : []
  );
};

const fetchPermissionCatalog = async () => {
  const permissions = await listRows<PermissionRow>('permissions', {
    select: 'id,code',
    order: 'code.asc',
  });

  return new Map(permissions.map((permission) => [permission.code, permission.id]));
};

const fetchMemberships = async (companyId: string) =>
  listRows<MembershipRow>('company_memberships', {
    select: 'id,company_id,user_id,role_id,is_owner,status,is_default',
    company_id: `eq.${companyId}`,
    order: 'created_at.asc',
  });

const fetchRoles = async (companyId: string) =>
  listRows<RoleRow>('roles', {
    select: 'id,company_id,name,description,is_system,is_company_admin',
    company_id: `eq.${companyId}`,
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

const fetchRolePermissions = async (roleIds: string[]) => {
  if (roleIds.length === 0) {
    return [] as RolePermissionRow[];
  }

  return listRows<RolePermissionRow>('role_permissions', {
    select: 'role_id,permission_id',
    role_id: `in.(${roleIds.join(',')})`,
  });
};

const findMembership = async (companyId: string, userId: string) => {
  const rows = await listRows<MembershipRow>('company_memberships', {
    select: 'id,company_id,user_id,role_id,is_owner,status,is_default',
    company_id: `eq.${companyId}`,
    user_id: `eq.${userId}`,
    limit: '1',
  });

  return rows[0] ?? null;
};

const actorHasPermission = async (params: {
  actorUserId: string;
  companyId: string;
  permission: PermissionCode | 'manage_company';
}) => {
  const membership = await findMembership(params.companyId, params.actorUserId);
  if (!membership || membership.status !== 'active') {
    return false;
  }

  if (membership.is_owner) {
    return true;
  }

  if (!membership.role_id) {
    return false;
  }

  const [rolePermissions, permissions] = await Promise.all([
    fetchRolePermissions([membership.role_id]),
    fetchPermissionCatalog(),
  ]);

  const rolePermissionIds = new Set(rolePermissions.map((item) => item.permission_id));
  const requiredPermissionId = permissions.get(params.permission as PermissionCode);

  return requiredPermissionId ? rolePermissionIds.has(requiredPermissionId) : false;
};

export const assertActorCanManageUsers = async (actorUserId: string, companyId: string) => {
  const allowed = await actorHasPermission({
    actorUserId,
    companyId,
    permission: 'can_manage_users',
  });

  if (!allowed) {
    throw new Error('Voce nao tem permissao para gerenciar usuarios deste tenant.');
  }
};

export const assertActorCanAccessDashboard = async (actorUserId: string, companyId: string) => {
  const allowed = await actorHasPermission({
    actorUserId,
    companyId,
    permission: 'access_dashboard',
  });

  if (!allowed) {
    throw new Error('Voce nao tem permissao para acessar o dashboard deste tenant.');
  }
};

const ensureManagedRole = async (companyId: string, userId: string, displayName: string) => {
  const rows = await upsertRows<RoleRow>(
    'roles',
    {
      company_id: companyId,
      name: buildRoleName(userId),
      description: `Role gerenciada para ${displayName}.`,
      is_system: false,
      is_company_admin: false,
    },
    {
      on_conflict: 'company_id,name',
      select: 'id,company_id,name,description,is_system,is_company_admin',
    }
  );

  const role = rows[0];
  if (!role) {
    throw new Error('Nao foi possivel preparar a role do usuario.');
  }

  return role;
};

const replaceRolePermissions = async (roleId: string, permissionCodes: PermissionCode[]) => {
  await deleteRows('role_permissions', { role_id: `eq.${roleId}` });

  if (permissionCodes.length === 0) {
    return;
  }

  const permissionCatalog = await fetchPermissionCatalog();
  const rows = permissionCodes
    .map((code) => {
      const permissionId = permissionCatalog.get(code);
      return permissionId
        ? {
            role_id: roleId,
            permission_id: permissionId,
          }
        : null;
    })
    .filter((value): value is { role_id: string; permission_id: string } => Boolean(value));

  if (rows.length === 0) {
    return;
  }

  await upsertRows<RolePermissionRow>('role_permissions', rows, {
    on_conflict: 'role_id,permission_id',
    select: 'role_id,permission_id',
  });
};

const upsertProfile = async (params: {
  userId: string;
  name: string;
  email: string | null;
  login: string | null;
}) => {
  await upsertRows<ProfileRow>(
    'profiles',
    {
      id: params.userId,
      full_name: params.name,
      email: params.email,
      login_name: params.login,
    },
    {
      on_conflict: 'id',
      select: 'id,full_name,email,login_name',
    }
  );
};

const upsertMembership = async (params: {
  companyId: string;
  userId: string;
  roleId: string;
  status: MembershipStatus;
}) => {
  const rows = await upsertRows<MembershipRow>(
    'company_memberships',
    {
      company_id: params.companyId,
      user_id: params.userId,
      role_id: params.roleId,
      is_owner: false,
      status: params.status,
      is_default: false,
    },
    {
      on_conflict: 'company_id,user_id',
      select: 'id,company_id,user_id,role_id,is_owner,status,is_default',
    }
  );

  return rows[0] ?? null;
};

const createAuthUser = async (params: {
  email: string;
  password: string;
  name: string;
  login: string | null;
  activeCompanyId: string;
}) => {
  const { url } = getSupabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: buildAdminHeaders(),
    body: JSON.stringify({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.name,
      },
      app_metadata: {
        active_company_id: params.activeCompanyId,
        login_name: params.login,
      },
    }),
    cache: 'no-store',
  });

  const payload = await parseJsonResponse<AuthAdminUserResponse>(response);
  if (!payload.user?.id) {
    throw new Error('Usuario criado sem identificador no Supabase Auth.');
  }

  return payload.user;
};

const updateAuthUser = async (params: {
  userId: string;
  email: string | null;
  password?: string | null;
  login: string | null;
  activeCompanyId: string;
}) => {
  const { url } = getSupabaseAdminConfig();
  const response = await fetch(`${url}/auth/v1/admin/users/${params.userId}`, {
    method: 'PUT',
    headers: buildAdminHeaders(),
    body: JSON.stringify({
      email: params.email,
      ...(params.password ? { password: params.password } : {}),
      app_metadata: {
        active_company_id: params.activeCompanyId,
        login_name: params.login,
      },
    }),
    cache: 'no-store',
  });

  await parseJsonResponse<AuthAdminUserResponse>(response);
};

const toManagedUser = (params: {
  membership: MembershipRow;
  profile: ProfileRow | null;
  permissionCodes: PermissionCode[];
}) => {
  const profile = params.profile;
  const login = profile?.login_name || profile?.email || params.membership.user_id;
  const name = profile?.full_name || profile?.email || login;

  return {
    id: params.membership.user_id,
    name,
    login,
    email: profile?.email || undefined,
    status: params.membership.status,
    isOwner: params.membership.is_owner,
    permissions: mapPermissionCodesToLegacy(params.permissionCodes, params.membership.is_owner),
  } satisfies User;
};

export const listSaasUsers = async (companyId: string): Promise<User[]> => {
  const [memberships, roles, permissionCatalog] = await Promise.all([
    fetchMemberships(companyId),
    fetchRoles(companyId),
    fetchPermissionCatalog(),
  ]);

  const activeMemberships = memberships.filter((membership) => membership.status !== 'revoked');
  const userIds = activeMemberships.map((membership) => membership.user_id);
  const roleIds = activeMemberships
    .map((membership) => membership.role_id)
    .filter((roleId): roleId is string => Boolean(roleId));

  const [profiles, rolePermissions] = await Promise.all([
    fetchProfiles(userIds),
    fetchRolePermissions(roleIds),
  ]);

  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const codeByPermissionId = new Map(
    Array.from(permissionCatalog.entries()).map(([code, id]) => [id, code])
  );
  const permissionCodesByRoleId = new Map<string, PermissionCode[]>();

  for (const rolePermission of rolePermissions) {
    const code = codeByPermissionId.get(rolePermission.permission_id);
    if (!code) continue;
    const current = permissionCodesByRoleId.get(rolePermission.role_id) ?? [];
    current.push(code);
    permissionCodesByRoleId.set(rolePermission.role_id, current);
  }

  return activeMemberships.map((membership) =>
    toManagedUser({
      membership,
      profile: profileById.get(membership.user_id) ?? null,
      permissionCodes: membership.role_id ? permissionCodesByRoleId.get(membership.role_id) ?? [] : [],
    })
  );
};

const validateUserInput = (input: UserInput, requirePassword: boolean) => {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const login = normalizeText(input.login);
  const password = input.password?.trim();

  if (!name) {
    throw new Error('Nome do usuario e obrigatorio.');
  }

  if (!email) {
    throw new Error('E-mail do usuario e obrigatorio.');
  }

  if (requirePassword && !password) {
    throw new Error('Senha do usuario e obrigatoria.');
  }

  return {
    name,
    email,
    login,
    password: password || null,
    status: (input.status ?? 'active') as MembershipStatus,
    permissions: input.permissions ?? { ...NO_USER_PERMISSIONS },
  };
};

export const createSaasUser = async (params: {
  companyId: string;
  input: UserInput;
}) => {
  const normalized = validateUserInput(params.input, true);
  const authUser = await createAuthUser({
    email: normalized.email,
    password: normalized.password!,
    name: normalized.name,
    login: normalized.login,
    activeCompanyId: params.companyId,
  });

  await upsertProfile({
    userId: authUser.id,
    name: normalized.name,
    email: normalized.email,
    login: normalized.login,
  });

  const role = await ensureManagedRole(params.companyId, authUser.id, normalized.name);
  await replaceRolePermissions(role.id, mapLegacyPermissionsToCodes(normalized.permissions));
  await upsertMembership({
    companyId: params.companyId,
    userId: authUser.id,
    roleId: role.id,
    status: normalized.status,
  });

  const users = await listSaasUsers(params.companyId);
  const createdUser = users.find((user) => user.id === authUser.id);
  if (!createdUser) {
    throw new Error('Usuario criado, mas nao retornado pela listagem do tenant.');
  }

  return createdUser;
};

export const updateSaasUser = async (params: {
  companyId: string;
  userId: string;
  input: UserInput;
}) => {
  const membership = await findMembership(params.companyId, params.userId);
  if (!membership) {
    throw new Error('Usuario nao encontrado neste tenant.');
  }

  const normalized = validateUserInput(params.input, false);
  await updateAuthUser({
    userId: params.userId,
    email: normalized.email,
    password: normalized.password,
    login: normalized.login,
    activeCompanyId: params.companyId,
  });

  await upsertProfile({
    userId: params.userId,
    name: normalized.name,
    email: normalized.email,
    login: normalized.login,
  });

  const role = await ensureManagedRole(params.companyId, params.userId, normalized.name);
  await replaceRolePermissions(role.id, mapLegacyPermissionsToCodes(normalized.permissions));
  await upsertMembership({
    companyId: params.companyId,
    userId: params.userId,
    roleId: role.id,
    status: normalized.status,
  });

  const users = await listSaasUsers(params.companyId);
  const updatedUser = users.find((user) => user.id === params.userId);
  if (!updatedUser) {
    throw new Error('Usuario atualizado, mas nao retornado pela listagem do tenant.');
  }

  return updatedUser;
};

export const revokeSaasUserMembership = async (params: {
  companyId: string;
  userId: string;
  actorUserId: string;
}) => {
  const membership = await findMembership(params.companyId, params.userId);
  if (!membership) {
    throw new Error('Usuario nao encontrado neste tenant.');
  }

  if (membership.is_owner) {
    throw new Error('Nao e permitido remover o proprietario principal da empresa.');
  }

  if (params.userId === params.actorUserId) {
    throw new Error('Nao e permitido remover a propria membership.');
  }

  await patchRows<MembershipRow>(
    'company_memberships',
    {
      status: 'revoked',
      is_default: false,
    },
    {
      select: 'id',
      company_id: `eq.${params.companyId}`,
      user_id: `eq.${params.userId}`,
    }
  );
};

export const buildSaasDashboardOverview = async (accessToken: string): Promise<DashboardOverview> => {
  const [customers, serviceOrders, appointments] = await Promise.all([
    listSaasCustomers(accessToken),
    listSaasServiceOrders(accessToken),
    listSaasAppointments(accessToken),
  ]);

  const todaysAppointments = appointments
    .filter((appointment) => {
      const appointmentDate = new Date(appointment.start);
      const today = new Date();
      return (
        appointment.extendedProps.status === 'agendado' &&
        appointmentDate.getFullYear() === today.getFullYear() &&
        appointmentDate.getMonth() === today.getMonth() &&
        appointmentDate.getDate() === today.getDate()
      );
    })
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());

  return {
    totalCustomers: customers.length,
    activeOrders: serviceOrders.filter(
      (order) => !['Finalizado', 'Entregue', 'Cancelada'].includes(order.status)
    ).length,
    completedOrders: serviceOrders.filter((order) => ['Finalizado', 'Entregue'].includes(order.status))
      .length,
    todaysAppointments,
  };
};
