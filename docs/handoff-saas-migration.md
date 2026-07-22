# Handoff SaaS Migration

## Estado atual

Trabalho em andamento na branch:

- `saas-migration`

Projeto Supabase de teste vinculado:

- nome: `Fenix Saas`
- `project_ref`: `jmnzwbiyfehexfvmdkbt`

CLI confirmado:

- `supabase.cmd 2.109.1`

## O que ja foi feito

### Migrations SaaS criadas localmente

- `supabase/migrations/20260713000002_saas_foundation.sql`
- `supabase/migrations/20260713000003_company_config_storage.sql`
- `supabase/migrations/20260713000004_customers_quotes_appointments_kits.sql`
- `supabase/migrations/20260713000005_products_inventory.sql`
- `supabase/migrations/20260713000006_service_orders.sql`
- `supabase/migrations/20260713000007_sales_financial_entries_idempotency.sql`

### Rollbacks locais criados

- `supabase/migrations/rollback_20260713000002_saas_foundation.sql`
- `supabase/migrations/rollback_20260713000003_company_config_storage.sql`
- `supabase/migrations/rollback_20260713000004_customers_quotes_appointments_kits.sql`
- `supabase/migrations/rollback_20260713000005_products_inventory.sql`
- `supabase/migrations/rollback_20260713000006_service_orders.sql`
- `supabase/migrations/rollback_20260713000007_sales_financial_entries_idempotency.sql`

### Migrations aplicadas no projeto de teste

Aplicadas manualmente no banco remoto de teste:

- `20260713000002`
- `20260713000003`
- `20260713000004`
- `20260713000005`
- `20260713000006`
- `20260713000007`

### Migration legada

Existe localmente:

- `supabase/migrations/20260708000001_init_fenix_app_storage.sql`

Nao foi aplicada no projeto Supabase de teste e nao foi marcada no historico remoto.

## Historico remoto de migrations

Estado final confirmado com `supabase.cmd migration list`:

- `20260708000001`
  - local: presente
  - remote: vazio
  - correto
- `20260713000002`
  - local: presente
  - remote: presente
- `20260713000003`
  - local: presente
  - remote: presente
- `20260713000004`
  - local: presente
  - remote: presente
- `20260713000005`
  - local: presente
  - remote: presente
- `20260713000006`
  - local: presente
  - remote: presente
- `20260713000007`
  - local: presente
  - remote: presente

## Validacoes ja concluidas

### Migration 001

Validado no projeto de teste:

- tabelas
- funcoes
- indices
- RLS
- policies
- seed de permissoes
- grants corrigidos

Observacao:

- os `GRANT`s da fundacao foram endurecidos
- `anon` ficou sem acesso
- `authenticated` ficou apenas com os privilegios esperados

### Migration 002

Validado no projeto de teste:

- `company_settings`
- `company_branding`
- RLS nas duas tabelas
- policies publicas
- grants corretos
- buckets privados de Storage
- policies em `storage.objects`

Buckets criados:

- `company-assets`
- `service-order-files`
- `customer-files`

### Migration 003

Validado no projeto de teste:

- `customers`
- `appointments`
- `quotes`
- `quote_items`
- `kits`
- `kit_items`
- RLS ativa nas 6 tabelas
- policies por modulo
- grants corretos
- indices esperados

### Migration 004

Validado no projeto de teste:

- `products`
- `inventory_movements`
- RLS ativa nas 2 tabelas
- policies por modulo
- grants corretos
- indices esperados

Detalhes confirmados:

- `products`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants
- `inventory_movements`
  - `authenticated`: `SELECT`, `INSERT`
  - `anon`: sem grants
- policies criadas:
  - `products_select_inventory`
  - `products_insert_inventory`
  - `products_update_inventory`
  - `products_delete_inventory`
  - `inventory_movements_select_inventory`
  - `inventory_movements_insert_inventory`

### Migration 005

Validado no projeto de teste:

- `service_orders`
- `service_order_items`
- `service_order_payments`
- `service_order_notes`
- `service_order_history`
- `service_order_views`
- RLS ativa nas 6 tabelas
- policies por modulo
- grants corretos
- indices esperados

Detalhes confirmados:

- `service_orders`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants
- `service_order_items`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants
- `service_order_payments`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants
- `service_order_notes`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants
- `service_order_history`
  - `authenticated`: `SELECT`, `INSERT`
  - `anon`: sem grants
- `service_order_views`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants

### Migration 006

Validado no projeto de teste:

- `sales`
- `sale_items`
- `financial_entries`
- `idempotency_keys`
- RLS ativa nas 4 tabelas
- policies por modulo
- grants corretos
- indices esperados

Detalhes confirmados:

- `sales`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants
- `sale_items`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants
- `financial_entries`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants
- `idempotency_keys`
  - `authenticated`: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
  - `anon`: sem grants

## Arquivos importantes para retomar

Documentacao:

- `STATUS.md`
- `docs/plano-migracao-saas.md`
- `docs/chatgpt-migration-001-review.md`
- `docs/handoff-saas-migration.md`

Tipos e helpers SaaS:

- `src/types/saas.ts`
- `src/lib/server/supabase-admin.ts`
- `src/lib/server/supabase-user.ts`
- `src/lib/server/tenant-context.ts`
- `src/lib/server/audit.ts`

## Decisoes tecnicas ja fechadas

