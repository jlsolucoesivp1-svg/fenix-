# Revisao Final da Migration 001 - SaaS Multiempresa Fenix

Quero que voce revise tecnicamente a versao final da `Migration 001` da arquitetura SaaS multiempresa do projeto Fenix.

## Contexto e restricoes

- Nao execute SQL.
- Nao aplique nada no banco.
- Nao altere o escopo para alem da `Migration 001`.
- O sistema legado deve continuar funcionando sem ser quebrado.
- Todas as tabelas empresariais novas devem nascer com `RLS ENABLED` e policies restritivas.
- Nenhuma rota de usuario final podera usar `service_role`.
- Nenhum segredo pode ser salvo no Git.
- O objetivo agora e apenas revisar a fundacao SaaS antes da implementacao local controlada.

## O que quero da sua revisao

Analise os seguintes pontos:

1. consistencia da modelagem;
2. seguranca de RLS e policies;
3. risco de bootstrap bloqueado;
4. grants e exposicao indevida;
5. dependencia entre funcoes, policies e tabelas;
6. qualidade da estrategia de autenticacao;
7. qualidade da estrategia do `active_company_id` no JWT;
8. robustez de `is_company_admin()`;
9. protecao de roles de sistema;
10. qualidade da auditoria;
11. melhorias necessarias antes da execucao;
12. riscos de rollback.

Se encontrar problemas, responda com:

- problema;
- impacto;
- correcao recomendada.

## Ajustes que ja foram incorporados

- `profiles` agora tem policy de `INSERT` para criacao segura no primeiro acesso.
- `companies` ficou explicitamente fora do escopo de usuario autenticado comum.
- autenticacao definida definitivamente como `login por e-mail` via Supabase Auth.
- `login_name` permanece apenas como metadado de compatibilidade, nao como identidade primaria concorrente.
- `active_company_id` sera incluido explicitamente no JWT em `app_metadata`.
- `current_company_id()` nao depende de fallback implicito.
- `is_company_admin()` nao depende mais do nome da role.
- privilegio administrativo agora usa:
  - `is_owner`
  - `roles.is_company_admin`
  - permissao explicita `manage_company`
- `audit_logs` agora inclui:
  - `request_id`
  - `success`
  - `severity`
- roles de sistema estao protegidas contra alteracao e exclusao por usuarios comuns via policies restritivas.

## Escopo da etapa

### Arquivos que serao alterados na implementacao desta etapa

- `supabase/migrations/2026xxxx_000001_saas_foundation.sql`
- `docs/plano-migracao-saas.md`
- `src/types/saas.ts`
- `src/lib/server/supabase-admin.ts`
- `src/lib/server/supabase-user.ts`
- `src/lib/server/tenant-context.ts`
- `src/lib/server/authz.ts`
- `src/lib/server/audit.ts`
- `.env.example`

### Migration que sera criada

- `2026xxxx_000001_saas_foundation.sql`

### Riscos conhecidos

- policies restritivas demais bloquearem bootstrap administrativo;
- modelagem inicial de roles e memberships exigir ajuste antes das tabelas de negocio;
- grants redundantes passarem falsa sensacao de acesso;
- uso futuro incorreto de `service_role` fora de rotas administrativas.

### Criterios de aceite

- todas as tabelas da migration nascem com `RLS ENABLED`;
- usuario autenticado sem membership nao acessa dados empresariais;
- usuario com membership ativa acessa apenas sua empresa;
- admin/owner da empresa consegue administrar memberships e roles da propria empresa;
- nenhuma rota final depende de `service_role`;
- nenhum segredo entra no Git.

### Rollback esperado

- reverter com script explicito de `DROP POLICY`, `DROP TABLE` e `DROP FUNCTION` na ordem inversa;
- nao tocar em `app_records` nem `app_singletons`;
- nao interromper o sistema legado.

## Decisoes arquiteturais obrigatorias desta migration

