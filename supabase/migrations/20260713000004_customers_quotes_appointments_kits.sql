BEGIN;

CREATE TABLE public.customers (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone_1 text,
  email text,
  address_line text,
  document_number text,
  zip_code text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT customers_company_id_id_unique UNIQUE (company_id, id)
);

CREATE TABLE public.appointments (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  customer_id text,
  customer_name text,
  address text,
  service_type text,
  notes text,
  status text NOT NULL DEFAULT 'agendado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT appointments_status_check CHECK (status IN ('agendado', 'concluido', 'cancelado')),
  CONSTRAINT appointments_customer_fk
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers(company_id, id)
    ON DELETE SET NULL
);

CREATE TABLE public.quotes (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quote_date date NOT NULL,
  quote_time time NOT NULL,
  user_display_name text NOT NULL,
  subtotal numeric(18,2) NOT NULL DEFAULT 0,
  discount_value numeric(18,2) NOT NULL DEFAULT 0,
  total_value numeric(18,2) NOT NULL DEFAULT 0,
  observations text,
  customer_id text,
  customer_name text,
  status text NOT NULL DEFAULT 'Pendente',
  valid_until date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quotes_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT quotes_status_check CHECK (status IN ('Pendente', 'Aprovado', 'Cancelado', 'Vendido')),
  CONSTRAINT quotes_customer_fk
    FOREIGN KEY (company_id, customer_id)
    REFERENCES public.customers(company_id, id)
    ON DELETE SET NULL
);

CREATE TABLE public.quote_items (
  id text PRIMARY KEY,
  company_id uuid NOT NULL,
  quote_id text NOT NULL,
  item_ref text,
  description text NOT NULL,
  quantity numeric(18,3) NOT NULL DEFAULT 1,
  unit_price numeric(18,2) NOT NULL DEFAULT 0,
  total_price numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quote_items_company_id_quote_id_fk
    FOREIGN KEY (company_id, quote_id)
    REFERENCES public.quotes(company_id, id)
    ON DELETE CASCADE
);

CREATE TABLE public.kits (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kits_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT kits_company_name_unique UNIQUE (company_id, name)
);

CREATE TABLE public.kit_items (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL,
  kit_id text NOT NULL,
  product_ref text,
  name text NOT NULL,
  quantity numeric(18,3) NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kit_items_company_id_kit_id_fk
    FOREIGN KEY (company_id, kit_id)
    REFERENCES public.kits(company_id, id)
    ON DELETE CASCADE
);

CREATE INDEX idx_customers_company_name
ON public.customers (company_id, full_name);

CREATE INDEX idx_customers_company_document
ON public.customers (company_id, document_number);

CREATE INDEX idx_appointments_company_start
ON public.appointments (company_id, start_at);

CREATE INDEX idx_appointments_company_status
ON public.appointments (company_id, status);

CREATE INDEX idx_quotes_company_date
ON public.quotes (company_id, quote_date DESC, quote_time DESC);

CREATE INDEX idx_quotes_company_status
ON public.quotes (company_id, status);

CREATE INDEX idx_quote_items_company_quote
ON public.quote_items (company_id, quote_id);

CREATE INDEX idx_kits_company_name
ON public.kits (company_id, name);

CREATE INDEX idx_kit_items_company_kit
ON public.kit_items (company_id, kit_id);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_select_clients
ON public.customers
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_clients'));

CREATE POLICY customers_insert_clients
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_clients'));

CREATE POLICY customers_update_clients
ON public.customers
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_clients'))
WITH CHECK (public.has_company_permission(company_id, 'access_clients'));

CREATE POLICY customers_delete_clients
ON public.customers
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_clients'));

CREATE POLICY appointments_select_agenda
ON public.appointments
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_agenda'));

CREATE POLICY appointments_insert_agenda
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_agenda'));

CREATE POLICY appointments_update_agenda
ON public.appointments
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_agenda'))
WITH CHECK (public.has_company_permission(company_id, 'access_agenda'));

CREATE POLICY appointments_delete_agenda
ON public.appointments
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_agenda'));

CREATE POLICY quotes_select_quotes
ON public.quotes
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_quotes'));

CREATE POLICY quotes_insert_quotes
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_quotes'));

CREATE POLICY quotes_update_quotes
ON public.quotes
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_quotes'))
WITH CHECK (public.has_company_permission(company_id, 'access_quotes'));

CREATE POLICY quotes_delete_quotes
ON public.quotes
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_quotes'));

CREATE POLICY quote_items_select_quotes
ON public.quote_items
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_quotes'));

CREATE POLICY quote_items_insert_quotes
ON public.quote_items
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_quotes'));

CREATE POLICY quote_items_update_quotes
ON public.quote_items
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_quotes'))
WITH CHECK (public.has_company_permission(company_id, 'access_quotes'));

CREATE POLICY quote_items_delete_quotes
ON public.quote_items
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_quotes'));

CREATE POLICY kits_select_inventory
ON public.kits
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY kits_insert_inventory
ON public.kits
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY kits_update_inventory
ON public.kits
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'))
WITH CHECK (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY kits_delete_inventory
ON public.kits
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY kit_items_select_inventory
ON public.kit_items
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY kit_items_insert_inventory
ON public.kit_items
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY kit_items_update_inventory
ON public.kit_items
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'))
WITH CHECK (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY kit_items_delete_inventory
ON public.kit_items
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'));

REVOKE ALL ON public.customers FROM anon, authenticated;
REVOKE ALL ON public.appointments FROM anon, authenticated;
REVOKE ALL ON public.quotes FROM anon, authenticated;
REVOKE ALL ON public.quote_items FROM anon, authenticated;
REVOKE ALL ON public.kits FROM anon, authenticated;
REVOKE ALL ON public.kit_items FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kit_items TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.kit_items_id_seq TO authenticated;

COMMIT;
