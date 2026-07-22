BEGIN;

CREATE TABLE public.company_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  default_warranty_days integer NOT NULL DEFAULT 90,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo',
  currency_code text NOT NULL DEFAULT 'BRL',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_settings_default_warranty_days_check CHECK (default_warranty_days >= 0),
  CONSTRAINT company_settings_currency_code_check CHECK (char_length(currency_code) = 3)
);

CREATE TABLE public.company_branding (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  address text,
  phone text,
  email_or_site text,
  pix_key text,
  logo_path text,
  notification_sound_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_settings_timezone
ON public.company_settings (timezone);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY company_settings_select_member
ON public.company_settings
FOR SELECT
TO authenticated
USING (public.is_company_member(company_id));

CREATE POLICY company_settings_insert_admin
ON public.company_settings
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_company_admin(company_id)
  OR public.has_company_permission(company_id, 'access_settings')
);

CREATE POLICY company_settings_update_admin
ON public.company_settings
FOR UPDATE
TO authenticated
USING (
  public.is_company_admin(company_id)
  OR public.has_company_permission(company_id, 'access_settings')
)
WITH CHECK (
  public.is_company_admin(company_id)
  OR public.has_company_permission(company_id, 'access_settings')
);

CREATE POLICY company_branding_select_member
ON public.company_branding
FOR SELECT
TO authenticated
USING (public.is_company_member(company_id));

CREATE POLICY company_branding_insert_admin
ON public.company_branding
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_company_admin(company_id)
  OR public.has_company_permission(company_id, 'access_settings')
);

CREATE POLICY company_branding_update_admin
ON public.company_branding
FOR UPDATE
TO authenticated
USING (
  public.is_company_admin(company_id)
  OR public.has_company_permission(company_id, 'access_settings')
)
WITH CHECK (
  public.is_company_admin(company_id)
  OR public.has_company_permission(company_id, 'access_settings')
);

REVOKE ALL ON public.company_settings FROM anon, authenticated;
REVOKE ALL ON public.company_branding FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON public.company_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.company_branding TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'company-assets',
    'company-assets',
    false,
    10485760,
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'audio/mpeg', 'audio/wav', 'audio/ogg']
  ),
  (
    'service-order-files',
    'service-order-files',
    false,
    20971520,
    ARRAY['image/png', 'image/jpeg', 'application/pdf']
  ),
  (
    'customer-files',
    'customer-files',
    false,
    10485760,
    ARRAY['image/png', 'image/jpeg', 'application/pdf']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY company_assets_select_member
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND public.current_company_id() IS NOT NULL
  AND public.is_company_member(public.current_company_id())
  AND (storage.foldername(name))[1] = public.current_company_id()::text
);

CREATE POLICY company_assets_insert_settings
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-assets'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND (
    public.is_company_admin(public.current_company_id())
    OR public.has_company_permission(public.current_company_id(), 'access_settings')
  )
);

CREATE POLICY company_assets_update_settings
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND (
    public.is_company_admin(public.current_company_id())
    OR public.has_company_permission(public.current_company_id(), 'access_settings')
  )
)
WITH CHECK (
  bucket_id = 'company-assets'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND (
    public.is_company_admin(public.current_company_id())
    OR public.has_company_permission(public.current_company_id(), 'access_settings')
  )
);

CREATE POLICY company_assets_delete_settings
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-assets'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND (
    public.is_company_admin(public.current_company_id())
    OR public.has_company_permission(public.current_company_id(), 'access_settings')
  )
);

CREATE POLICY service_order_files_select_service_orders
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'service-order-files'
  AND public.current_company_id() IS NOT NULL
  AND public.is_company_member(public.current_company_id())
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_service_orders')
);

CREATE POLICY service_order_files_insert_service_orders
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-order-files'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_service_orders')
);

CREATE POLICY service_order_files_update_service_orders
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-order-files'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_service_orders')
)
WITH CHECK (
  bucket_id = 'service-order-files'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_service_orders')
);

CREATE POLICY service_order_files_delete_service_orders
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-order-files'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_service_orders')
);

CREATE POLICY customer_files_select_clients
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'customer-files'
  AND public.current_company_id() IS NOT NULL
  AND public.is_company_member(public.current_company_id())
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_clients')
);

CREATE POLICY customer_files_insert_clients
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'customer-files'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_clients')
);

CREATE POLICY customer_files_update_clients
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'customer-files'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_clients')
)
WITH CHECK (
  bucket_id = 'customer-files'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_clients')
);

CREATE POLICY customer_files_delete_clients
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'customer-files'
  AND public.current_company_id() IS NOT NULL
  AND (storage.foldername(name))[1] = public.current_company_id()::text
  AND public.has_company_permission(public.current_company_id(), 'access_clients')
);

COMMIT;
