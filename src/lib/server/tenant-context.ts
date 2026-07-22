import type { JwtAppMetadata, TenantContext } from '@/types/saas';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string | null | undefined): value is string =>
  typeof value === 'string' && UUID_PATTERN.test(value);

export const extractActiveCompanyId = (
  appMetadata: JwtAppMetadata | null | undefined
): string | null => {
  const activeCompanyId = appMetadata?.active_company_id?.trim();
  return isUuid(activeCompanyId) ? activeCompanyId : null;
};

export const buildTenantContext = (
  userId: string,
  appMetadata: JwtAppMetadata | null | undefined
): TenantContext => ({
  userId,
  activeCompanyId: extractActiveCompanyId(appMetadata),
});
