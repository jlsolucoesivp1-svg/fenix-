# Plano de Migracao SaaS Multiempresa

## Objetivo

Migrar o projeto Fenix atual de uma arquitetura single-tenant baseada em `app_records` e `app_singletons` para uma arquitetura SaaS multiempresa no Supabase, com:

- isolamento estrito por empresa;
- RLS habilitada desde o nascimento de todas as tabelas empresariais;
- onboarding de novos tenants;
- migracao incremental com compatibilidade temporaria apenas onde necessario;
- trilha de auditoria e rollback por etapa.

## Estado atual resumido

O app web atual:

- usa Next.js com API própria;
- autentica com cookie de sessao customizado;
- armazena dados em Postgres generico via JSONB;
- concentra os dados de negocio em:
  - `app_records`
  - `app_singletons`
- nao possui `company_id`, RLS nem contexto nativo de tenant.

## Principios da migracao

- Nenhuma tabela SaaS nova deve nascer exposta.
- Toda tabela empresarial nova deve nascer com `RLS ENABLED`.
- Nao usar policy permissiva temporaria em tabelas empresariais.
- `service_role` somente em bootstrap, backfill, reconciliação e operacoes administrativas controladas.
- Cada modulo em dual-write deve ter uma unica fonte oficial por fase.
- Nao fazer dual-write bidirecional.
- Nenhum segredo deve ser versionado no Git.

## Status da implementacao

### Etapa 1 em preparacao local

- branch de trabalho: `saas-migration`
- escopo atual: apenas `Migration 001` e arquivos locais de suporte
- proibido nesta etapa:
  - executar SQL
  - aplicar migration no Supabase
  - alterar banco remoto
  - integrar `service_role` em rota de usuario final

### Definicoes fechadas para a Migration 001

- autenticacao primaria: email no Supabase Auth
- `login_name`: metadado opcional de compatibilidade, nao identidade primaria
- `active_company_id`: claim explicito em `app_metadata`
- criacao de `companies`: somente via bootstrap administrativo ou ferramenta interna
- papeis administrativos: definidos por `is_owner`, `roles.is_company_admin` ou permissao `manage_company`
- `audit_logs`: incluir `request_id`, `success` e `severity`

## Tenant padrao para desenvolvimento e teste

### Development

- Tenant logico: `Fenix Dev Tenant`.
- Permitido apenas quando `NODE_ENV != 'production'`.
- Se o usuario tiver uma unica membership ativa, esta empresa pode ser usada automaticamente.
- Se nao tiver membership e `ALLOW_DEV_DEFAULT_TENANT=true`, o bootstrap local pode associar o usuario a um tenant padrao.
- Se tiver mais de uma membership ativa, deve escolher explicitamente a empresa ativa.

### Test

- Cada suite deve criar tenants isolados.
- Nenhum tenant de teste deve ser compartilhado entre cenarios.
- Nao usar fallback silencioso entre testes.

### Production

- Nao existe tenant padrao.
- Usuario sem membership ativa nao acessa dados empresariais.
- Empresa inativa bloqueia todos os modulos empresariais.

## Comportamento de acesso

### Usuario sem membership valida

- pode autenticar no Supabase;
- nao pode acessar area empresarial;
- recebe resposta de bloqueio controlada;
- evento auditado.

### Usuario com membership inativa ou revogada

- sessao continua autenticada;
- acesso tenant-scoped negado;
- evento auditado.

### Usuario com empresa ativa invalida

- empresa ativa da sessao deve ser invalidada;
- se houver outra membership valida, o sistema deve exigir nova selecao;
- se nao houver, usuario permanece bloqueado;
- evento auditado.

### Empresa inativa

- toda leitura e escrita empresarial deve falhar;
- evento auditado.

## Arquitetura alvo

- `auth.users`: identidade primaria.
- `public.profiles`: perfil global do usuario.
- `public.companies`: tenant raiz.
- `public.company_memberships`: relacao usuario x empresa.
- `public.roles`: papeis por empresa e templates de sistema.
- `public.permissions`: catalogo global de permissoes.
- `public.role_permissions`: relacao papel x permissao.
- tabelas de negocio sempre com `company_id`.
- buckets privados no Supabase Storage por empresa.