### Criacao de companies

- fora do escopo do usuario autenticado comum;
- deve ocorrer apenas por:
  - bootstrap administrativo;
  - ferramenta interna;
  - backend controlado.

### Estrategia definitiva de autenticacao

- identidade primaria: `email` no Supabase Auth;
- `login_name` e apenas metadado opcional de compatibilidade;
- nao manter dois conceitos concorrentes de identidade primaria.

### Estrategia do active_company_id no JWT

- o valor deve ser incluido explicitamente em `app_metadata.active_company_id`;
- o backend deve validar que:
  - existe;
  - e um UUID valido;
  - corresponde a membership ativa do usuario;
  - a empresa esta ativa;
- `current_company_id()` apenas le o claim;
- a seguranca real continua nas functions e policies;
- nao usar fallback implicito em producao.

## SQL completo proposto

```sql
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claim_value text;
BEGIN
  claim_value := auth.jwt() -> 'app_metadata' ->> 'active_company_id';

  IF claim_value IS NULL OR btrim(claim_value) = '' THEN
    RETURN NULL;
  END IF;

  RETURN claim_value::uuid;
EXCEPTION
  WHEN others THEN
    RETURN NULL;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  login_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  trade_name text NOT NULL,
  legal_name text,
  document_number text,
  phone text,
  email text,
  address_line text,
  address_number text,
  address_complement text,
  district text,
  city text,
  state_code text,
  zip_code text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT companies_slug_unique UNIQUE (slug),
  CONSTRAINT companies_status_check CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE TABLE public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  module_name text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT permissions_code_unique UNIQUE (code)
);

CREATE TABLE public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  is_company_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT roles_company_name_unique UNIQUE (company_id, name),
  CONSTRAINT roles_scope_check CHECK (
    (is_system = true AND company_id IS NULL)
    OR (is_system = false AND company_id IS NOT NULL)
  )
);

CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE public.company_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NULL REFERENCES public.roles(id) ON DELETE SET NULL,
  is_owner boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_memberships_company_user_unique UNIQUE (company_id, user_id),
  CONSTRAINT company_memberships_status_check CHECK (status IN ('active', 'inactive', 'invited', 'revoked'))
);

CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  company_id uuid NULL REFERENCES public.companies(id) ON DELETE SET NULL,
  actor_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  request_id text,
  success boolean NOT NULL DEFAULT true,
  severity text NOT NULL DEFAULT 'info',
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_severity_check CHECK (severity IN ('debug', 'info', 'warn', 'error', 'critical'))
);

CREATE INDEX idx_profiles_login_name
ON public.profiles (login_name);

CREATE INDEX idx_companies_status
ON public.companies (status);

CREATE INDEX idx_companies_document_number
ON public.companies (document_number);

CREATE INDEX idx_company_memberships_user_id
ON public.company_memberships (user_id);

CREATE INDEX idx_company_memberships_company_status
ON public.company_memberships (company_id, status);

CREATE INDEX idx_company_memberships_user_status
ON public.company_memberships (user_id, status);

CREATE UNIQUE INDEX idx_company_memberships_default_per_user
ON public.company_memberships (user_id)
WHERE is_default = true AND status = 'active';

CREATE INDEX idx_roles_company_id
ON public.roles (company_id);

CREATE INDEX idx_roles_company_admin
ON public.roles (company_id, is_company_admin);

CREATE INDEX idx_role_permissions_permission_id
ON public.role_permissions (permission_id);

CREATE INDEX idx_audit_logs_company_created_at
ON public.audit_logs (company_id, created_at DESC);

CREATE INDEX idx_audit_logs_actor_created_at
ON public.audit_logs (actor_user_id, created_at DESC);

CREATE INDEX idx_audit_logs_action_created_at
ON public.audit_logs (action, created_at DESC);

CREATE INDEX idx_audit_logs_request_id
ON public.audit_logs (request_id);

CREATE OR REPLACE FUNCTION public.is_company_member(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    JOIN public.companies c
      ON c.id = cm.company_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = public.auth_user_id()
      AND cm.status = 'active'
      AND c.status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_company_permission(target_company_id uuid, permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    JOIN public.companies c
      ON c.id = cm.company_id
    LEFT JOIN public.roles r
      ON r.id = cm.role_id
    LEFT JOIN public.role_permissions rp
      ON rp.role_id = r.id
    LEFT JOIN public.permissions p
      ON p.id = rp.permission_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = public.auth_user_id()
      AND cm.status = 'active'
      AND c.status = 'active'
      AND (
        cm.is_owner = true
        OR p.code = permission_code
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    JOIN public.companies c
      ON c.id = cm.company_id
    LEFT JOIN public.roles r
      ON r.id = cm.role_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = public.auth_user_id()
      AND cm.status = 'active'
      AND c.status = 'active'
      AND (
        cm.is_owner = true
        OR (r.is_company_admin = true)
        OR public.has_company_permission(target_company_id, 'manage_company')
      )
  )
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_self
ON public.profiles
FOR SELECT
TO authenticated
USING (id = public.auth_user_id());

CREATE POLICY profiles_insert_self
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = public.auth_user_id());

CREATE POLICY profiles_update_self
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = public.auth_user_id())
WITH CHECK (id = public.auth_user_id());

CREATE POLICY permissions_select_authenticated
ON public.permissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY companies_select_member
ON public.companies
FOR SELECT
TO authenticated
USING (public.is_company_member(id));

CREATE POLICY companies_update_admin
ON public.companies
FOR UPDATE
TO authenticated
USING (public.is_company_admin(id))
WITH CHECK (public.is_company_admin(id));

CREATE POLICY roles_select_member
ON public.roles
FOR SELECT
TO authenticated
USING (
  (company_id IS NULL AND is_system = true)
  OR public.is_company_member(company_id)
);

CREATE POLICY roles_insert_admin
ON public.roles
FOR INSERT
TO authenticated
WITH CHECK (
  company_id IS NOT NULL
  AND is_system = false
  AND public.is_company_admin(company_id)
);

CREATE POLICY roles_update_admin
ON public.roles
FOR UPDATE
TO authenticated
USING (
  company_id IS NOT NULL
  AND is_system = false
  AND public.is_company_admin(company_id)
)
WITH CHECK (
  company_id IS NOT NULL
  AND is_system = false
  AND public.is_company_admin(company_id)
);

CREATE POLICY roles_delete_admin
ON public.roles
FOR DELETE
TO authenticated
USING (
  company_id IS NOT NULL
  AND is_system = false
  AND public.is_company_admin(company_id)
);

CREATE POLICY role_permissions_select_member
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = role_permissions.role_id
      AND (
        (r.company_id IS NULL AND r.is_system = true)
        OR public.is_company_member(r.company_id)
      )
  )
);

CREATE POLICY role_permissions_insert_admin
ON public.role_permissions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = role_permissions.role_id
      AND r.company_id IS NOT NULL
      AND r.is_system = false
      AND public.is_company_admin(r.company_id)
  )
);

CREATE POLICY role_permissions_delete_admin
ON public.role_permissions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = role_permissions.role_id
      AND r.company_id IS NOT NULL
      AND r.is_system = false
      AND public.is_company_admin(r.company_id)
  )
);

CREATE POLICY memberships_select_member
ON public.company_memberships
FOR SELECT
TO authenticated
USING (public.is_company_member(company_id));

CREATE POLICY memberships_insert_admin
ON public.company_memberships
FOR INSERT
TO authenticated
WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY memberships_update_admin
ON public.company_memberships
FOR UPDATE
TO authenticated
USING (public.is_company_admin(company_id))
WITH CHECK (public.is_company_admin(company_id));

CREATE POLICY memberships_delete_admin
ON public.company_memberships
FOR DELETE
TO authenticated
USING (public.is_company_admin(company_id));

CREATE POLICY audit_logs_select_admin
ON public.audit_logs
FOR SELECT
TO authenticated
USING (
  company_id IS NULL
  OR public.is_company_admin(company_id)
);

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.companies FROM anon, authenticated;
REVOKE ALL ON public.permissions FROM anon;
REVOKE ALL ON public.roles FROM anon;
REVOKE ALL ON public.role_permissions FROM anon;
REVOKE ALL ON public.company_memberships FROM anon;
REVOKE ALL ON public.audit_logs FROM anon;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.permissions TO authenticated;
GRANT SELECT, UPDATE ON public.companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.roles TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_memberships TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;

INSERT INTO public.permissions (code, module_name, name)
VALUES
  ('access_dashboard', 'dashboard', 'Acessar dashboard'),
  ('access_clients', 'customers', 'Acessar clientes'),
  ('access_service_orders', 'service_orders', 'Acessar ordens de servico'),
  ('access_inventory', 'inventory', 'Acessar estoque'),
  ('access_sales', 'sales', 'Acessar vendas'),
  ('access_financials', 'financial', 'Acessar financeiro'),
  ('access_settings', 'settings', 'Acessar configuracoes'),
  ('access_danger_zone', 'settings', 'Acessar zona de perigo'),
  ('access_agenda', 'agenda', 'Acessar agenda'),
  ('access_quotes', 'quotes', 'Acessar orcamentos'),
  ('access_laudos', 'reports', 'Acessar laudos'),
  ('can_edit', 'general', 'Editar registros'),
  ('can_delete', 'general', 'Excluir registros'),
  ('can_view_passwords', 'security', 'Visualizar dados sensiveis'),
  ('can_manage_users', 'security', 'Gerenciar usuarios'),
  ('manage_company', 'security', 'Administrar empresa e memberships')
ON CONFLICT (code) DO NOTHING;

COMMIT;
```

