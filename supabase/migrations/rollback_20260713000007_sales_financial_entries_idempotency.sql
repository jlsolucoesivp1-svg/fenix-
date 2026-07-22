BEGIN;

REVOKE ALL ON public.sales FROM authenticated;
REVOKE ALL ON public.sale_items FROM authenticated;
REVOKE ALL ON public.financial_entries FROM authenticated;
REVOKE ALL ON public.idempotency_keys FROM authenticated;
REVOKE ALL ON SEQUENCE public.sale_items_id_seq FROM authenticated;
REVOKE ALL ON SEQUENCE public.idempotency_keys_id_seq FROM authenticated;

DROP POLICY IF EXISTS idempotency_keys_delete_financials ON public.idempotency_keys;
DROP POLICY IF EXISTS idempotency_keys_update_financials ON public.idempotency_keys;
DROP POLICY IF EXISTS idempotency_keys_insert_financials ON public.idempotency_keys;
DROP POLICY IF EXISTS idempotency_keys_select_financials ON public.idempotency_keys;
DROP POLICY IF EXISTS financial_entries_delete_financials ON public.financial_entries;
DROP POLICY IF EXISTS financial_entries_update_financials ON public.financial_entries;
DROP POLICY IF EXISTS financial_entries_insert_financials ON public.financial_entries;
DROP POLICY IF EXISTS financial_entries_select_financials ON public.financial_entries;
DROP POLICY IF EXISTS sale_items_delete_sales ON public.sale_items;
DROP POLICY IF EXISTS sale_items_update_sales ON public.sale_items;
DROP POLICY IF EXISTS sale_items_insert_sales ON public.sale_items;
DROP POLICY IF EXISTS sale_items_select_sales ON public.sale_items;
DROP POLICY IF EXISTS sales_delete_sales ON public.sales;
DROP POLICY IF EXISTS sales_update_sales ON public.sales;
DROP POLICY IF EXISTS sales_insert_sales ON public.sales;
DROP POLICY IF EXISTS sales_select_sales ON public.sales;

DROP TABLE IF EXISTS public.idempotency_keys;
DROP TABLE IF EXISTS public.financial_entries;
DROP TABLE IF EXISTS public.sale_items;
DROP TABLE IF EXISTS public.sales;

COMMIT;
