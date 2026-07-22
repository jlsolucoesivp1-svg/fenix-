BEGIN;

CREATE TABLE public.service_orders (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id text,
  customer_name text NOT NULL,
  equipment_summary text NOT NULL,
  equipment_type text,
  equipment_brand text,
  equipment_model text,
  serial_number text,
  reported_issue text NOT NULL,
  status_code text NOT NULL DEFAULT 'Aberta',
  opened_at date NOT NULL,
  delivered_at date,
  attendant_name text NOT NULL,
  payment_method text,
  warranty_text text,
  total_value numeric(18,2) NOT NULL DEFAULT 0,
  discount_value numeric(18,2) NOT NULL DEFAULT 0,
  final_value numeric(18,2) NOT NULL DEFAULT 0,
  accessories text,
  technical_report text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_orders_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT service_orders_customer_fk
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers(company_id, id)
    ON DELETE SET NULL,
  CONSTRAINT service_orders_status_check CHECK (
    status_code IN (
      'Em analise',
      'Aprovado',
      'Em conserto',
      'Finalizado',
      'Entregue',
      'Aberta',
      'Aguardando Pagamento',
      'Aguardando peca',
      'Cancelada'
    )
  ),
  CONSTRAINT service_orders_total_value_check CHECK (total_value >= 0),
  CONSTRAINT service_orders_discount_value_check CHECK (discount_value >= 0),
  CONSTRAINT service_orders_final_value_check CHECK (final_value >= 0)
);

CREATE TABLE public.service_order_items (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL,
  service_order_id text NOT NULL,
  legacy_item_id text,
  product_id text,
  description text NOT NULL,
  quantity numeric(18,3) NOT NULL DEFAULT 1,
  unit_price numeric(18,2) NOT NULL DEFAULT 0,
  item_type text NOT NULL DEFAULT 'service',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_order_items_service_order_fk
    FOREIGN KEY (company_id, service_order_id)
    REFERENCES public.service_orders(company_id, id)
    ON DELETE CASCADE,
  CONSTRAINT service_order_items_product_fk
    FOREIGN KEY (company_id, product_id)
    REFERENCES public.products(company_id, id)
    ON DELETE SET NULL,
  CONSTRAINT service_order_items_type_check CHECK (item_type IN ('service', 'part')),
  CONSTRAINT service_order_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT service_order_items_unit_price_check CHECK (unit_price >= 0)
);

CREATE TABLE public.service_order_payments (
  id text PRIMARY KEY,
  company_id uuid NOT NULL,
  service_order_id text NOT NULL,
  amount numeric(18,2) NOT NULL,
  paid_at date NOT NULL,
  method text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_order_payments_service_order_fk
    FOREIGN KEY (company_id, service_order_id)
    REFERENCES public.service_orders(company_id, id)
    ON DELETE CASCADE,
  CONSTRAINT service_order_payments_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT service_order_payments_amount_check CHECK (amount > 0)
);

CREATE TABLE public.service_order_notes (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL,
  service_order_id text NOT NULL,
  user_display_name text NOT NULL,
  note_text text NOT NULL,
  noted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_order_notes_service_order_fk
    FOREIGN KEY (company_id, service_order_id)
    REFERENCES public.service_orders(company_id, id)
    ON DELETE CASCADE,
  CONSTRAINT service_order_notes_note_not_blank CHECK (char_length(btrim(note_text)) > 0)
);

