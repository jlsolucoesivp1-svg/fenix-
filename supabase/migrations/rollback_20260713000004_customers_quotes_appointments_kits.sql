BEGIN;

DROP POLICY IF EXISTS kit_items_delete_inventory ON public.kit_items;
DROP POLICY IF EXISTS kit_items_update_inventory ON public.kit_items;
DROP POLICY IF EXISTS kit_items_insert_inventory ON public.kit_items;
DROP POLICY IF EXISTS kit_items_select_inventory ON public.kit_items;

DROP POLICY IF EXISTS kits_delete_inventory ON public.kits;
DROP POLICY IF EXISTS kits_update_inventory ON public.kits;
DROP POLICY IF EXISTS kits_insert_inventory ON public.kits;
DROP POLICY IF EXISTS kits_select_inventory ON public.kits;

DROP POLICY IF EXISTS quote_items_delete_quotes ON public.quote_items;
DROP POLICY IF EXISTS quote_items_update_quotes ON public.quote_items;
DROP POLICY IF EXISTS quote_items_insert_quotes ON public.quote_items;
DROP POLICY IF EXISTS quote_items_select_quotes ON public.quote_items;

DROP POLICY IF EXISTS quotes_delete_quotes ON public.quotes;
DROP POLICY IF EXISTS quotes_update_quotes ON public.quotes;
DROP POLICY IF EXISTS quotes_insert_quotes ON public.quotes;
DROP POLICY IF EXISTS quotes_select_quotes ON public.quotes;

DROP POLICY IF EXISTS appointments_delete_agenda ON public.appointments;
DROP POLICY IF EXISTS appointments_update_agenda ON public.appointments;
DROP POLICY IF EXISTS appointments_insert_agenda ON public.appointments;
DROP POLICY IF EXISTS appointments_select_agenda ON public.appointments;

DROP POLICY IF EXISTS customers_delete_clients ON public.customers;
DROP POLICY IF EXISTS customers_update_clients ON public.customers;
DROP POLICY IF EXISTS customers_insert_clients ON public.customers;
DROP POLICY IF EXISTS customers_select_clients ON public.customers;

DROP TABLE IF EXISTS public.kit_items;
DROP TABLE IF EXISTS public.kits;
DROP TABLE IF EXISTS public.quote_items;
DROP TABLE IF EXISTS public.quotes;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public.customers;

COMMIT;
