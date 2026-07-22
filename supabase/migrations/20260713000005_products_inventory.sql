BEGIN;

CREATE TABLE public.products (
  id text PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category text,
  stock_quantity numeric(18,3) NOT NULL DEFAULT 0,
  sale_price numeric(18,2) NOT NULL DEFAULT 0,
  cost_price numeric(18,2) NOT NULL DEFAULT 0,
  min_stock_quantity numeric(18,3) NOT NULL DEFAULT 0,
  barcode text,
  unit_name text NOT NULL DEFAULT 'UN',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT products_company_id_id_unique UNIQUE (company_id, id),
  CONSTRAINT products_sale_price_check CHECK (sale_price >= 0),
  CONSTRAINT products_cost_price_check CHECK (cost_price >= 0),
  CONSTRAINT products_min_stock_quantity_check CHECK (min_stock_quantity >= 0),
  CONSTRAINT products_unit_name_not_blank CHECK (char_length(btrim(unit_name)) > 0)
);

CREATE TABLE public.inventory_movements (
  id bigserial PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  movement_key text NOT NULL,
  movement_type text NOT NULL,
  quantity_delta numeric(18,3) NOT NULL,
  unit_cost numeric(18,2),
  unit_price numeric(18,2),
  stock_balance_after numeric(18,3),
  reference_type text,
  reference_id text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movements_product_fk
    FOREIGN KEY (company_id, product_id)
    REFERENCES public.products(company_id, id)
    ON DELETE CASCADE,
  CONSTRAINT inventory_movements_company_key_unique UNIQUE (company_id, movement_key),
  CONSTRAINT inventory_movements_type_check CHECK (
    movement_type IN (
      'stock_entry',
      'stock_adjustment',
      'sale',
      'sale_reversal',
      'service_order_consumption',
      'service_order_reversal',
      'manual_adjustment',
      'import'
    )
  ),
  CONSTRAINT inventory_movements_metadata_object_check CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_products_company_name
ON public.products (company_id, name);

CREATE INDEX idx_products_company_category
ON public.products (company_id, category);

CREATE INDEX idx_products_company_barcode
ON public.products (company_id, barcode);

CREATE INDEX idx_products_company_active_name
ON public.products (company_id, is_active, name);

CREATE INDEX idx_inventory_movements_company_product_created_at
ON public.inventory_movements (company_id, product_id, created_at DESC, id DESC);

CREATE INDEX idx_inventory_movements_company_type_created_at
ON public.inventory_movements (company_id, movement_type, created_at DESC, id DESC);

CREATE INDEX idx_inventory_movements_company_reference
ON public.inventory_movements (company_id, reference_type, reference_id);

CREATE INDEX idx_inventory_movements_created_by
ON public.inventory_movements (created_by_user_id, created_at DESC);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_select_inventory
ON public.products
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY products_insert_inventory
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY products_update_inventory
ON public.products
FOR UPDATE
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'))
WITH CHECK (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY products_delete_inventory
ON public.products
FOR DELETE
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY inventory_movements_select_inventory
ON public.inventory_movements
FOR SELECT
TO authenticated
USING (public.has_company_permission(company_id, 'access_inventory'));

CREATE POLICY inventory_movements_insert_inventory
ON public.inventory_movements
FOR INSERT
TO authenticated
WITH CHECK (public.has_company_permission(company_id, 'access_inventory'));

REVOKE ALL ON public.products FROM anon, authenticated;
REVOKE ALL ON public.inventory_movements FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT, INSERT ON public.inventory_movements TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.inventory_movements_id_seq TO authenticated;

COMMIT;