CREATE TABLE public.service_order_history (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL,
  service_order_id text NOT NULL,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_display_name text,
  event_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT service_order_history_service_order_fk
    FOREIGN KEY (company_id, service_order_id)
    REFERENCES public.service_orders(company_id, id)
    ON DELETE CASCADE,
  CONSTRAINT service_order_history_metadata_object_check CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE public.service_order_views (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL,
  service_order_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_order_views_service_order_fk
    FOREIGN KEY (company_id, service_order_id)
    REFERENCES public.service_orders(company_id, id)
    ON DELETE CASCADE,
  CONSTRAINT service_order_views_company_user_order_unique UNIQUE (company_id, user_id, service_order_id)
);

CREATE INDEX idx_service_orders_company_opened_at
ON public.service_orders (company_id, opened_at DESC);

CREATE INDEX idx_service_orders_company_status_opened_at
ON public.service_orders (company_id, status_code, opened_at DESC);

CREATE INDEX idx_service_orders_company_customer
ON public.service_orders (company_id, customer_id);

CREATE INDEX idx_service_orders_company_customer_name
ON public.service_orders (company_id, customer_name);

CREATE INDEX idx_service_order_items_company_order
ON public.service_order_items (company_id, service_order_id);

CREATE INDEX idx_service_order_items_company_product
ON public.service_order_items (company_id, product_id);

CREATE INDEX idx_service_order_payments_company_order
ON public.service_order_payments (company_id, service_order_id, paid_at DESC);

CREATE INDEX idx_service_order_notes_company_order
ON public.service_order_notes (company_id, service_order_id, noted_at DESC);

CREATE INDEX idx_service_order_history_company_order
ON public.service_order_history (company_id, service_order_id, event_at DESC, id DESC);

CREATE INDEX idx_service_order_history_company_event
ON public.service_order_history (company_id, event_type, event_at DESC, id DESC);

CREATE INDEX idx_service_order_views_company_user
ON public.service_order_views (company_id, user_id, last_viewed_at DESC);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_orders_select_service_orders
ON public.service_orders
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_orders_insert_service_orders
ON public.service_orders
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_orders_update_service_orders
ON public.service_orders
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'))
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_orders_delete_service_orders
ON public.service_orders
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_items_select_service_orders
ON public.service_order_items
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_items_insert_service_orders
ON public.service_order_items
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_items_update_service_orders
ON public.service_order_items
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'))
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_items_delete_service_orders
ON public.service_order_items
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_payments_select_service_orders
ON public.service_order_payments
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_payments_insert_service_orders
ON public.service_order_payments
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_payments_update_service_orders
ON public.service_order_payments
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'))
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_payments_delete_service_orders
ON public.service_order_payments
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_notes_select_service_orders
ON public.service_order_notes
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_notes_insert_service_orders
ON public.service_order_notes
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_notes_update_service_orders
ON public.service_order_notes
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'))
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_notes_delete_service_orders
ON public.service_order_notes
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_history_select_service_orders
ON public.service_order_history
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_history_insert_service_orders
ON public.service_order_history
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_service_orders'));

CREATE POLICY service_order_views_select_service_orders
ON public.service_order_views
FOR SELECT
TO authenticated
USING (
  public.has_company_permission(company_id, 'access_service_orders')
  AND user_id = public.auth_user_id()
);

CREATE POLICY service_order_views_insert_service_orders
ON public.service_order_views
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_company_permission(company_id, 'access_service_orders')
  AND user_id = public.auth_user_id()
);

CREATE POLICY service_order_views_update_service_orders
ON public.service_order_views
FOR UPDATE
TO authenticated
USING (
  public.has_company_permission(company_id, 'access_service_orders')
  AND user_id = public.auth_user_id()
)
WITH CHECK (
  public.has_company_permission(company_id, 'access_service_orders')
  AND user_id = public.auth_user_id()
);

CREATE POLICY service_order_views_delete_service_orders
ON public.service_order_views
FOR DELETE
TO authenticated
USING (
  public.has_company_permission(company_id, 'access_service_orders')
  AND user_id = public.auth_user_id()
);

REVOKE ALL ON public.service_orders FROM anon, authenticated;
REVOKE ALL ON public.service_order_items FROM anon, authenticated;
REVOKE ALL ON public.service_order_payments FROM anon, authenticated;
REVOKE ALL ON public.service_order_notes FROM anon, authenticated;
REVOKE ALL ON public.service_order_history FROM anon, authenticated;
REVOKE ALL ON public.service_order_views FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_order_payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_order_notes TO authenticated;
GRANT SELECT, INSERT ON public.service_order_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_order_views TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.service_order_items_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.service_order_notes_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.service_order_history_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.service_order_views_id_seq TO authenticated;

COMMIT;
