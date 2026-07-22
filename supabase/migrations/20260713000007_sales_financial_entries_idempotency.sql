BEGIN;

CREATE TABLE public.sales (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sale_date date NOT NULL,
  sale_time time NOT NULL,
  user_display_name text NOT NULL,
  subtotal numeric(18,2) NOT NULL DEFAULT 0,
  discount_value numeric(18,2) NOT NULL DEFAULT 0,
  total_value numeric(18,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL,
  observations text,
  customer_id text,
  customer_name text,
  related_quote_id text,
  status text NOT NULL DEFAULT 'Finalizada',
  reversal_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sales_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT sales_customer_fk
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers(company_id, id)
    ON DELETE SET NULL,
  CONSTRAINT sales_quote_fk
    FOREIGN KEY (company_id, related_quote_id)
    REFERENCES public.quotes(company_id, id)
    ON DELETE SET NULL,
  CONSTRAINT sales_status_check CHECK (status IN ('Finalizada', 'Estornada')),
  CONSTRAINT sales_subtotal_check CHECK (subtotal >= 0),
  CONSTRAINT sales_discount_value_check CHECK (discount_value >= 0),
  CONSTRAINT sales_total_value_check CHECK (total_value >= 0)
);

CREATE TABLE public.sale_items (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL,
  sale_id text NOT NULL,
  legacy_item_id text,
  product_id text,
  item_name text NOT NULL,
  quantity numeric(18,3) NOT NULL DEFAULT 1,
  unit_price numeric(18,2) NOT NULL DEFAULT 0,
  line_total numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sale_items_sale_fk
    FOREIGN KEY (company_id, sale_id)
    REFERENCES public.sales(company_id, id)
    ON DELETE CASCADE,
  CONSTRAINT sale_items_product_fk
    FOREIGN KEY (company_id, product_id)
    REFERENCES public.products(company_id, id)
    ON DELETE SET NULL,
  CONSTRAINT sale_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT sale_items_unit_price_check CHECK (unit_price >= 0),
  CONSTRAINT sale_items_line_total_check CHECK (line_total >= 0)
);

CREATE TABLE public.financial_entries (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entry_type text NOT NULL,
  description text NOT NULL,
  amount numeric(18,2) NOT NULL,
  transaction_date date NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'pago',
  category text NOT NULL,
  payment_method text NOT NULL,
  related_sale_id text,
  related_service_order_id text,
  related_stock_entry_key text,
  origin text,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT financial_entries_sale_fk
    FOREIGN KEY (company_id, related_sale_id)
    REFERENCES public.sales(company_id, id)
    ON DELETE SET NULL,
  CONSTRAINT financial_entries_service_order_fk
    FOREIGN KEY (company_id, related_service_order_id)
    REFERENCES public.service_orders(company_id, id)
    ON DELETE SET NULL,
  CONSTRAINT financial_entries_type_check CHECK (entry_type IN ('receita', 'despesa')),
  CONSTRAINT financial_entries_status_check CHECK (status IN ('pago', 'pendente', 'Estornado')),
  CONSTRAINT financial_entries_amount_check CHECK (amount > 0),
  CONSTRAINT financial_entries_metadata_object_check CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE public.idempotency_keys (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  scope text NOT NULL,
  operation_key text NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  request_fingerprint text,
  response_code integer,
  response_summary text,
  error_message text,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT idempotency_keys_company_scope_operation_unique UNIQUE (company_id, scope, operation_key),
  CONSTRAINT idempotency_keys_status_check CHECK (status IN ('in_progress', 'completed', 'failed')),
  CONSTRAINT idempotency_keys_metadata_object_check CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_sales_company_date_time
ON public.sales (company_id, sale_date DESC, sale_time DESC);

CREATE INDEX idx_sales_company_status_date
ON public.sales (company_id, status, sale_date DESC, sale_time DESC);

CREATE INDEX idx_sales_company_customer
ON public.sales (company_id, customer_id);

CREATE INDEX idx_sale_items_company_sale
ON public.sale_items (company_id, sale_id);

CREATE INDEX idx_sale_items_company_product
ON public.sale_items (company_id, product_id);

CREATE INDEX idx_financial_entries_company_date
ON public.financial_entries (company_id, transaction_date DESC, created_at DESC);

CREATE INDEX idx_financial_entries_company_status_due_date
ON public.financial_entries (company_id, status, due_date DESC, created_at DESC);

CREATE INDEX idx_financial_entries_company_type_date
ON public.financial_entries (company_id, entry_type, transaction_date DESC, created_at DESC);

CREATE INDEX idx_financial_entries_company_sale
ON public.financial_entries (company_id, related_sale_id);

CREATE INDEX idx_financial_entries_company_service_order
ON public.financial_entries (company_id, related_service_order_id);

CREATE INDEX idx_financial_entries_company_stock_entry
ON public.financial_entries (company_id, related_stock_entry_key);

CREATE INDEX idx_idempotency_keys_company_scope_created_at
ON public.idempotency_keys (company_id, scope, created_at DESC);

CREATE INDEX idx_idempotency_keys_company_status_created_at
ON public.idempotency_keys (company_id, status, created_at DESC);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY sales_select_sales
ON public.sales
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_sales'));

CREATE POLICY sales_insert_sales
ON public.sales
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_sales'));

CREATE POLICY sales_update_sales
ON public.sales
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_sales'))
WITH CHECK (public.has_company_permission(company_id, 'access_sales'));

CREATE POLICY sales_delete_sales
ON public.sales
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_sales'));

CREATE POLICY sale_items_select_sales
ON public.sale_items
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_sales'));

CREATE POLICY sale_items_insert_sales
ON public.sale_items
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_sales'));

CREATE POLICY sale_items_update_sales
ON public.sale_items
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_sales'))
WITH CHECK (public.has_company_permission(company_id, 'access_sales'));

CREATE POLICY sale_items_delete_sales
ON public.sale_items
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_sales'));

CREATE POLICY financial_entries_select_financials
ON public.financial_entries
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_financials'));

CREATE POLICY financial_entries_insert_financials
ON public.financial_entries
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_financials'));

CREATE POLICY financial_entries_update_financials
ON public.financial_entries
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_financials'))
WITH CHECK (public.has_company_permission(company_id, 'access_financials'));

CREATE POLICY financial_entries_delete_financials
ON public.financial_entries
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_financials'));

CREATE POLICY idempotency_keys_select_financials
ON public.idempotency_keys
FOR SELECT
TO authenticated
USING (
  public.has_company_permission(company_id, 'access_financials')
  OR public.has_company_permission(company_id, 'access_sales')
);

CREATE POLICY idempotency_keys_insert_financials
ON public.idempotency_keys
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_company_permission(company_id, 'access_financials')
  OR public.has_company_permission(company_id, 'access_sales')
);

CREATE POLICY idempotency_keys_update_financials
ON public.idempotency_keys
FOR UPDATE
TO authenticated
USING (
  public.has_company_permission(company_id, 'access_financials')
  OR public.has_company_permission(company_id, 'access_sales')
)
WITH CHECK (
  public.has_company_permission(company_id, 'access_financials')
  OR public.has_company_permission(company_id, 'access_sales')
);

CREATE POLICY idempotency_keys_delete_financials
ON public.idempotency_keys
FOR DELETE
TO authenticated
USING (
  public.has_company_permission(company_id, 'access_financials')
  OR public.has_company_permission(company_id, 'access_sales')
);

REVOKE ALL ON public.sales FROM anon, authenticated;
REVOKE ALL ON public.sale_items FROM anon, authenticated;
REVOKE ALL ON public.financial_entries FROM anon, authenticated;
REVOKE ALL ON public.idempotency_keys FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_entries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idempotency_keys TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sale_items_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.idempotency_keys_id_seq TO authenticated;

COMMIT;
