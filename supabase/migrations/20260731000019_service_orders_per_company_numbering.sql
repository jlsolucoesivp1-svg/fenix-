BEGIN;

-- A PK anterior tornava o numero visivel da OS global. Antes de remover essa
-- restricao, a verificacao explicita protege a migration contra uma base que
-- ja tenha sido alterada fora do historico versionado.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.service_orders
    GROUP BY company_id, id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Existem numeros de OS duplicados na mesma empresa; a migration foi interrompida sem alterar dados.';
  END IF;
END;
$$;

-- A UNIQUE composta ja existe e e a chave referenciada por todos os filhos da
-- OS. Remover somente a PK global preserva as FKs e todos os registros atuais.
ALTER TABLE public.service_orders
  DROP CONSTRAINT service_orders_pkey;

ALTER TABLE public.service_orders
  ALTER COLUMN id SET NOT NULL;

CREATE TABLE public.service_order_counters (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  next_number bigint NOT NULL CHECK (next_number > 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Mantem os numeros existentes e inicia cada contador no proximo numero
-- numerico daquela empresa. IDs legados nao numericos nao sao renumerados.
INSERT INTO public.service_order_counters (company_id, next_number)
SELECT
  company_id,
  COALESCE(MAX(CASE WHEN id ~ '^[0-9]+$' THEN id::bigint END), 0) + 1
FROM public.service_orders
GROUP BY company_id;

ALTER TABLE public.service_order_counters ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.service_order_counters FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_saas_service_order(p_order jsonb)
RETURNS public.service_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_company_id uuid;
  v_order_number bigint;
  v_order_id text;
  v_customer_id text;
  v_status text;
  v_created public.service_orders%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sessao autenticada obrigatoria.' USING ERRCODE = '42501';
  END IF;

  v_company_id := public.current_company_id();
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'Empresa ativa obrigatoria.' USING ERRCODE = '22023';
  END IF;

  IF NOT public.has_company_permission(v_company_id, 'access_service_orders') THEN
    RAISE EXCEPTION 'Voce nao tem permissao para criar ordens de servico.' USING ERRCODE = '42501';
  END IF;

  IF pg_catalog.jsonb_typeof(p_order) <> 'object' THEN
    RAISE EXCEPTION 'Payload invalido para criar a ordem de servico.' USING ERRCODE = '22023';
  END IF;

  v_customer_id := nullif(pg_catalog.btrim(p_order ->> 'customer_id'), '');
  v_status := coalesce(nullif(pg_catalog.btrim(p_order ->> 'status_code'), ''), 'Aberta');

  IF nullif(pg_catalog.btrim(p_order ->> 'customer_name'), '') IS NULL
    OR nullif(pg_catalog.btrim(p_order ->> 'equipment_summary'), '') IS NULL
    OR nullif(pg_catalog.btrim(p_order ->> 'reported_issue'), '') IS NULL
    OR nullif(pg_catalog.btrim(p_order ->> 'opened_at'), '') IS NULL
    OR nullif(pg_catalog.btrim(p_order ->> 'attendant_name'), '') IS NULL THEN
    RAISE EXCEPTION 'Campos obrigatorios da ordem de servico nao foram informados.' USING ERRCODE = '22023';
  END IF;

  IF v_status NOT IN (
    'Em analise', 'Aprovado', 'Em conserto', 'Finalizado', 'Entregue',
    'Aberta', 'Aguardando Pagamento', 'Aguardando peca', 'Cancelada'
  ) THEN
    RAISE EXCEPTION 'Status da ordem de servico invalido.' USING ERRCODE = '22023';
  END IF;

  IF v_customer_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.customers
    WHERE company_id = v_company_id
      AND id = v_customer_id
  ) THEN
    RAISE EXCEPTION 'Cliente nao pertence a empresa ativa.' USING ERRCODE = '23503';
  END IF;

  -- UPSERT bloqueia a mesma linha de contador por empresa. O numero e a
  -- insercao abaixo pertencem a mesma transacao da RPC.
  INSERT INTO public.service_order_counters AS counter (company_id, next_number, updated_at)
  VALUES (v_company_id, 2, now())
  ON CONFLICT (company_id) DO UPDATE
  SET next_number = counter.next_number + 1,
      updated_at = now()
  RETURNING next_number - 1 INTO v_order_number;

  v_order_id := v_order_number::text;

  INSERT INTO public.service_orders (
    id, company_id, customer_id, customer_name, equipment_summary, equipment_type,
    equipment_brand, equipment_model, serial_number, reported_issue, status_code,
    opened_at, delivered_at, attendant_name, payment_method, warranty_text,
    total_value, discount_value, final_value, accessories, technical_report
  ) VALUES (
    v_order_id,
    v_company_id,
    v_customer_id,
    pg_catalog.btrim(p_order ->> 'customer_name'),
    pg_catalog.btrim(p_order ->> 'equipment_summary'),
    nullif(pg_catalog.btrim(p_order ->> 'equipment_type'), ''),
    nullif(pg_catalog.btrim(p_order ->> 'equipment_brand'), ''),
    nullif(pg_catalog.btrim(p_order ->> 'equipment_model'), ''),
    nullif(pg_catalog.btrim(p_order ->> 'serial_number'), ''),
    pg_catalog.btrim(p_order ->> 'reported_issue'),
    v_status,
    (p_order ->> 'opened_at')::date,
    nullif(pg_catalog.btrim(p_order ->> 'delivered_at'), '')::date,
    pg_catalog.btrim(p_order ->> 'attendant_name'),
    nullif(pg_catalog.btrim(p_order ->> 'payment_method'), ''),
    nullif(pg_catalog.btrim(p_order ->> 'warranty_text'), ''),
    coalesce((p_order ->> 'total_value')::numeric, 0),
    coalesce((p_order ->> 'discount_value')::numeric, 0),
    coalesce((p_order ->> 'final_value')::numeric, coalesce((p_order ->> 'total_value')::numeric, 0)),
    nullif(pg_catalog.btrim(p_order ->> 'accessories'), ''),
    nullif(pg_catalog.btrim(p_order ->> 'technical_report'), '')
  )
  RETURNING * INTO v_created;

  RETURN v_created;
END;
$$;

REVOKE ALL ON FUNCTION public.create_saas_service_order(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_saas_service_order(jsonb) TO authenticated;

-- Novas OS devem passar pela RPC, que ignora qualquer company_id ou id enviado
-- pelo cliente e deriva a empresa da sessao autenticada.
REVOKE INSERT ON public.service_orders FROM authenticated;

COMMIT;
