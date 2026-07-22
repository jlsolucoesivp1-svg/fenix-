import type { UserPermissions } from './index';

export type TenantStatus = 'active' | 'inactive' | 'suspended' | 'trial';

export type MembershipStatus = 'active' | 'inactive' | 'invited' | 'revoked';

export type AuditSeverity = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export type PermissionCode =
  | 'access_dashboard'
  | 'access_clients'
  | 'access_service_orders'
  | 'access_inventory'
  | 'access_sales'
  | 'access_financials'
  | 'access_settings'
  | 'access_danger_zone'
  | 'access_agenda'
  | 'access_quotes'
  | 'access_laudos'
  | 'can_edit'
  | 'can_delete'
  | 'can_view_passwords'
  | 'can_manage_users'
  | 'manage_company';

export interface JwtAppMetadata {
  active_company_id?: string;
  login_name?: string;
}

export interface TenantContext {
  userId: string;
  activeCompanyId: string | null;
}

export type TenantAccessStatus =
  | 'no_session'
  | 'no_active_company'
  | 'membership_not_found'
  | 'membership_inactive'
  | 'company_not_found'
  | 'company_inactive'
  | 'ready';

export interface SupabaseAuthUserSummary {
  id: string;
  email: string | null;
  loginName: string | null;
}

export interface TenantMembershipSummary {
  id: string;
  companyId: string;
  roleId: string | null;
  isOwner: boolean;
  status: MembershipStatus;
  isDefault: boolean;
}

export interface TenantCompanySummary {
  id: string;
  slug: string;
  tradeName: string;
  status: TenantStatus;
}

export interface TenantAccessState {
  status: TenantAccessStatus;
  canAccessTenant: boolean;
  activeCompanyId: string | null;
  membership: TenantMembershipSummary | null;
  company: TenantCompanySummary | null;
}

export type AppSessionAuthSource = 'none' | 'legacy' | 'legacy+supabase' | 'supabase-only';

export interface AppSessionSnapshot {
  authSource: AppSessionAuthSource;
  tenantContext: TenantContext | null;
  supabaseUser: SupabaseAuthUserSummary | null;
  tenantAccess: TenantAccessState | null;
  effectivePermissions: UserPermissions | null;
}

export interface CompanyRecord {
  id: string;
  slug: string;
  trade_name: string;
  legal_name: string | null;
  document_number: string | null;
  status: TenantStatus;
}

export interface CompanyMembershipRecord {
  id: string;
  company_id: string;
  user_id: string;
  role_id: string | null;
  is_owner: boolean;
  status: MembershipStatus;
  is_default: boolean;
}

export interface CompanySettingsRecord {
  company_id: string;
  default_warranty_days: number;
  timezone: string;
  currency_code: string;
  plan_name?: string | null;
  internal_notes?: string | null;
  trial_starts_at?: string | null;
  trial_ends_at?: string | null;
  require_password_change?: boolean;
}

export interface CompanyBrandingRecord {
  company_id: string;
  address: string | null;
  phone: string | null;
  email_or_site: string | null;
  pix_key: string | null;
  logo_path: string | null;
  notification_sound_path: string | null;
}

export type StorageBucketId = 'company-assets' | 'service-order-files' | 'customer-files';