## Modelo de dados alvo

### Tabelas globais

- `profiles`
- `permissions`
- `role_templates` ou papeis de sistema em `roles` com `company_id null`
- `feature_flags`
- `plan_catalog`

### Tabelas tenant-root

- `companies`
- `company_memberships`
- `company_settings`
- `company_branding`
- `subscriptions`

### Tabelas empresariais com `company_id`

- `roles`
- `customers`
- `products`
- `inventory_movements`
- `kits`
- `kit_items`
- `appointments`
- `quotes`
- `quote_items`
- `service_orders`
- `service_order_items`
- `service_order_notes`
- `service_order_history`
- `service_order_payments`
- `service_order_views`
- `sales`
- `sale_items`
- `financial_entries`
- `idempotency_keys`
- `audit_logs`

## Politicas RLS

### Regras base

- `SELECT`: apenas membros ativos da empresa.
- `INSERT`: apenas membros ativos na mesma `company_id`.
- `UPDATE`: apenas membros ativos da mesma empresa e conforme permissao.
- `DELETE`: apenas membros ativos da mesma empresa e conforme permissao.

### Funcoes auxiliares previstas

- `public.auth_user_id()`
- `public.current_company_id()`
- `public.is_company_member(uuid)`
- `public.is_company_admin(uuid)`
- `public.has_company_permission(uuid, text)`

### Regra para `current_company_id()`

- a funcao apenas le `auth.jwt() -> 'app_metadata' ->> 'active_company_id'`
- validacao real de acesso continua nas funcoes de membership e nas policies
- em producao nao existe fallback implicito para tenant padrao

### Tabelas administrativas

- `company_memberships`: leitura por membros; escrita por admin/owner.
- `roles`: leitura por membros; escrita por admin/owner.
- `company_settings`: leitura por membros autorizados; escrita por admin.
- `company_branding`: leitura por membros autorizados; escrita por admin.

### Tabelas operacionais por permissao

- `customers`: `access_clients`
- `products`, `kits`, `inventory_movements`: `access_inventory`
- `service_orders` e derivados: `access_service_orders`
- `sales`, `sale_items`: `access_sales`
- `financial_entries`: `access_financials`
- `appointments`: `access_agenda`
- `quotes`, `quote_items`: `access_quotes`

## Storage por empresa

### Buckets previstos

- `company-assets`
- `service-order-files`
- `customer-files`

### Estrutura de path

- `{company_id}/branding/...`
- `{company_id}/service-orders/{service_order_id}/...`
- `{company_id}/customers/{customer_id}/...`

### Regras

- bucket privado;
- acesso validado contra `company_id` no path;
- upload e download apenas para usuarios com membership valida;
- logo e audio deixam de ser base64 no banco e passam a ser paths/objetos do Storage.

## Mapeamento do legado para o novo modelo

### Singletons

- `companyInfo.name` -> `companies.trade_name`
- `companyInfo.document` -> `companies.document_number`
- `companyInfo.address` -> `company_branding.address`
- `companyInfo.phone` -> `company_branding.phone`
- `companyInfo.emailOrSite` -> `company_branding.email_or_site`
- `companyInfo.pixKey` -> `company_branding.pix_key`
- `companyInfo.logoUrl` -> `company_branding.logo_path`
- `companyInfo.notificationSoundUrl` -> `company_branding.notification_sound_path`
- `settings.defaultWarrantyDays` -> `company_settings.default_warranty_days`

### Users

- `users[].name` -> `profiles.full_name`
- `users[].login` -> `profiles.login_name` e estrategia de login no `auth.users`
- `users[].permissions.*` -> `roles + role_permissions`

### Customers

- `customers[].id` -> `customers.id`
- `customers[].name` -> `customers.full_name`
- `customers[].phone` -> `customers.phone_1`
- `customers[].email` -> `customers.email`
- `customers[].address` -> `customers.address_line`
- `customers[].document` -> `customers.document_number`
- `customers[].cep` -> `customers.zip_code`

### Stock / Products