- autenticacao primaria: email no Supabase Auth
- `login_name`: apenas metadado de compatibilidade
- `active_company_id`: claim explicito em `app_metadata`
- nenhuma rota de usuario final pode usar `service_role`
- `companies` so podem ser criadas por bootstrap administrativo ou ferramenta interna
- dual-write deve ser evitado sempre que possivel
- `Migration 003` foi feita sem dual-write
- IDs da `Migration 003` foram mantidos em `text` para facilitar importacao do legado

## Problemas ou observacoes abertas

- Os arquivos de rollback estao dentro de `supabase/migrations`.
- O Supabase CLI ignora esses arquivos, mas mostra mensagens `Skipping migration rollback_...`.
- Melhor ajuste futuro:
  - mover rollbacks para uma pasta separada, por exemplo `supabase/rollbacks/`

- O projeto de teste Supabase nao tem `app_records` nem `app_singletons`.
- Portanto, nele a validacao foi apenas do schema SaaS.

## Ponto exato onde paramos

Terminamos a consolidacao da base SaaS inicial no projeto de teste e validamos tambem a `Migration 006`:

- fundacao SaaS pronta e validada
- configuracao/branding/storage prontos e validados
- customers/appointments/quotes/kits prontos e validados
- products/inventory_movements prontos e validados
- service_orders e tabelas derivadas prontas e validadas
- sales/financial_entries/idempotency_keys prontos e validados
- historico remoto de migrations alinhado para as migrations SaaS aplicadas

Arquivos criados nesta retomada:

- `supabase/migrations/20260713000005_products_inventory.sql`
- `supabase/migrations/rollback_20260713000005_products_inventory.sql`
- `supabase/migrations/20260713000006_service_orders.sql`
- `supabase/migrations/rollback_20260713000006_service_orders.sql`
- `supabase/migrations/20260713000007_sales_financial_entries_idempotency.sql`
- `supabase/migrations/rollback_20260713000007_sales_financial_entries_idempotency.sql`

Tipos SaaS atualizados para a etapa:

- `ProductRecord`
- `InventoryMovementRecord`
- `InventoryMovementType`
- `ServiceOrderRecord`
- `ServiceOrderItemRecord`
- `ServiceOrderPaymentRecord`
- `ServiceOrderNoteRecord`
- `ServiceOrderHistoryRecord`
- `ServiceOrderViewRecord`
- `ServiceOrderStatus`
- `SaleRecord`
- `SaleItemRecord`
- `FinancialEntryRecord`
- `FinancialEntryType`
- `FinancialEntryStatus`
- `IdempotencyKeyRecord`
- `IdempotencyKeyStatus`
- `SaleStatus`

Ainda nao iniciamos no projeto Supabase de teste:

- integracao de runtime SaaS no app
- bootstrap da primeira empresa e memberships
- estrategia operacional de backfill/importacao
- fase de compatibilidade controlada dos modulos sensiveis

Avanco inicial ja concluido no runtime:

- camada de sessao hibrida adicionada no servidor
- leitura opcional de sessao Supabase por cookie adicionada
- `tenantContext` derivado de `app_metadata.active_company_id`
- `/api/auth/session` agora responde tambem:
  - `authSource`
  - `tenantContext`
  - `supabaseUser`
- logout agora limpa tambem cookies reservados da sessao Supabase

Limitacao atual proposital:

- sessao Supabase isolada ainda nao libera acesso ao shell legado
- o gate principal do app continua sendo a sessao legada
- isso foi mantido para nao abrir permissao indevida antes da integracao completa de auth e autorizacao SaaS

## Proximo passo recomendado

Iniciar a etapa de integracao controlada com o app.

Escopo esperado:

- tenant context real no runtime
- autenticacao Supabase no app
- bootstrap administrativo da primeira empresa
- definicao do primeiro backfill/import por modulo

Cuidados dessa etapa:

- nenhuma rota de usuario final deve usar `service_role`
- manter o legado de producao intacto enquanto a integracao SaaS ainda nao for a fonte oficial
- iniciar por leitura/autenticacao/contexto antes de dual-write de modulos

Observacao importante da modelagem atual:

- `financial_entries` ficou protegida por `access_financials`
- `sales` e `sale_items` ficaram protegidas por `access_sales`
- `idempotency_keys` aceita `access_sales` ou `access_financials`
- na futura integracao de runtime isso precisa ser respeitado no desenho do fluxo de escrita

Arquivos relevantes desta etapa de runtime:

- `src/lib/server/supabase-session.ts`
- `src/lib/server/session.ts`
- `src/app/api/auth/session/route.ts`
- `src/app/api/auth/logout/route.ts`

Decisoes de modelagem adotadas localmente nesta etapa:

- `service_orders.id` mantido em `text`
- `service_order_items` preserva `legacy_item_id`
- `service_order_payments.id` mantido em `text`
- `service_order_views` foi modelada por usuario com `user_id`
- `service_order_history` foi modelada como trilha append-only

## Comandos uteis para retomar

Ver branch atual:

```powershell
git branch --show-current
```

Ver estado das migrations:

```powershell
supabase.cmd migration list
```

Ver alteracoes locais:

```powershell
git status --short
```

Typecheck:

```powershell
npm.cmd run typecheck
```

## Se quiser retomar exatamente daqui

Ordem recomendada:

1. Confirmar branch `saas-migration`
2. Ler `STATUS.md`
3. Ler este arquivo `docs/handoff-saas-migration.md`
4. Confirmar `supabase.cmd migration list`
5. Comecar a integracao controlada do runtime SaaS