## Componentes da Migration 001

### Tabelas

- `profiles`
- `companies`
- `permissions`
- `roles`
- `role_permissions`
- `company_memberships`
- `audit_logs`

### Funcoes

- `auth_user_id()`
- `current_company_id()`
- `is_company_member(uuid)`
- `has_company_permission(uuid, text)`
- `is_company_admin(uuid)`

### Indices

- `idx_profiles_login_name`
- `idx_companies_status`
- `idx_companies_document_number`
- `idx_company_memberships_user_id`
- `idx_company_memberships_company_status`
- `idx_company_memberships_user_status`
- `idx_company_memberships_default_per_user`
- `idx_roles_company_id`
- `idx_roles_company_admin`
- `idx_role_permissions_permission_id`
- `idx_audit_logs_company_created_at`
- `idx_audit_logs_actor_created_at`
- `idx_audit_logs_action_created_at`
- `idx_audit_logs_request_id`

### Constraints

- `companies_slug_unique`
- `companies_status_check`
- `permissions_code_unique`
- `roles_company_name_unique`
- `roles_scope_check`
- `company_memberships_company_user_unique`
- `company_memberships_status_check`
- `audit_logs_severity_check`

### Grants

- sem acesso para `anon`
- grants minimos para `authenticated`
- `companies` nao deve ser criada por usuario final