- `stock[].id` -> `products.id`
- `stock[].name` -> `products.name`
- `stock[].description` -> `products.description`
- `stock[].category` -> campo de classificacao futuro ou atributo complementar
- `stock[].quantity` -> `products.stock_quantity`
- `stock[].price` -> `products.sale_price`
- `stock[].costPrice` -> `products.cost_price`
- `stock[].minStock` -> `products.min_stock_quantity`
- `stock[].barcode` -> `products.barcode`
- `stock[].unitOfMeasure` -> `products.unit_name`

### Kits

- `kits[].id` -> `kits.id`
- `kits[].name` -> `kits.name`
- `kits[].items[]` -> `kit_items`

### Appointments

- `appointments[].*` -> `appointments.*`

### Quotes

- `quotes[].*` -> `quotes`
- `quotes[].items[]` -> `quote_items`

### Service Orders

- `serviceOrders[].id` -> `service_orders.id`
- `serviceOrders[].customerId` -> `service_orders.customer_id`
- `serviceOrders[].date` -> `service_orders.opened_at`
- `serviceOrders[].deliveredDate` -> `service_orders.delivered_at`
- `serviceOrders[].status` -> `service_orders.status_code`
- `serviceOrders[].reportedProblem` -> `service_orders.reported_issue`
- `serviceOrders[].technicalReport` -> `service_orders.technical_report`
- `serviceOrders[].accessories` -> `service_orders.accessories`
- `serviceOrders[].serialNumber` -> `service_orders.serial_number`
- `serviceOrders[].items[]` -> `service_order_items`
- `serviceOrders[].payments[]` -> `service_order_payments`
- `serviceOrders[].internalNotes` -> `service_order_notes`

### Sales

- `sales[].*` -> `sales`
- `sales[].items[]` -> `sale_items`

### Financial

- `financialTransactions[].*` -> `financial_entries`

## Dual-write

## Regra central

Em qualquer fase de compatibilidade temporaria:

- existe uma unica fonte oficial de dados;
- o outro lado funciona como espelho;
- falha no espelho nao pode corromper a fonte oficial;
- toda operacao espelhada precisa ser idempotente;
- reconciliacao obrigatoria antes do corte.

### Modulos que podem migrar direto sem dual-write obrigatorio

- `company_settings`
- `company_branding`
- `customers`
- `appointments`
- `quotes`
- `kits`
- `service_order_views`
- `profiles`
- `company_memberships`
- `roles`
- `permissions`

### Modulos que exigem compatibilidade temporaria

- `products`
- `inventory_movements`
- `service_orders`
- `service_order_items`
- `service_order_payments`
- `sales`
- `sale_items`
- `financial_entries`

### Fases do dual-write

#### Fase A

- criar schema novo;
- executar backfill inicial;
- manter leitura e escrita oficiais no legado.

#### Fase B

- request grava no legado;
- apos commit oficial, grava espelho no modelo novo;
- registrar `idempotency_keys` e `audit_logs`.

#### Fase C

- executar leitura paralela e reconciliacao invisivel;
- comparar contagens, totais e consistencia por empresa.

#### Fase D

- trocar leitura oficial para o modelo novo;
- manter escrita legado apenas se algum modulo ainda depender.

#### Fase E

- desligar escrita no legado;
- congelar compatibilidade;
- preparar remocao do legado.

### Tratamento de falhas

- falha na fonte oficial: request falha.
- falha no espelho: request pode concluir, mas deve:
  - registrar log de auditoria;
  - registrar item de reconciliacao;
  - permitir reprocessamento idempotente.

### Idempotencia

Chave recomendada:

- `company_id + scope + operation_id`

Scopes esperados:

- `stock.entry`
- `stock.save`
- `service_order.save`
- `service_order.finalize`
- `service_order.delete`
- `sale.finalize`
- `sale.reverse`
- `financial.manual`

### Criterios para desligamento

- 2 ciclos completos de reconciliacao sem divergencia material;
- testes de isolamento aprovados;
- testes de acesso por ID aprovados;
- backup e rollback validados;
- aceite formal do modulo.

## Primeira empresa

### Bootstrap da empresa atual