export interface CustomerRecord {
  id: string;
  company_id: string;
  full_name: string;
  phone_1: string | null;
  email: string | null;
  address_line: string | null;
  document_number: string | null;
  zip_code: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface AppointmentRecord {
  id: string;
  company_id: string;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  customer_id: string | null;
  customer_name: string | null;
  address: string | null;
  service_type: string | null;
  notes: string | null;
  status: 'agendado' | 'concluido' | 'cancelado';
}

export interface QuoteRecord {
  id: string;
  company_id: string;
  quote_date: string;
  quote_time: string;
  user_display_name: string;
  subtotal: number;
  discount_value: number;
  total_value: number;
  observations: string | null;
  customer_id: string | null;
  customer_name: string | null;
  status: 'Pendente' | 'Aprovado' | 'Cancelado' | 'Vendido';
  valid_until: string;
}

export interface QuoteItemRecord {
  id: string;
  company_id: string;
  quote_id: string;
  item_ref: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface KitRecord {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
}

export interface KitItemRecord {
  id: number;
  company_id: string;
  kit_id: string;
  product_ref: string | null;
  name: string;
  quantity: number;
}

export type InventoryMovementType =
  | 'stock_entry'
  | 'stock_adjustment'
  | 'sale'
  | 'sale_reversal'
  | 'service_order_consumption'
  | 'service_order_reversal'
  | 'manual_adjustment'
  | 'import';

export interface ProductRecord {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  category: string | null;
  stock_quantity: number;
  sale_price: number;
  cost_price: number;
  min_stock_quantity: number;
  barcode: string | null;
  unit_name: string;
  is_active: boolean;
}

export interface InventoryMovementRecord {
  id: number;
  company_id: string;
  product_id: string;
  movement_key: string;
  movement_type: InventoryMovementType;
  quantity_delta: number;
  unit_cost: number | null;
  unit_price: number | null;
  stock_balance_after: number | null;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_by_user_id: string | null;
  created_at: string;
}

export type ServiceOrderStatus =
  | 'Em analise'
  | 'Aprovado'
  | 'Em conserto'
  | 'Finalizado'
  | 'Entregue'
  | 'Aberta'
  | 'Aguardando Pagamento'
  | 'Aguardando peca'
  | 'Cancelada';

export interface ServiceOrderRecord {
  id: string;
  company_id: string;
  customer_id: string | null;
  customer_name: string;
  equipment_summary: string;
  equipment_type: string | null;
  equipment_brand: string | null;
  equipment_model: string | null;
  serial_number: string | null;
  reported_issue: string;
  status_code: ServiceOrderStatus;
  opened_at: string;
  delivered_at: string | null;
  attendant_name: string;
  payment_method: string | null;
  warranty_text: string | null;
  total_value: number;
  discount_value: number;
  final_value: number;
  accessories: string | null;
  technical_report: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceOrderItemRecord {
  id: number;
  company_id: string;
  service_order_id: string;
  legacy_item_id: string | null;
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  item_type: 'service' | 'part';
  created_at: string;
}

export interface ServiceOrderPaymentRecord {
  id: string;
  company_id: string;
  service_order_id: string;
  amount: number;
  paid_at: string;
  method: string;
  created_at: string;
}

export interface ServiceOrderNoteRecord {
  id: number;
  company_id: string;
  service_order_id: string;
  user_display_name: string;
  note_text: string;
  noted_at: string;
  created_at: string;
}

export interface ServiceOrderHistoryRecord {
  id: number;
  company_id: string;
  service_order_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  actor_user_id: string | null;
  actor_display_name: string | null;
  event_at: string;
  metadata: Record<string, unknown>;
}

export interface ServiceOrderViewRecord {
  id: number;
  company_id: string;
  service_order_id: string;
  user_id: string;
  last_viewed_at: string;
  created_at: string;
  updated_at: string;
}

export type SaleStatus = 'Finalizada' | 'Estornada';

export interface SaleRecord {
  id: string;
  company_id: string;
  sale_date: string;
  sale_time: string;
  user_display_name: string;
  subtotal: number;
  discount_value: number;
  total_value: number;
  payment_method: string;
  observations: string | null;
  customer_id: string | null;
  customer_name: string | null;
  related_quote_id: string | null;
  status: SaleStatus;
  reversal_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaleItemRecord {
  id: number;
  company_id: string;
  sale_id: string;
  legacy_item_id: string | null;
  product_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export type FinancialEntryType = 'receita' | 'despesa';

export type FinancialEntryStatus = 'pago' | 'pendente' | 'Estornado';

export interface FinancialEntryRecord {
  id: string;
  company_id: string;
  entry_type: FinancialEntryType;
  description: string;
  amount: number;
  transaction_date: string;
  due_date: string | null;
  status: FinancialEntryStatus;
  category: string;
  payment_method: string;
  related_sale_id: string | null;
  related_service_order_id: string | null;
  related_stock_entry_key: string | null;
  origin: string | null;
  created_by_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type IdempotencyKeyStatus = 'in_progress' | 'completed' | 'failed';

export interface IdempotencyKeyRecord {
  id: string;
  company_id: string;
  scope: string;
  operation_key: string;
  status: IdempotencyKeyStatus;
  request_fingerprint: string | null;
  response_code: number | null;
  response_summary: string | null;
  error_message: string | null;
  created_by_user_id: string | null;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLogInput {
  companyId?: string | null;
  actorUserId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  requestId?: string | null;
  success?: boolean;
  severity?: AuditSeverity;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}