### Policies

- `profiles_select_self`
- `profiles_insert_self`
- `profiles_update_self`
- `permissions_select_authenticated`
- `companies_select_member`
- `companies_update_admin`
- `roles_select_member`
- `roles_insert_admin`
- `roles_update_admin`
- `roles_delete_admin`
- `role_permissions_select_member`
- `role_permissions_insert_admin`
- `role_permissions_delete_admin`
- `memberships_select_member`
- `memberships_insert_admin`
- `memberships_update_admin`
- `memberships_delete_admin`
- `audit_logs_select_admin`

### Seed

- catalogo inicial de permissoes, incluindo `manage_company`

## Ordem de execucao

1. `BEGIN`
2. extensoes
3. funcoes auxiliares de auth/tenant
4. tabelas
5. indices
6. funcoes de membership/permissao/admin
7. `ENABLE ROW LEVEL SECURITY`
8. policies
9. `REVOKE`
10. `GRANT`
11. seed de permissoes
12. `COMMIT`

## Testes de seguranca propostos

### Profiles

- usuario consegue inserir o proprio `profile` no primeiro acesso;
- usuario nao consegue inserir `profile` de outro usuario;
- usuario so le e atualiza o proprio `profile`.

### Sem membership

- usuario autenticado sem linha em `company_memberships`:
  - nao lista `companies`
  - nao lista `roles`
  - nao lista `company_memberships`
  - nao le `audit_logs`