- criar `companies` com os dados do singleton atual;
- criar `company_settings`;
- criar `company_branding`;
- criar `profiles` para usuarios atuais;
- criar memberships para todos os usuarios atuais;
- marcar o administrador principal como `owner`;
- criar role `Administrador Inicial` e mapear permissoes equivalentes.

### Regras

- nenhum usuario legado deve ficar sem associacao;
- nenhum usuario pode entrar no tenant sem membership ativa;
- empresa inicial deve concentrar todo o acervo legado do sistema atual.

## Novo cliente SaaS

### Fluxo de onboarding

- criar `company`;
- criar usuario admin no `auth.users`;
- criar `profile`;
- criar role admin padrao;
- criar `company_membership`;
- criar `company_settings`;
- criar `company_branding`;
- criar `subscription`;
- registrar `audit_logs`.

## Auditoria

### Eventos minimos

- login aceito
- login negado
- ausencia de membership
- membership inativa
- empresa inativa
- troca de empresa ativa
- criacao de tenant
- criacao de admin inicial
- alteracao de membership
- alteracao de roles/permissoes
- exportacao de backup
- restore/importacao
- reconciliacao com divergencia
- rollback de modulo
- corte de dual-write
- operacoes criticas de OS, venda, financeiro e estoque

## Testes de isolamento

### Listagem

- usuario da empresa A lista apenas dados da empresa A;
- usuario da empresa B lista apenas dados da empresa B.

### Acesso direto por ID

- usuario A nao pode buscar `customer.id` da empresa B;
- usuario A nao pode buscar `service_order.id` da empresa B;
- usuario A nao pode buscar `sale.id` da empresa B;
- usuario A nao pode atualizar ou excluir registros da empresa B por ID;
- usuario A nao pode acessar assets do path da empresa B.

### Membership e tenant ativo

- membership inativa bloqueia imediatamente;
- empresa inativa bloqueia imediatamente;
- `active_company_id` invalida bloqueia e gera auditoria.

## Plano operacional por migration

### Migration 001 - Foundation SaaS

#### Objetivo

Criar a fundacao segura:

- extensoes;
- funcoes auxiliares;
- `profiles`;
- `companies`;
- `permissions`;
- `roles`;
- `role_permissions`;
- `company_memberships`;
- `audit_logs`;
- RLS e policies restritivas.

#### Entregaveis locais desta etapa

- migration SQL local de fundacao SaaS
- tipos `src/types/saas.ts`
- helpers locais:
  - `src/lib/server/supabase-admin.ts`
  - `src/lib/server/supabase-user.ts`
  - `src/lib/server/tenant-context.ts`
  - `src/lib/server/audit.ts`
- atualizacao de `.env.example` sem segredos

#### Dependencias

- `auth.users`

#### Riscos

- policy bloqueando bootstrap;
- desenho inadequado de roles globais;
- grants excessivos.

#### Aceite

- RLS ativa em todas as novas tabelas;
- usuario autenticado sem membership nao acessa dados empresariais;
- bootstrap administrativo continua viavel.

#### Rollback

- remover apenas schema novo se ainda sem uso;
- nao tocar no legado.

### Migration 002 - Company Config + Storage

#### Objetivo

Criar:

- `company_settings`
- `company_branding`
- buckets e policies de storage

#### Dependencias

- `companies`
- funcoes de tenant
- schema `storage`

#### Riscos

- policy de storage mal configurada;
- coexistencia incorreta com base64 legado.
- path de objeto sem `company_id` na primeira pasta quebrar o acesso esperado

#### Aceite

- leitura e escrita isoladas por empresa;
- branding e settings preparados para substituir singletons.
- buckets privados definidos:
  - `company-assets`
  - `service-order-files`
  - `customer-files`
- policies de Storage restritas por `bucket_id`, `company_id` no path e permissao de modulo

#### Rollback

- voltar leitura para `companyInfo/settings` no legado.
- remover policies de Storage e buckets criados nesta etapa.

### Migration 003 - Customers, Quotes, Appointments, Kits

#### Objetivo

Migrar modulos de menor acoplamento sem dual-write obrigatorio.

#### Escopo relacional desta etapa

