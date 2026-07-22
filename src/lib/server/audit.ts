import type { AuditLogInput, AuditSeverity } from '@/types/saas';
import { assertServiceRoleUsageAllowed, getSupabaseAdminConfig } from './supabase-admin';

const allowedSeverities: AuditSeverity[] = ['debug', 'info', 'warn', 'error', 'critical'];

export const normalizeAuditSeverity = (severity?: string | null): AuditSeverity =>
  allowedSeverities.includes((severity as AuditSeverity) ?? 'info')
    ? (severity as AuditSeverity)
    : 'info';

export const buildAuditLogPayload = (input: AuditLogInput) => ({
  company_id: input.companyId ?? null,
  actor_user_id: input.actorUserId ?? null,
  action: input.action,
  entity: input.entity,
  entity_id: input.entityId ?? null,
  request_id: input.requestId ?? null,
  success: input.success ?? true,
  severity: normalizeAuditSeverity(input.severity),
  ip_address: input.ipAddress ?? null,
  user_agent: input.userAgent ?? null,
  metadata: input.metadata ?? {},
});

const buildAuditRestUrl = () => {
  const { url } = getSupabaseAdminConfig();
  return `${url}/rest/v1/audit_logs`;
};

const buildAuditHeaders = () => {
  const { serviceRoleKey } = getSupabaseAdminConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  };
};

export const insertAuditLogs = async (entries: AuditLogInput[]) => {
  if (entries.length === 0) {
    return;
  }

  assertServiceRoleUsageAllowed('insert_audit_logs');

  const response = await fetch(buildAuditRestUrl(), {
    method: 'POST',
    headers: buildAuditHeaders(),
    body: JSON.stringify(entries.map(buildAuditLogPayload)),
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Falha ao registrar audit_logs.');
  }
};
