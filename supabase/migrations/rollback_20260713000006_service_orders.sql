BEGIN;

REVOKE ALL ON public.service_orders FROM authenticated;
REVOKE ALL ON public.service_order_items FROM authenticated;
REVOKE ALL ON public.service_order_payments FROM authenticated;
REVOKE ALL ON public.service_order_notes FROM authenticated;
REVOKE ALL ON public.service_order_history FROM authenticated;
REVOKE ALL ON public.service_order_views FROM authenticated;
REVOKE ALL ON SEQUENCE public.service_order_items_id_seq FROM authenticated;
REVOKE ALL ON SEQUENCE public.service_order_notes_id_seq FROM authenticated;
REVOKE ALL ON SEQUENCE public.service_order_history_id_seq FROM authenticated;
REVOKE ALL ON SEQUENCE public.service_order_views_id_seq FROM authenticated;

DROP POLICY IF EXISTS service_order_views_delete_service_orders ON public.service_order_views;
DROP POLICY IF EXISTS service_order_views_update_service_orders ON public.service_order_views;
DROP POLICY IF EXISTS service_order_views_insert_service_orders ON public.service_order_views;
DROP POLICY IF EXISTS service_order_views_select_service_orders ON public.service_order_views;
DROP POLICY IF EXISTS service_order_history_insert_service_orders ON public.service_order_history;
DROP POLICY IF EXISTS service_order_history_select_service_orders ON public.service_order_history;
DROP POLICY IF EXISTS service_order_notes_delete_service_orders ON public.service_order_notes;
DROP POLICY IF EXISTS service_order_notes_update_service_orders ON public.service_order_notes;
DROP POLICY IF EXISTS service_order_notes_insert_service_orders ON public.service_order_notes;
DROP POLICY IF EXISTS service_order_notes_select_service_orders ON public.service_order_notes;
DROP POLICY IF EXISTS service_order_payments_delete_service_orders ON public.service_order_payments;
DROP POLICY IF EXISTS service_order_payments_update_service_orders ON public.service_order_payments;
DROP POLICY IF EXISTS service_order_payments_insert_service_orders ON public.service_order_payments;
DROP POLICY IF EXISTS service_order_payments_select_service_orders ON public.service_order_payments;
DROP POLICY IF EXISTS service_order_items_delete_service_orders ON public.service_order_items;
DROP POLICY IF EXISTS service_order_items_update_service_orders ON public.service_order_items;
DROP POLICY IF EXISTS service_order_items_insert_service_orders ON public.service_order_items;
DROP POLICY IF EXISTS service_order_items_select_service_orders ON public.service_order_items;
DROP POLICY IF EXISTS service_orders_delete_service_orders ON public.service_orders;
DROP POLICY IF EXISTS service_orders_update_service_orders ON public.service_orders;
DROP POLICY IF EXISTS service_orders_insert_service_orders ON public.service_orders;
DROP POLICY IF EXISTS service_orders_select_service_orders ON public.service_orders;

DROP TABLE IF EXISTS public.service_order_views;
DROP TABLE IF EXISTS public.service_order_history;
DROP TABLE IF EXISTS public.service_order_notes;
DROP TABLE IF EXISTS public.service_order_payments;
DROP TABLE IF EXISTS public.service_order_items;
DROP TABLE IF EXISTS public.service_orders;

COMMIT;