### Com membership da empresa A

- le apenas `companies.id = A`;
- nao consegue ler ou atualizar `companies.id = B`;
- nao consegue inserir `roles` para `company_id = B`;
- nao consegue inserir `company_memberships` em `company_id = B`.

### Admin da empresa A

- consegue criar role em `A`;
- consegue associar usuario a empresa `A`;
- nao consegue administrar empresa `B`.

### Acesso direto por ID

- `select * from companies where id = <empresa_b>` retorna 0 linhas;
- `update companies set ... where id = <empresa_b>` falha ou afeta 0 linhas;
- `delete from company_memberships where company_id = <empresa_b>` falha ou afeta 0 linhas;
- `select * from audit_logs where company_id = <empresa_b>` retorna 0 linhas para admin de `A`.

### Roles administrativas

- role com `is_company_admin=false` e sem `manage_company` nao administra memberships;
- role com `manage_company` administra memberships;
- roles de sistema nao podem ser alteradas nem removidas por usuarios finais.

## Rollback completo proposto

```sql
BEGIN;

DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;

DROP POLICY IF EXISTS memberships_delete_admin ON public.company_memberships;
DROP POLICY IF EXISTS memberships_update_admin ON public.company_memberships;
DROP POLICY IF EXISTS memberships_insert_admin ON public.company_memberships;
DROP POLICY IF EXISTS memberships_select_member ON public.company_memberships;

DROP POLICY IF EXISTS role_permissions_delete_admin ON public.role_permissions;
DROP POLICY IF EXISTS role_permissions_insert_admin ON public.role_permissions;
DROP POLICY IF EXISTS role_permissions_select_member ON public.role_permissions;

DROP POLICY IF EXISTS roles_delete_admin ON public.roles;
DROP POLICY IF EXISTS roles_update_admin ON public.roles;
DROP POLICY IF EXISTS roles_insert_admin ON public.roles;
DROP POLICY IF EXISTS roles_select_member ON public.roles;

DROP POLICY IF EXISTS companies_update_admin ON public.companies;
DROP POLICY IF EXISTS companies_select_member ON public.companies;

DROP POLICY IF EXISTS permissions_select_authenticated ON public.permissions;

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;

DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.company_memberships;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.companies;
DROP TABLE IF EXISTS public.profiles;

DROP FUNCTION IF EXISTS public.is_company_admin(uuid);
DROP FUNCTION IF EXISTS public.has_company_permission(uuid, text);
DROP FUNCTION IF EXISTS public.is_company_member(uuid);
DROP FUNCTION IF EXISTS public.current_company_id();
DROP FUNCTION IF EXISTS public.auth_user_id();

COMMIT;
```

## Pedido final de revisao

Com base em tudo acima, quero que voce me diga:

- se esta versao final da `Migration 001` esta pronta para seguir para implementacao controlada;
- o que obrigatoriamente deve ser corrigido antes de aplicar;
- o que e apenas melhoria recomendada;
- se ha algum risco serio de seguranca, bloqueio operacional ou problema de modelagem fundacional.
