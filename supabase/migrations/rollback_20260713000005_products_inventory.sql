BEGIN;

REVOKE ALL ON public.products FROM authenticated;
REVOKE ALL ON public.inventory_movements FROM authenticated;
REVOKE ALL ON SEQUENCE public.inventory_movements_id_seq FROM authenticated;

DROP POLICY IF EXISTS inventory_movements_insert_inventory ON public.inventory_movements;
DROP POLICY IF EXISTS inventory_movements_select_inventory ON public.inventory_movements;
DROP POLICY IF EXISTS products_delete_inventory ON public.products;
DROP POLICY IF EXISTS products_update_inventory ON public.products;
DROP POLICY IF EXISTS products_insert_inventory ON public.products;
DROP POLICY IF EXISTS products_select_inventory ON public.products;

DROP TABLE IF EXISTS public.inventory_movements;
DROP TABLE IF EXISTS public.products;

COMMIT;
