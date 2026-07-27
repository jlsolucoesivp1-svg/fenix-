BEGIN;

CREATE OR REPLACE FUNCTION public.finalize_saas_sale(
  p_company_id uuid,
  p_sale jsonb,
  p_items jsonb,
  p_financial_entries jsonb,
  p_payment_method_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sale_id text;
  v_customer_id text;
  v_related_quote_id text;
  v_subtotal numeric;
  v_discount numeric;
  v_total numeric;
  v_financial_total numeric;
  v_product record;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao autenticada obrigatoria.' USING ERRCODE = '42501';
  END IF;

  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa ativa obrigatoria.' USING ERRCODE = '22023';
  END IF;

  IF NOT public.has_company_permission(p_company_id, 'access_sales')
    OR NOT public.has_company_permission(p_company_id, 'access_inventory')
    OR NOT public.has_company_permission(p_company_id, 'access_financials') THEN
    RAISE EXCEPTION 'Permissoes de vendas, estoque e financeiro sao obrigatorias.' USING ERRCODE = '42501';
  END IF;

  IF jsonb_typeof(p_sale) <> 'object'
    OR jsonb_typeof(p_items) <> 'array'
    OR jsonb_array_length(p_items) = 0
    OR jsonb_typeof(p_financial_entries) <> 'array'
    OR jsonb_array_length(p_financial_entries) = 0 THEN
    RAISE EXCEPTION 'Payload invalido para finalizar venda.' USING ERRCODE = '22023';
  END IF;

  v_sale_id := nullif(btrim(p_sale ->> 'id'), '');
  v_customer_id := nullif(btrim(p_sale ->> 'customer_id'), '');
  v_related_quote_id := nullif(btrim(p_sale ->> 'related_quote_id'), '');

  IF v_sale_id IS NULL THEN
    RAISE EXCEPTION 'Identificador da venda obrigatorio.' USING ERRCODE = '22023';
  END IF;

  IF p_payment_method_code IS NULL
    OR p_payment_method_code NOT IN ('dinheiro', 'pix', 'boleto', 'credito', 'debito', 'parcelado') THEN
    RAISE EXCEPTION 'Metodo de pagamento invalido.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.sales
    WHERE company_id = p_company_id
      AND id = v_sale_id
  ) THEN
    RETURN jsonb_build_object('duplicated', true);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS item(value)
    WHERE jsonb_typeof(item.value) <> 'object'
      OR nullif(btrim(item.value ->> 'item_name'), '') IS NULL
      OR jsonb_typeof(item.value -> 'quantity') <> 'number'
      OR jsonb_typeof(item.value -> 'unit_price') <> 'number'
      OR (item.value ->> 'quantity')::numeric <= 0
      OR (item.value ->> 'unit_price')::numeric < 0
  ) THEN
    RAISE EXCEPTION 'Itens da venda invalidos.' USING ERRCODE = '22023';
  END IF;

  SELECT coalesce(sum((item.value ->> 'quantity')::numeric * (item.value ->> 'unit_price')::numeric), 0)
  INTO v_subtotal
  FROM jsonb_array_elements(p_items) AS item(value);

  IF jsonb_typeof(p_sale -> 'subtotal') <> 'number'
    OR jsonb_typeof(p_sale -> 'discount_value') <> 'number'
    OR jsonb_typeof(p_sale -> 'total_value') <> 'number' THEN
    RAISE EXCEPTION 'Valores da venda invalidos.' USING ERRCODE = '22023';
  END IF;

  v_discount := (p_sale ->> 'discount_value')::numeric;
  v_total := (p_sale ->> 'total_value')::numeric;

  IF v_subtotal <= 0
    OR v_discount < 0
    OR v_discount > v_subtotal
    OR v_total <= 0
    OR v_total <> v_subtotal - v_discount
    OR (p_sale ->> 'subtotal')::numeric <> v_subtotal THEN
    RAISE EXCEPTION 'Subtotal, desconto ou total invalidos.' USING ERRCODE = '22023';
  END IF;

  IF v_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.customers
    WHERE company_id = p_company_id
      AND id = v_customer_id
  ) THEN
    RAISE EXCEPTION 'Cliente nao pertence a empresa ativa.' USING ERRCODE = '23503';
  END IF;

  IF v_related_quote_id IS NOT NULL THEN
    IF NOT public.has_company_permission(p_company_id, 'access_quotes') THEN
      RAISE EXCEPTION 'Permissao de orcamentos obrigatoria para concluir esta venda.' USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.quotes
      WHERE company_id = p_company_id
        AND id = v_related_quote_id
    ) THEN
      RAISE EXCEPTION 'Orcamento nao pertence a empresa ativa.' USING ERRCODE = '23503';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS item(value)
    WHERE coalesce(item.value ->> 'product_id', '') <> ''
      AND item.value ->> 'product_id' !~ '^PROD-'
  ) THEN
    RAISE EXCEPTION 'Produto da venda invalido.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS item(value)
    WHERE nullif(item.value ->> 'product_id', '') IS NOT NULL
    GROUP BY item.value ->> 'product_id'
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Um produto nao pode ser informado mais de uma vez na mesma venda.' USING ERRCODE = '22023';
  END IF;

  FOR v_product IN
    SELECT
      item.value ->> 'product_id' AS product_id,
      sum((item.value ->> 'quantity')::numeric) AS quantity
    FROM jsonb_array_elements(p_items) AS item(value)
    WHERE nullif(item.value ->> 'product_id', '') IS NOT NULL
    GROUP BY item.value ->> 'product_id'
    ORDER BY item.value ->> 'product_id'
  LOOP
    PERFORM 1
    FROM public.products
    WHERE company_id = p_company_id
      AND id = v_product.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto % nao pertence a empresa ativa.', v_product.product_id USING ERRCODE = '23503';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.products
      WHERE company_id = p_company_id
        AND id = v_product.product_id
        AND stock_quantity < v_product.quantity
    ) THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %.', v_product.product_id USING ERRCODE = '22023';
    END IF;
  END LOOP;

  SELECT coalesce(sum((entry.value ->> 'amount')::numeric), 0)
  INTO v_financial_total
  FROM jsonb_array_elements(p_financial_entries) AS entry(value);

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_financial_entries) AS entry(value)
    WHERE jsonb_typeof(entry.value) <> 'object'
      OR nullif(btrim(entry.value ->> 'id'), '') IS NULL
      OR coalesce(entry.value ->> 'entry_type', '') <> 'receita'
      OR nullif(btrim(entry.value ->> 'description'), '') IS NULL
      OR jsonb_typeof(entry.value -> 'amount') <> 'number'
      OR (entry.value ->> 'amount')::numeric <= 0
      OR nullif(btrim(entry.value ->> 'transaction_date'), '') IS NULL
      OR coalesce(entry.value ->> 'status', '') NOT IN ('pago', 'pendente')
      OR nullif(btrim(entry.value ->> 'category'), '') IS NULL
      OR nullif(btrim(entry.value ->> 'payment_method'), '') IS NULL
      OR coalesce(entry.value ->> 'related_sale_id', '') <> v_sale_id
  ) THEN
    RAISE EXCEPTION 'Lancamentos financeiros invalidos.' USING ERRCODE = '22023';
  END IF;

  IF v_financial_total <> v_total THEN
    RAISE EXCEPTION 'Total financeiro diverge do total da venda.' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sales (
    id, company_id, sale_date, sale_time, user_display_name, subtotal, discount_value,
    total_value, payment_method, observations, customer_id, customer_name,
    related_quote_id, status, reversal_reason
  ) VALUES (
    v_sale_id,
    p_company_id,
    (p_sale ->> 'sale_date')::date,
    (p_sale ->> 'sale_time')::time,
    coalesce(nullif(btrim(p_sale ->> 'user_display_name'), ''), 'Nao identificado'),
    v_subtotal,
    v_discount,
    v_total,
    p_sale ->> 'payment_method',
    nullif(btrim(p_sale ->> 'observations'), ''),
    v_customer_id,
    nullif(btrim(p_sale ->> 'customer_name'), ''),
    v_related_quote_id,
    'Finalizada',
    null
  );

  INSERT INTO public.sale_items (
    company_id, sale_id, legacy_item_id, product_id, item_name, quantity, unit_price, line_total
  )
  SELECT
    p_company_id,
    v_sale_id,
    nullif(btrim(item.value ->> 'legacy_item_id'), ''),
    nullif(btrim(item.value ->> 'product_id'), ''),
    btrim(item.value ->> 'item_name'),
    (item.value ->> 'quantity')::numeric,
    (item.value ->> 'unit_price')::numeric,
    (item.value ->> 'quantity')::numeric * (item.value ->> 'unit_price')::numeric
  FROM jsonb_array_elements(p_items) AS item(value);

  FOR v_product IN
    SELECT
      item.value ->> 'product_id' AS product_id,
      sum((item.value ->> 'quantity')::numeric) AS quantity
    FROM jsonb_array_elements(p_items) AS item(value)
    WHERE nullif(item.value ->> 'product_id', '') IS NOT NULL
    GROUP BY item.value ->> 'product_id'
    ORDER BY item.value ->> 'product_id'
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity - v_product.quantity,
        updated_at = now()
    WHERE company_id = p_company_id
      AND id = v_product.product_id;
  END LOOP;

  INSERT INTO public.inventory_movements (
    company_id, product_id, movement_key, movement_type, quantity_delta, unit_cost,
    unit_price, stock_balance_after, reference_type, reference_id, notes, metadata,
    created_by_user_id
  )
  SELECT
    p_company_id,
    item.value ->> 'product_id',
    v_sale_id || ':sale:' || (item.value ->> 'product_id'),
    'sale',
    -abs((item.value ->> 'quantity')::numeric),
    null,
    (item.value ->> 'unit_price')::numeric,
    product.stock_quantity,
    'sale',
    v_sale_id,
    'Baixa por venda - ' || v_sale_id,
    jsonb_build_object('saleId', v_sale_id, 'relatedQuoteId', v_related_quote_id),
    auth.uid()
  FROM jsonb_array_elements(p_items) AS item(value)
  JOIN public.products AS product
    ON product.company_id = p_company_id
   AND product.id = item.value ->> 'product_id'
  WHERE nullif(item.value ->> 'product_id', '') IS NOT NULL;

  INSERT INTO public.financial_entries (
    id, company_id, entry_type, description, amount, transaction_date, due_date,
    status, category, payment_method, related_sale_id, related_service_order_id,
    related_stock_entry_key, origin, created_by_user_id, metadata
  )
  SELECT
    entry.value ->> 'id',
    p_company_id,
    entry.value ->> 'entry_type',
    entry.value ->> 'description',
    (entry.value ->> 'amount')::numeric,
    (entry.value ->> 'transaction_date')::date,
    nullif(entry.value ->> 'due_date', '')::date,
    entry.value ->> 'status',
    entry.value ->> 'category',
    entry.value ->> 'payment_method',
    v_sale_id,
    null,
    null,
    coalesce(nullif(entry.value ->> 'origin', ''), 'sale'),
    auth.uid(),
    '{}'::jsonb
  FROM jsonb_array_elements(p_financial_entries) AS entry(value);

  IF v_related_quote_id IS NOT NULL THEN
    UPDATE public.quotes
    SET status = 'Vendido'
    WHERE company_id = p_company_id
      AND id = v_related_quote_id;
  END IF;

  RETURN jsonb_build_object('duplicated', false);
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_saas_sale(uuid, jsonb, jsonb, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_saas_sale(uuid, jsonb, jsonb, jsonb, text) TO authenticated;

COMMIT;