- `customers`
- `appointments`
- `quotes`
- `quote_items`
- `kits`
- `kit_items`

#### Decisao de modelagem desta etapa

- IDs em `text` para facilitar importacao direta dos identificadores legados atuais
- FKs compostas por `company_id + id` nos relacionamentos principais onde isso reforca isolamento
- sem dual-write nesta etapa, conforme plano aprovado

#### Dependencias

- migrations 001 e 002

#### Riscos

- busca textual;
- itens manuais em quotes.

#### Aceite

- CRUD isolado por empresa;
- busca por cliente respeita tenant;
- acesso direto por ID entre empresas bloqueado.
- grants restritos a `authenticated`
- `anon` sem grants nas tabelas desta etapa

#### Rollback

- voltar leitura e escrita ao legado por feature flag.
- remover as tabelas tenant-scoped desta etapa no projeto de teste, se necessario

### Migration 004 - Products + Inventory

#### Objetivo

Criar `products` e `inventory_movements` com dual-write.

#### Dependencias

- foundation pronta

#### Fonte oficial inicial

- legado `stock`

#### Riscos

- divergencia entre saldo e movimentos;
- duplicidade por reprocessamento.

#### Aceite

- espelho consistente;
- reconciliacao por produto aprovada.

#### Rollback

- desligar espelho e manter legado como oficial.

### Migration 005 - Service Orders

#### Objetivo

Criar:

- `service_orders`
- `service_order_items`
- `service_order_notes`
- `service_order_history`
- `service_order_payments`
- `service_order_views`

#### Fonte oficial inicial

- legado `serviceOrders`

#### Riscos

- notas heterogeneas;
- itens sem produto;
- numeracao por empresa.

#### Aceite

- leitura paralela consistente;
- historico e pagamentos corretos;
- acesso por ID entre empresas bloqueado.

#### Rollback

- manter legado como oficial;
- desligar espelho se necessario.

### Migration 006 - Sales + Financial

#### Objetivo

Criar:

- `sales`
- `sale_items`
- `financial_entries`
- `idempotency_keys`

#### Fonte oficial inicial

- legado `sales` e `financialTransactions`

#### Riscos

- estorno;
- parcelamento;
- dependencia cruzada com estoque e OS.

#### Aceite

- reconciliacao por venda e financeiro aprovada;
- acesso por ID entre empresas bloqueado;
- idempotencia validada.

#### Rollback

- cortar espelho e manter legado oficial.

## Ordem exata da primeira migration

1. `BEGIN`
2. `CREATE EXTENSION IF NOT EXISTS pgcrypto`
3. `CREATE EXTENSION IF NOT EXISTS pg_trgm`
4. criar `auth_user_id()`
5. criar `current_company_id()`
6. criar `is_company_member(uuid)`
7. criar `is_company_admin(uuid)`
8. criar `profiles`
9. criar `companies`
10. criar `permissions`
11. criar `roles`
12. criar `role_permissions`
13. criar `company_memberships`
14. criar `audit_logs`
15. criar indices e constraints
16. habilitar RLS em todas as tabelas novas
17. criar policies restritivas
18. aplicar `REVOKE/GRANT` minimos
19. seed de `permissions`
20. `COMMIT`

## Checklist antes da primeira migration

- modelo de tenant aprovado
- estrategia de `active_company_id` aprovada
- tenant padrao de dev/test aprovado
- comportamento de usuario sem membership aprovado
- comportamento de empresa inativa aprovado
- tabela e eventos de auditoria aprovados
- buckets e policies de storage aprovados
- modulos com dual-write aprovados
- fonte oficial de cada modulo aprovada
- estrategia de idempotencia aprovada
- estrategia de reconciliacao aprovada
- plano de rollback por modulo aprovado
- variaveis de ambiente e segredos revisados
- confirmacao de que nenhum segredo sera versionado
- confirmacao formal de que nenhuma migration sera executada sem nova aprovacao

## Observacao final

Este documento e um plano de revisao e execucao controlada. Nenhuma migration, SQL, alteracao de codigo ou operacao no Supabase deve ser executada sem aprovacao especifica da etapa correspondente.
