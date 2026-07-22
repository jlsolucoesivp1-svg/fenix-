BEGIN;

DROP POLICY IF EXISTS customer_files_delete_clients ON storage.objects;
DROP POLICY IF EXISTS customer_files_update_clients ON storage.objects;
DROP POLICY IF EXISTS customer_files_insert_clients ON storage.objects;
DROP POLICY IF EXISTS customer_files_select_clients ON storage.objects;

DROP POLICY IF EXISTS service_order_files_delete_service_orders ON storage.objects;
DROP POLICY IF EXISTS service_order_files_update_service_orders ON storage.objects;
DROP POLICY IF EXISTS service_order_files_insert_service_orders ON storage.objects;
DROP POLICY IF EXISTS service_order_files_select_service_orders ON storage.objects;

DROP POLICY IF EXISTS company_assets_delete_settings ON storage.objects;
DROP POLICY IF EXISTS company_assets_update_settings ON storage.objects;
DROP POLICY IF EXISTS company_assets_insert_settings ON storage.objects;
DROP POLICY IF EXISTS company_assets_select_member ON storage.objects;

DELETE FROM storage.buckets
WHERE id IN ('company-assets', 'service-order-files', 'customer-files');

DROP POLICY IF EXISTS company_branding_update_admin ON public.company_branding;
DROP POLICY IF EXISTS company_branding_insert_admin ON public.company_branding;
DROP POLICY IF EXISTS company_branding_select_member ON public.company_branding;

DROP POLICY IF EXISTS company_settings_update_admin ON public.company_settings;
DROP POLICY IF EXISTS company_settings_insert_admin ON public.company_settings;
DROP POLICY IF EXISTS company_settings_select_member ON public.company_settings;

DROP TABLE IF EXISTS public.company_branding;
DROP TABLE IF EXISTS public.company_settings;

COMMIT;
