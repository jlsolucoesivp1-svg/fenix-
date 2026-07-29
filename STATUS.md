# Status do Projeto Fenix SaaS

Atualizado em 2026-07-28 (America/Sao_Paulo).

## Auditoria de seguranca multiempresa - 2026-07-28

### Escopo e resultado

- Auditoria estatica concluida para migrations, 30 tabelas publicas, politicas RLS, funcoes SQL, Storage, 49 rotas de API, autenticacao/sessao, uso de `company_id` e dependencias de producao.
- Nao foi encontrada quebra confirmada de isolamento entre empresas nas tabelas SaaS, APIs SaaS ou Storage: os acessos usam token do usuario, `company_id` da sessao ativa e RLS baseada em membership/permissao.
- Nivel geral atual: **7/10**. O isolamento SaaS esta bem estruturado, mas ainda ha atualizacoes de dependencias de alto risco e testes de invasao com duas contas reais a executar.

### Vulnerabilidades encontradas e correcoes

1. **Media - tabelas legadas sem RLS explicita**
   - Local: `public.app_records` e `public.app_singletons`.
   - Risco: sao tabelas sem `company_id`; embora o papel `authenticated` nao tenha grants e o fluxo SaaS nao as use, a ausencia de RLS deixava uma defesa em profundidade incompleta contra futura exposicao pela Data API.
   - Correcao: migration `20260728000014_harden_legacy_app_storage.sql`, aplicada no Supabase remoto, habilitou RLS e revogou todos os privilegios de `anon` e `authenticated`.

2. **Critica/Alta - dependencias vulneraveis**
   - `jspdf` (critica), `jspdf-autotable`, `postcss`, `patch-package` e cadeia transitiva foram atualizados para versoes corrigidas; `next` foi atualizado de `15.5.20` para `15.5.22` e `ngrok` saiu da beta `5.0.0-beta.2` para `4.3.3`.
   - Resultado de `npm audit --omit=dev`: de **1 critica, 11 altas, 4 medias e 1 baixa** para **0 criticas, 9 altas e 2 medias**.
   - Pendencia: os alertas restantes dependem principalmente de cadeia transitiva/upgrade maior do Next e do ngrok; nao foi executado `npm audit fix --force` para evitar migracao nao validada de framework durante auditoria de seguranca.

### Controles confirmados

- Todas as 30 tabelas publicas declaradas nas migrations agora possuem RLS habilitada. As tabelas SaaS possuem policies de `SELECT`/`INSERT`/`UPDATE`/`DELETE` com `company_id`, membership e permissao; `platform_admins` e as tabelas legadas nao possuem policies permissivas e nao concedem acesso a usuarios.
- As funcoes `SECURITY DEFINER` de autorizacao usam `SET search_path = ''`, nao aceitam `company_id` sem revalidar membership e removem `EXECUTE` de `PUBLIC`.
- A RPC `finalize_saas_sale` fixa `search_path`, exige `auth.uid()`, permissao e `company_id`, e revalida cliente, produto, quote e valores antes de gravar.
- Os tres buckets privados possuem policies que obrigam o primeiro segmento do caminho a coincidir com `active_company_id` do JWT e exigem a permissao do modulo correspondente.
- Service role permanece somente em modulos de servidor; rotas que o usam validam a sessao, tenant e permissao/identidade de Platform Admin antes da operacao.

### Testes executados

- Inventario automatico de RLS/policies das migrations: aprovado para 30/30 tabelas.
- Revisao estatica de 49 rotas de API, funcoes de sessao, Storage e chamadas REST/RPC: sem acesso cruzado confirmado.
- `npm.cmd run typecheck`: aprovado.
- `npm.cmd run test -- --run`: aprovado, 20 testes.
- `npm.cmd run build`: aprovado apos atualizacao de dependencias.
- `npx.cmd supabase db push`: migration `20260728000014_harden_legacy_app_storage.sql` aplicada com sucesso.

### Pendencias de seguranca

- Executar teste E2E de IDOR com duas empresas e contas distintas, tentando leitura/escrita/exclusao cruzada em cada rota e bucket. Nao foi executado nesta sessao por nao haver duas credenciais de teste autenticadas disponiveis.
- Planejar atualizacao maior do Next e revisar a cadeia do ngrok para eliminar os 9 alertas altos restantes do `npm audit`; nao aplicar `--force` sem ciclo de compatibilidade dedicado.

## Sessao 2026-07-28 - PDV: A4 e venda sem cliente

### Problemas e causas encontradas

1. **Comprovante A4 em branco**
   - O caminho A4 reservava um `window.open()` vazio e, depois de operacoes assincronas, tentava abrir um PDF por `printWindow.location.href = doc.output('datauristring')`.
   - Nenhum HTML do comprovante era escrito nessa janela. A renderizacao e o `doc.autoPrint()` ficavam a cargo do visualizador de PDF associado ao `data:` URI, que pode nao navegar/acionar a impressao de um popup criado por script. Quando isso ocorria, a janela permanecia em `about:blank` e nenhuma janela nativa de impressao era aberta.
   - O problema nao era causado pela finalizacao da venda: a venda e seus itens ja estavam preservados em `saleToPrint` antes de `resetSale()`.

2. **Venda sem cliente**
   - A estrutura SaaS ja permite corretamente este caso: `sales.customer_id` e anulavel, a FK aceita `NULL`, a RPC `finalize_saas_sale` apenas valida o cliente quando um ID e informado, e as tipagens/payloads aceitam os campos opcionais.
   - Faltava padronizar a apresentacao e a descricao financeira para identificar a venda de balcao como `Consumidor Final` em vez de deixar o cliente sem exibicao ou usar `Nao identificado`.

### Correcoes realizadas

- Criado `src/components/sales/a4-sale-receipt.ts`, um documento HTML autocontido com CSS exclusivo A4 (`@page { size: A4 portrait; margin: 14mm; }`). Ele inclui empresa, venda, data/hora, cliente, itens, quantidades, valores unitarios, subtotais, desconto, pagamento, total e observacoes.
- O dialogo de comprovante agora escreve esse documento completo na janela reservada e fecha o documento antes de chamar automaticamente `window.print()` apos o proximo frame. A janela fecha apos `afterprint`, tanto ao concluir quanto ao cancelar, sem tocar na venda, estoque ou financeiro.
- A impressao termica 80 mm foi preservada e passou apenas a exibir `Consumidor Final` quando nao houver cliente.
- O dialogo de detalhes/historico tambem mostra `Consumidor Final` para venda sem cliente.
- A descricao do lancamento financeiro de venda sem cliente passou a usar `Cliente: Consumidor Final`.

### Banco de dados e isolamento

- Nenhuma migration nova foi necessaria. A migration `20260727000007_sales_financial_entries_idempotency.sql` ja define `sales.customer_id text` sem `NOT NULL`, com FK composta que aceita `NULL`.
- Nenhuma permissao, politica RLS, regra multiempresa ou RPC foi ampliada. A RPC continua validando o cliente somente quando informado e continua vinculada ao `company_id` ativo.

### Arquivos alterados nesta sessao

- `src/components/sales/a4-sale-receipt.ts` (novo).
- `src/components/sales/a4-sale-receipt.test.ts` (novo).
- `src/components/sales/sale-invoice-dialog.tsx`.
- `src/components/sales/thermal-sale-receipt.ts`.
- `src/components/sales/sale-details-dialog.tsx`.
- `src/lib/sales.ts`.
- `src/lib/sales.test.ts`.
- `STATUS.md`.

### Testes realizados e resultado

- `npm.cmd run test -- --run src/lib/sales.test.ts src/components/sales/a4-sale-receipt.test.ts`: **aprovado**, 2 arquivos e 8 testes. Cobertura adicionada para venda sem cliente/financeiro, A4 com `Consumidor Final`, A4 com cliente e presenca de `window.print()`/`afterprint`.
- `npm.cmd run typecheck`: **aprovado**.
- `npm.cmd run build`: **aprovado** antes dos ajustes finais de exibicao no historico; os ajustes finais tambem passaram no `typecheck`.
- `git diff --check`: **aprovado**.
- Validacao manual E2E no Preview `https://fenix-saas-67cwj65zi-jlsolucoesivp1-3372s-projects.vercel.app`: **aprovada pelo usuario**. Foram confirmados: impressao A4, impressao termica, venda sem cliente como `Consumidor Final`, venda com cliente, cancelamento da impressao, historico, baixa de estoque e lancamento financeiro.

### Situacao da correcao

- Correcao validada manualmente no Preview pelo usuario. Nao ha pendencias conhecidas para A4, termica ou vendas sem cliente nesta etapa.

## Resumo do dia

### Principais avancos

- A autenticacao foi consolidada em um unico fluxo baseado em Supabase Auth para Next.js SSR.
- O acesso passou a usar exclusivamente e-mail e senha; `login` e `login_name` deixaram de participar de cadastro, edicao e autenticacao.
- O banner visual de diagnostico de tenant foi removido do AppShell para deixar a interface final limpa.
- A integracao Estoque -> Financeiro foi concluida e validada manualmente no Preview.
- O cadastro de produto com estoque inicial agora reutiliza o mesmo fluxo de "Registrar Entrada", sem duplicar regras de movimento ou financeiro.
- A finalizacao de venda SaaS passou a ser totalmente transacional em uma unica RPC PostgreSQL.

### Problemas resolvidos

- O sistema deixou de manter o fluxo legado em paralelo para login de usuarios finais.
- O login deixou de resolver usuario por `profiles.login_name`.
- O banner que exibida dados internos de tenant, membership e permissoes nao aparece mais nas telas de usuarios finais.

### Decisoes de arquitetura

- Supabase Auth e a unica fonte de autenticacao da aplicacao.
- A arquitetura adotada usa `@supabase/ssr`, sessao por cookies e middleware SSR.
- O e-mail e a identidade unica de login; a coluna historica `login_name` permanece no banco, mas nao deve ser usada.
- Tenant, memberships, roles, permissoes e RLS continuam sendo a camada de autorizacao e isolamento por `company_id`.

## Autenticacao

### Implementado

- Refatoracao para autenticacao unica via Supabase Auth.
- Remocao da coexistencia com o fluxo legado; as rotas legadas de login e registro passaram a recusar uso.
- Implementacao de `@supabase/ssr` para clientes de servidor, middleware e manutencao de sessao por cookies.
- Middleware de sessao em `middleware.ts`, protegendo o fluxo SSR e renovando a sessao Supabase.
- Login exclusivamente por e-mail e senha em `/api/auth/supabase-login`.
- Remocao da resolucao por `profiles.login_name` e de fallbacks para login legado.
- Remocao de campos, textos, validacoes e payloads de Login nas telas e APIs de usuarios.
- Alteracao de senha pelo sistema.
- Recuperacao de senha pelo e-mail do Supabase e rota de callback/redefinicao de senha.
- Logout pelo Supabase Auth.

### Estado atual e pendencias

- Build da refatoracao de autenticacao foi concluido com sucesso e os deploys de Preview foram gerados.
- O ciclo ponta a ponta com uma conta real no Preview (criar usuario, login, trocar senha, logout, novo login e recuperar senha) ainda precisa de validacao manual final com acesso ao tenant/Supabase correto.
- Nao reintroduzir `login_name` nem o fluxo legado em novas correcoes.

## Interface

- Removido o banner de diagnostico SaaS do topo do AppShell, incluindo os textos “Tenant SaaS reconhecido”, contexto ativo, empresa, permissoes e membership.
- A logica interna de tenant, autenticacao, permissoes e memberships foi preservada; somente a exibicao visual foi retirada.
- Nao ficou espaco em branco no local em que o componente era renderizado.
- Commit relacionado: `ff468c9 refactor(ui): remove tenant debug banner from app shell`.

## Testes executados

Testes manuais informados e validados no fluxo multiempresa:

- Criacao de nova empresa: StarTech criada com sucesso.
- Criacao do administrador: concluida.
- Login: concluido com sucesso.
- Cadastro de cliente: concluido com sucesso.
- Cadastro de venda: concluido com sucesso.
- Recebimento financeiro: concluido com sucesso.
- Logout: concluido com sucesso.
- Login em outra empresa: concluido com sucesso.
- Confirmacao de isolamento entre empresas: concluida; dados e lancamentos nao ficaram visiveis entre tenants.

Resultado: isolamento multiempresa funcionando corretamente.

Testes tecnicos executados nesta sessao:

- `npm.cmd run build`: aprovado.
- `git diff --check`: aprovado.
- Preview do commit `d8d3a4a`: READY em `https://fenix-saas-kazbbd372-jlsolucoesivp1-3372s-projects.vercel.app`.

Marco importante: o isolamento entre empresas foi validado manualmente. Foram realizados testes completos com a empresa StarTech, incluindo criação da empresa, login, cadastro de clientes, vendas, financeiro, logout e acesso por outra empresa. Nenhum dado ficou visível entre tenants diferentes, confirmando que o isolamento multiempresa está funcionando corretamente.

## Integracao Estoque -> Financeiro

Status: concluida.

- O cadastro de produto com quantidade inicial e preco de custo reutiliza `registerSaasStockEntry`, o mesmo servico usado por "Registrar Entrada".
- Nao ha duplicacao de codigo para atualizar estoque, criar `inventory_movements` ou gerar a despesa.
- O estoque e atualizado corretamente e o movimento de inventario e criado.
- A despesa financeira correspondente e criada automaticamente em `financial_entries`.
- A validacao manual no Preview foi concluida com sucesso.

## Finalizacao transacional de vendas SaaS

Status: concluida e validada.

- Toda a gravacao de venda SaaS ocorre em uma unica RPC PostgreSQL (`finalize_saas_sale`).
- Usuario, `company_id`, permissoes, estoque, cliente, pagamento e valores sao validados antes da primeira gravacao.
- Nao ha mais risco de gravacao parcial entre venda, itens, estoque, `inventory_movements` e `financial_entries`.
- Testes aprovados: venda normal; estoque insuficiente; usuario sem permissao financeira; cliente de outra empresa; desconto invalido.

## Sessao atual - PDV SaaS e comprovantes de venda

### Resumo cronologico

1. Foi auditado o PDV para identificar desvios entre o caminho SaaS e o legado.
2. O caminho ativo do PDV foi consolidado para exigir sessao SaaS valida, `company_id` resolvido e APIs SaaS; nao ha fallback silencioso para `app_records` no fluxo do PDV.
3. A finalizacao foi consolidada na RPC PostgreSQL `finalize_saas_sale`, que ja havia sido criada para garantir atomicidade entre venda, itens, estoque, movimentos e financeiro.
4. As buscas de clientes e produtos foram deslocadas para o servidor, com filtro da empresa atual, RLS e protecao contra respostas assincronas fora de ordem.
5. O carrinho passou a distinguir produto real por `productId` e item manual por identificacao propria, impedindo uniao indevida por nome e baixa de estoque para item manual.
6. O autocomplete de produtos do PDV foi ajustado: selecao valida adiciona o item, fecha o dialogo e limpa a pesquisa; respostas tardias nao reabrem a lista.
7. Foi adicionada a preferencia empresarial de formato de comprovante e a impressao termica de 80 mm, preservando a versao A4.
8. A migration de formato de comprovante foi aplicada no Supabase vinculado, o build foi aprovado e um novo Preview foi publicado.

### Implementacoes concluidas

#### PDV exclusivamente SaaS

- O PDV agora opera pelo fluxo SaaS: sessao valida, empresa ativa e `company_id` sao pre-requisitos.
- Clientes e produtos do PDV usam exclusivamente APIs SaaS; o modulo nao utiliza `app_records` como fallback.
- A venda usa exclusivamente `/api/sales/finalize`, que delega a gravacao atomica para `finalize_saas_sale`.
- A RPC transacional valida usuario, empresa, permissoes, estoque, cliente, pagamento e valores antes da primeira gravacao. Se houver falha, nao ficam registros parciais em `sales`, `sale_items`, estoque, `inventory_movements` ou `financial_entries`.

#### Busca, carrinho e item manual

- Busca de clientes no servidor por nome, CPF/CNPJ, telefone/celular e e-mail, limitada a clientes ativos da empresa atual e protegida por RLS.
- Busca de produtos no servidor por nome, categoria e codigo de barras, limitada a produtos ativos da empresa atual e protegida por RLS.
- As duas buscas possuem controle de sequencia para que respostas antigas nao substituam a consulta mais recente.
- O carrinho usa `productId` explicito para produtos de estoque. Produtos com mesmo nome continuam separados quando possuem IDs diferentes.
- Item manual possui identificacao propria, nao depende de `productId`, nao e unido a produto real apenas pelo nome e nao movimenta estoque.
- A selecao valida de produto no autocomplete do PDV adiciona o item, fecha o modal/dialogo, limpa o termo pesquisado e nao reabre por resposta assincrona tardia. A soma de quantidade continua sendo feita por `productId`.

#### Comprovantes A4 e termico 80 mm

- Foi criada a preferencia `receipt_print_format` por empresa, com valores permitidos `a4` e `thermal_80mm`; empresas existentes recebem `a4` como padrao.
- A preferencia pertence a `company_settings`, portanto respeita `company_id`, RLS e as APIs `/api/tenant/settings` existentes.
- A tela de Configuracoes Gerais possui o campo **Formato padrao do comprovante de venda**, com as opcoes A4 e Termica 80 mm.
- O comprovante A4 existente foi preservado.
- Foi criada uma apresentacao especifica para bobina termica de 80 mm, em coluna unica, com quebra de nomes longos, totais historicos da venda, itens manuais e CSS de impressao com `@page { size: 80mm auto; margin: 2mm; }`.
- Depois da finalizacao, sao exibidas as opcoes do formato padrao e do formato alternativo. Ambas usam a mesma venda ja finalizada e seus itens historicos; trocar o formato nao chama `finalize_saas_sale`, nao cria venda, nao baixa estoque e nao gera lancamento financeiro adicional.

### Migrations executadas nesta etapa

| Migration | Finalidade | Status |
| --- | --- | --- |
| `20260727000012_finalize_saas_sale_atomically.sql` | Criar a RPC transacional de finalizacao SaaS e proteger todas as gravacoes da venda contra parcialidade. | Aplicada e validada anteriormente nesta sessao. |
| `20260727000013_add_receipt_print_format.sql` | Adicionar `company_settings.receipt_print_format`, padrao `a4` e `CHECK` para `a4`/`thermal_80mm`. | Aplicada e confirmada no Supabase remoto. |

### Arquivos alterados nesta etapa

#### Front-end e configuracoes

- `src/app/(app)/vendas/page.tsx` - PDV SaaS, carrinho por `productId` e integracao das buscas SaaS.
- `src/app/(app)/configuracoes/page.tsx` - seletor do formato padrao de comprovante da empresa.
- `src/components/configuracoes/page.tsx` - compatibilidade do tipo de configuracoes com o novo padrao A4.
- `src/lib/storage.ts` - leitura, escrita, cache e valor padrao de `receiptPrintFormat` pelas APIs do tenant.
- `src/types/index.ts` e `src/types/saas.ts` - tipo `ReceiptPrintFormat`, `AppSettings` e registro SaaS de configuracoes.

#### Componentes

- `src/components/sales/product-autocomplete.tsx` - busca de produtos no servidor e protecao contra resposta fora de ordem.
- `src/components/sales/manual-add-item-dialog.tsx` - fechamento controlado apos selecao valida no PDV, sem afetar outros modulos.
- `src/components/sales/sale-invoice-dialog.tsx` - selecao A4/termica e preservacao da geracao A4.
- `src/components/sales/thermal-sale-receipt.ts` - apresentacao e CSS de impressao do comprovante termico 80 mm.
- `src/components/customers/customer-autocomplete.tsx` - protecao contra respostas de busca fora de ordem.

#### Back-end e APIs

- `src/app/api/clientes/search/route.ts` - busca SaaS de clientes.
- `src/app/api/produtos/search/route.ts` - nova busca SaaS de produtos.
- `src/app/api/tenant/settings/route.ts` - validacao e persistencia de `receiptPrintFormat`.
- `src/lib/server/saas-customers.ts` - filtros de busca de clientes por empresa.
- `src/lib/server/saas-products.ts` - filtros de busca de produtos por empresa.
- `src/lib/server/saas-sales.ts` - finalizacao SaaS via RPC transacional.
- `src/lib/server/saas-company-settings.ts` - mapeamento e persistencia de configuracoes da empresa.
- `src/lib/server/saas-bootstrap.ts` - cria novas empresas com formato A4 padrao.
- `src/lib/sales.ts`, `src/lib/server/saas-financial.ts` e `src/lib/server/saas-quotes.ts` - ajustes de compatibilidade do fluxo SaaS realizados na consolidacao do PDV.

#### Banco de dados

- `supabase/migrations/20260727000012_finalize_saas_sale_atomically.sql`.
- `supabase/migrations/20260727000013_add_receipt_print_format.sql`.

### Testes executados

- `git diff --check`: aprovado, sem erros de espacos ou marcadores de conflito.
- `npm.cmd run build`: aprovado localmente apos a implementacao do comprovante termico.
- Build remoto da Vercel: aprovado.
- Preview publicado com status `READY`: `https://fenix-saas-nshek52n5-jlsolucoesivp1-3372s-projects.vercel.app`.
- Validacoes ja executadas na etapa transacional: venda normal; estoque insuficiente; usuario sem permissao financeira; cliente de outra empresa; desconto invalido.
- A validacao manual completa da impressao A4 e termica permanece pendente, conforme os pontos abaixo.

### Problemas encontrados na validacao manual do Preview

1. **Contraste inadequado do modal do comprovante** - pendente de correcao.
   - Sintoma: modal com fundo claro e textos praticamente ilegiveis em determinadas condicoes de tema/estilo.
   - Escopo futuro: corrigir apenas a apresentacao/contraste do dialogo, sem alterar dados historicos, finalizacao ou regras de impressao.

2. **Experiencia do dialogo de impressao no ambiente Web** - pendente de avaliacao.
   - O navegador ainda apresenta o dialogo nativo de impressao ao gerar o comprovante.
   - Limitacao tecnica: uma aplicacao Web nao pode selecionar automaticamente uma impressora fisica ou confirmar a impressao sem interacao do operador, por protecoes do navegador.
   - Sera avaliada uma melhoria de experiencia para tornar a escolha A4/termica e a abertura do dialogo mais claras, mantendo a limitacao de seguranca do navegador.

### Proxima etapa

1. Corrigir o contraste do modal do comprovante.
2. Refinar a experiencia de impressao no navegador.
3. Validar manualmente e de forma completa:
   - impressao A4;
   - impressao termica 80 mm;
   - venda com muitos itens;
   - venda com item manual;
   - largura real da bobina;
   - quebra de linhas em nome longo;
   - impressao em impressora termica real.
4. Apos a validacao manual aprovada, realizar commit, push e encerrar oficialmente esta etapa.

### Ambiente de retomada

- Branch atual: `rescue-saas-20260722`.
- Projeto Vercel: `fenix-saas` (`prj_jOJ2no5TmAhlaOWf9iv51b7RQGKr`).
- Projeto Supabase vinculado: `jmnzwbiyfehexfvmdkbt`.
- Preview atual: `https://fenix-saas-nshek52n5-jlsolucoesivp1-3372s-projects.vercel.app`.
- Ultima migration aplicada: `20260727000013_add_receipt_print_format.sql`.
- Nenhum commit foi criado para as alteracoes atuais do PDV e dos comprovantes.
- `STATUS.md` foi atualizado nesta etapa e deve ser incluido somente no commit documental final, apos a validacao manual.

### Estado da etapa

Esta etapa encontra-se praticamente concluida. Restam apenas os ajustes identificados durante a validacao manual do Preview: contraste do modal do comprovante e refinamento da experiencia de impressao. Apos corrigi-los e revalidar A4/termica, a etapa podera ser oficialmente encerrada com commit e push.

## Proxima prioridade

Corrigir o contraste do modal do comprovante e concluir a validacao manual completa da impressao A4 e termica 80 mm no Preview.

## Situacao geral do projeto

| Area | Situacao atual |
| --- | --- |
| Autenticacao | Arquitetura Supabase SSR implementada; validacao E2E final no Preview ainda pendente. |
| Multiempresa | Validado manualmente com criacao e acesso de empresas. |
| Isolamento de dados | Validado manualmente; isolamento entre empresas funcionando corretamente. |
| Usuarios | Fluxo migrado para e-mail como identidade; validar ciclo completo de criacao e login no Preview. |
| Financeiro | Vendas, recebimentos, isolamento entre tenants, despesa automatica de compra de estoque e finalizacao transacional de vendas validados. |
| Estoque | Cadastro com estoque inicial e entrada manual atualizam estoque, registram movimento e geram despesa financeira. |
| Interface | Banner de diagnostico SaaS removido; AppShell limpo. |
| Modulos ja validados | Empresas, administrador, login, clientes, vendas, recebimentos financeiros, estoque x financeiro, logout e isolamento multiempresa. |
| Modulos pendentes de validacao | Ciclo completo de autenticacao no Preview; validacao manual completa dos comprovantes A4 e termico 80 mm. |

## Commits e deploys relevantes de 2026-07-25

- `065ab1b refactor(auth): unify SaaS authentication with Supabase SSR`.
- `ee94267 refactor(auth): use email as the only user identity`.
- `ff468c9 refactor(ui): remove tenant debug banner from app shell`.
- `d8d3a4a fix(stock): create expense for inventory purchases`.
- Branch atual: `rescue-saas-20260722`.
- `d5d26b7 debug(stock): instrument financial entry creation`.
- `7bec781 feat(stock): reuse stock entry flow on product creation`.
- `4a34e23 feat(sales): make SaaS sale finalization fully transactional`.
- Preview mais recente: `https://fenix-saas-ban3qtx2b-jlsolucoesivp1-3372s-projects.vercel.app`.

## Pendencias atuais

- Validacao E2E final da autenticacao no Preview.
- Corrigir o contraste do modal do comprovante.
- Refinar a experiencia de impressao Web dentro dos limites do dialogo nativo do navegador.
- Validar A4 e termica 80 mm em cenarios de muitos itens, nome longo, item manual e impressora termica real.

---

Atualizacao registrada em 2026-07-27 (America/Sao_Paulo). A proxima sessao deve retomar pelo contraste do modal do comprovante, pela experiencia de impressao e pela validacao manual completa dos dois formatos.

## Auditoria de desempenho e velocidade - 2026-07-29

### Escopo, metodo e limites

- Auditoria estatica de front-end, 49 rotas de API, camada de sessao/autorizacao, consultas REST ao Supabase, migrations/indices, configuracao Next/Vercel e dependencias.
- Medicoes executadas localmente: `npm.cmd run build` (build limpo), `npm.cmd run typecheck` e `npm.cmd audit --omit=dev --json` (somente informativo).
- Lighthouse, waterfall de navegador, tempos autenticados, logs de Runtime Vercel e `EXPLAIN ANALYZE`/Database Advisor do Supabase nao foram executados: nao havia navegador disponivel, credenciais de teste nem acesso operacional aos dashboards nesta sessao. Esses dados continuam obrigatorios antes de afirmar tempos de producao.

### Nota geral: 6,5/10

O build e o typecheck estao saudaveis, os indices compostos principais ja existem e varias consultas independentes usam `Promise.all`. O principal risco de lentidao em empresas com base crescente e transferir tabelas completas para o navegador e recalcular sessao/permissoes repetidamente. A experiencia inicial tambem paga bundles elevados em modulos importantes.

### Medicoes verificadas

| Medicao | Antes | Depois | Resultado |
| --- | --- | --- | --- |
| Build Next | Falhou apos gerar 76/76 paginas: `ENOENT` ao mover `.next/export/500.html` | Cache `.next` regenerado; 53,1 s total | Aprovado |
| Compilacao do build limpo | 22,6 s (tentativa com cache inconsistente) | 17,6 s | Aprovado |
| Typecheck | Nao executado nesta auditoria antes da limpeza | Aprovado (`tsc --noEmit`) | Aprovado |
| Lint | Script `next lint` abre assistente interativo; nao ha configuracao ESLint automatizavel | Pendente migrar para ESLint CLI | Bloqueado por configuracao |
| `npm audit --omit=dev` | - | 0 critica, 12 altas, 11 medias | Informativo; nao e medicao de performance |

Build - First Load JS relevante: `/clientes` 315 kB, `/financeiro` 360 kB, `/orcamentos` 321 kB, `/ordens-de-servico` 369 kB, `/laudos` 288 kB; compartilhado por todas as paginas: 103 kB. Dashboard: 186 kB; PDV: 203 kB; agenda: 112 kB (calendario ja dinamico).

### Problemas criticos

1. **Nenhum problema critico confirmado.** Nao houve alteracao de regras de negocio, autenticacao, isolamento, financeiro, estoque ou impressao nesta auditoria.

### Problemas altos

1. **Listas completas sem paginacao/limite.**
   - Evidencia: `src/lib/server/saas-customers.ts:listSaasCustomers`, `saas-products.ts:listSaasProducts`, `saas-appointments.ts:listSaasAppointments`, `saas-quotes.ts:listSaasQuotes`, `saas-service-orders.ts:listSaasServiceOrders` e `saas-financial.ts:listSaasFinancialOverview` fazem `GET` sem `limit`/`range`; o financeiro busca, em paralelo, todas as entradas, vendas e itens de venda.
   - Impacto: payload, tempo de resposta e memoria crescem linearmente por empresa; financeiro e PDV sao os mais expostos. O mapeamento de itens por venda tambem pode crescer para O(vendas x itens).
   - Correcao: contrato paginado por cursor/data, totais agregados no servidor e carregamento sob demanda de itens/detalhes. Para dashboard, substituir listas inteiras por contagens/consulta especifica do dia.
   - Risco: medio/alto; muda contratos de telas e exige validar filtros, totais, exportacao e isolamento por `company_id`.

2. **Custo repetido de sessao e autorizacao em cada rota.**
   - Evidencia: `src/lib/server/session.ts:getAuthenticatedAppSession` chama `getSupabaseSessionState` e `getSaasUserPermissions`; `getSupabaseSessionState` consulta Auth e em seguida membership+company (`src/lib/server/supabase-session.ts`, `tenant-access.ts`); `requireSaasPermission` chama novamente sessao e estado Supabase. `src/app/api/auth/session/route.ts` ainda consulta Platform Admin. No cliente, `AppShell` tem dois guards e as paginas/hooks tambem usam `useCurrentAppSession`.
   - Impacto: login, primeira navegacao e cada API autenticada podem fazer varias viagens Vercel -> Supabase antes da consulta do modulo.
   - Correcao: contexto de requisicao memoizado por request (`cache`/request scope), resolver claims no JWT quando seguro e manter uma unica fonte de sessao no React Context.
   - Risco: alto; exige testes rigorosos de troca de empresa, revogacao de membership, permissao e isolamento.

3. **Bundles iniciais elevados e bibliotecas pesadas estaticas.**
   - Evidencia: build limpo aponta 369 kB em OS, 360 kB em financeiro, 321 kB em orcamentos e 315 kB em clientes. `src/app/(app)/orcamentos/page.tsx`, `src/components/sales/sale-details-dialog.tsx` e `src/components/financials/sale-details-dialog.tsx` importam `jspdf`/`jspdf-autotable` estaticamente; `recharts` esta no dashboard. A agenda e o exemplo positivo: usa `next/dynamic` para FullCalendar.
   - Impacto: maior tempo de download, parse e hidratacao especialmente em rede movel/CPU modesta.
   - Correcao: importar PDF, dialogs de detalhes e graficos sob demanda; manter somente tipos estaticos. Aplicar `next/dynamic` aos modais grandes que nao abrem no primeiro paint.
   - Risco: medio; exige testar impressao e abertura de dialogs, sem tocar na regra de venda.

### Problemas medios

1. **Dashboard calcula metricas baixando colecoes inteiras.** `src/lib/server/saas-users.ts:buildSaasDashboardOverview` busca clientes, OS e agenda completos e conta/filtra em Node. Usar `count=exact` ou RPC/consulta agregada e filtrar agenda por data/status. Risco medio.
2. **PDV carrega todo estoque e todos os clientes no inicio.** `src/app/(app)/vendas/page.tsx` chama `listTenantProducts()` e `listTenantCustomers()`; busca por autocomplete ja existe, mas a carga inicial permanece. Risco medio: substituir por busca de codigo de barras/consulta limitada requer preservar itens e fluxo offline/legado onde aplicavel.
3. **Agenda carrega todos os clientes e agendamentos.** `src/components/agenda/calendar-view.tsx` faz as duas listas; limitar agenda ao intervalo visivel e usar autocomplete remoto de clientes. Risco medio.
4. **Fontes externas bloqueiam/atrasam a renderizacao.** `src/app/layout.tsx` usa CSS de Google Fonts em `<link>`. Migrar para `next/font`/self-host reduz dependencias externas e melhora cache. Risco baixo.
5. **Logs de producao verbosos.** `src/app/api/auth/supabase-login/route.ts` registra e-mail e etapas do login; `src/lib/server/saas-products.ts` registra payload/resposta de financeiro. Isso aumenta I/O/custo e expõe dados operacionais em logs. Risco baixo para condicionar/remover logs de diagnostico.
6. **Cache deliberadamente desativado para dados de leitura.** Varios fetches usam `cache: 'no-store'` e o layout usa `noStore()`. Correto para seguranca de tenant, mas impede cache de configuracao/empresa. Avaliar somente cache privado e invalidacao por tenant; nao usar cache publico para dados SaaS. Risco alto se feito sem desenho de chave/invalidaçao.

### Problemas baixos / manutencao

1. `vercel.json` fixa `maxDuration: 60`, mas nao define regiao. Confirmar no projeto Vercel a regiao da funcao e no Supabase a regiao do projeto; diferencas de regiao adicionam latencia a toda chamada. Nao ha evidencia local de cold start, 500/504 ou tamanho de funcao.
2. O middleware cobre praticamente todas as rotas exceto assets (`middleware.ts`); medir seu custo em producao, mas nao restringir matcher sem validar renovacao de sessao.
3. O script `npm run lint` nao e executavel em CI sem input porque usa `next lint` sem ESLint configurado. Migrar para ESLint CLI e incluir no pipeline.
4. Existem indices adequados para os filtros principais: `company_id` combinado com nome/data/status/cliente/produto nas migrations de clientes, produtos, OS, vendas, financeiro e agenda. Ainda falta confirmar uso real com `EXPLAIN (ANALYZE, BUFFERS)` e revisar busca `ilike` multipla de clientes para indice trigram por tenant, se os volumes crescerem.

### Ordem recomendada

1. Coletar dados reais: Vercel Runtime Logs/Analytics, Supabase Query Performance/`pg_stat_statements`, EXPLAIN das cinco consultas mais chamadas, Lighthouse autenticado e waterfall por modulo.
2. Paginar clientes, produtos, OS, agenda, orcamentos e, prioritariamente, financeiro; criar endpoints de resumo especificos.
3. Reduzir trabalho por request de sessao/autorizacao, preservando revalidacao de `company_id` e membership.
4. Adiar PDF/dialogs/graficos para importacao dinamica; medir novamente os bundles.
5. Alinhar regioes Vercel/Supabase, instrumentar duracao por rota e configurar alertas para 500/504/timeout.
6. Migrar lint e remover/condicionar logs diagnosticos de producao.

### Melhorias rapidas e seguras aplicaveis depois de validacao

- Migrar fontes para `next/font`.
- Remover/condicionar logs `console.info` que carregam payloads de autenticacao e financeiro.
- Extrair imports de PDF para `import()` nos dialogs; testar cada impressao antes de publicar.
- Configurar ESLint CLI para liberar lint nao interativo.

### Melhorias que exigem refatoracao

- Paginacao e novos contratos de listagem/relatorios.
- Contexto/memoizacao de sessao por request e React Context compartilhado.
- Endpoint/RPC agregado para dashboard e filtros por intervalo na agenda.
- Cache privado por tenant com invalidaçao transacional.

### Alteracoes feitas nesta auditoria

- Nenhum arquivo de aplicacao, migration, regra de negocio ou configuracao de producao foi alterado.
- Apenas o cache gerado `.next` foi removido e regenerado para corrigir a falha local `ENOENT` do build.
- Este `STATUS.md` foi atualizado com o relatorio, testes e proximos passos.

### Validacao de isolamento

- Nenhuma alteracao de codigo que manipule `company_id` foi realizada.
- O build e o typecheck aprovados confirmam integridade de compilacao, mas nao substituem o teste E2E com duas empresas ja listado como pendencia de seguranca.

## Fase 1 de desempenho - paginacao segura (parcial) - 2026-07-29

### Modulos concluídos nesta etapa

#### Clientes

- **Consulta anterior:** `listSaasCustomers` buscava todos os clientes ativos, sem `limit` ou `offset`, ordenados por `full_name.asc` no Supabase. O total era, portanto, todos os registros visiveis da empresa pelo token/RLS.
- **Alteracao:** a tela `/clientes` passa a chamar `GET /api/clientes?paginated=true&page=N&search=...` e recebe no maximo **20** registros. A busca por nome, documento, telefone ou e-mail e aplicada no PostgREST antes de `limit`/`offset`; a ordenacao continua no banco (`full_name.asc`).
- **Isolamento:** a nova consulta usa o mesmo `requireSaasPermission('accessClients')`, o token autenticado/RLS e adiciona o filtro explicito `company_id = context.companyId`. Nenhuma policy, membership, permissao ou autenticacao foi modificada.
- **Interface:** lista de resultados, busca remota, contagem, pagina atual, Anterior/Proxima, estado de carregamento e estado vazio.
- **Compatibilidade:** o endpoint sem `paginated=true` foi preservado para os consumidores ainda dependentes da lista integral (agenda, PDV, OS, laudos e orcamentos). Eles permanecem pendencia desta Fase 1 e nao foram alterados implicitamente.

#### Produtos

- **Consulta anterior:** `listSaasProducts` buscava todo o catalogo ativo, sem `limit` ou `offset`, ordenado por `name.asc` no Supabase; depois a tela filtrava no navegador.
- **Alteracao:** a tela `/produtos` usa a mesma rota com `paginated=true`, pagina de **20** itens e filtro remoto por nome, categoria ou codigo de barras antes da paginacao. A ordenacao permanece `name.asc` no banco.
- **Isolamento:** o caminho preserva `requireSaasPermission('accessInventory')`, RLS/token e filtro explicito `company_id = context.companyId`. Operacoes de cadastro, entrada de estoque, financeiro, venda, impressao e exclusao nao tiveram sua regra de negocio alterada.
- **Interface:** a tabela exibe total, pagina atual, Anterior/Proxima e indicacao de carregamento; a busca existente passa a acionar o filtro no servidor para o runtime SaaS.

### Arquivos alterados

- `src/lib/server/saas-customers.ts`
- `src/app/api/clientes/route.ts`
- `src/lib/storage.ts`
- `src/app/(app)/clientes/page.tsx`
- `src/lib/server/saas-products.ts`
- `src/app/api/produtos/route.ts`
- `src/app/(app)/produtos/page.tsx`
- `STATUS.md`

### Validacoes executadas

- `npm.cmd run typecheck`: aprovado apos Clientes e novamente apos Produtos.
- `npm.cmd run build`: aprovado apos Clientes e novamente apos Produtos; 76/76 paginas geradas.
- `npm.cmd run test -- --run`: aprovado, 5 arquivos e 20 testes.
- A verificacao estatica confirma que as novas consultas paginadas usam `company_id` do contexto autorizado e mantem o token que ativa RLS.

### Validacao manual ainda obrigatoria

- Nao havia credenciais autenticadas de duas empresas nem navegador disponivel nesta sessao. Por isso, criacao, edicao, busca, troca de pagina e tentativa de acesso cruzado precisam ser executadas no Preview/local autenticado antes de considerar a validacao E2E concluida.
- Ordem de Servico, Orcamentos, Agenda e Financeiro ainda nao foram alterados nesta subetapa. Eles exigem paginacao das entidades compostas (OS/itens/pagamentos/notas e Financeiro/vendas/itens) sem alterar calculos ou fluxos, e devem ser implementados separadamente apos a validacao manual de Clientes e Produtos.

## Fase 1 - continuidade: Orçamentos e análise de risco de OS - 2026-07-29

### Orçamentos - concluído

- **Listagem principal anterior:** `listSaasQuotes` trazia todos os registros de `quotes` e todos os `quote_items`; a ordenação era `quote_date.desc,quote_time.desc` no banco, porém filtro de status e busca por cliente/número ocorriam somente no navegador.
- **Dados auxiliares preservados:** o construtor continua carregando clientes, produtos e kits para seleção/edição. Eles não foram reutilizados para a listagem e não sofreram mudança de regra de negócio nesta etapa.
- **Implementação:** `GET /api/orcamentos?paginated=true&page=N&status=...&search=...` busca no máximo **20** orçamentos, aplica status e busca por `customer_name`/ID antes de `limit`/`offset`, ordena no banco e busca itens exclusivamente para os IDs da página atual.
- **Isolamento:** a rota mantém `requireSaasPermission('accessQuotes')` e a nova consulta usa token/RLS e `company_id = context.companyId` tanto em `quotes` quanto em `quote_items`.
- **Interface:** contagem, página atual, Anterior/Próxima, carregamento e vazio. Criação, edição, exclusão, atualização de status, conversão em venda e impressão continuam recebendo o orçamento completo da página e não tiveram sua lógica modificada.
- **Validações:** `npm.cmd run typecheck`, `npm.cmd run build` (76/76 páginas), `npm.cmd run test -- --run` (5 arquivos/20 testes) e `git diff --check`: aprovados.

### Ordens de Serviço - implementação interrompida por risco alto

- **Consultas atuais identificadas:** `listSaasServiceOrders` baixa todas as `service_orders`, todos os itens, pagamentos e notas. A tela também obtém clientes auxiliares, metadados de visualização/leitura e reutiliza o estado composto em edição, comentários, status, finalização e fluxos de estoque/financeiro.
- **Risco específico:** paginar somente o cabeçalho sem uma rota de detalhe atômica e sem adaptar os dados associados por IDs pode deixar uma OS aberta no editor sem itens/notas/pagamentos, ou substituir o estado usado em finalização. Isso atingiria regras que esta Fase não pode alterar.
- **Próximo desenho obrigatório:** endpoint paginado de cabeçalhos + endpoint autenticado de detalhe por OS, com itens/pagamentos/notas filtrados por `company_id`; a tela deve carregar o detalhe somente ao abrir uma OS. Também deve separar a contagem de não lidas da lista. Não foi implementado para evitar alteração implícita de negócio.

### Pendências desta Fase

- Implementar OS somente após o desenho de lista versus detalhe descrito acima.
- Agenda: trocar lista global por intervalo visível do calendário, preservando movimentação/edição.
- Financeiro: separar dados de totalização dos dados paginados exibidos nas tabelas, sem usar a página para cálculos.
- Validar manualmente em sessão autenticada: busca, filtros, páginas, criação, edição, exclusão e tentativa entre duas empresas para Clientes, Produtos e Orçamentos.

### Preparação de Preview - 2026-07-29

- Branch de Preview preparada: `rescue-saas-20260722` (rastreando `origin/rescue-saas-20260722`). Nenhum merge ou promoção para Produção foi realizado.
- Validações finais antes do push: `npm.cmd run typecheck` aprovado; `npm.cmd run build` aprovado (76/76 páginas); `npm.cmd run test -- --run` aprovado (5 arquivos/20 testes); `git diff --check` aprovado.
- Aviso não bloqueante: npm informou existir uma versão menor mais nova (`11.18.0`); nenhuma dependência ou variável de ambiente foi alterada nesta preparação.
- O commit de Preview incluirá somente a paginação segura de Clientes, Produtos e Orçamentos e este registro. As alterações preexistentes de dependências/migration permanecem fora deste commit.

## Correcao - exclusao de cliente SaaS - 2026-07-29

### Investigacao e causa encontrada

- O botao **Acoes -> Excluir Cliente** chama `handleDeleteCustomer`, que chama `deleteTenantCustomer` e envia `DELETE /api/clientes/{id}`. A rota aplica `requireSaasPermission('accessClients')`, resolve o token Supabase e chama `deleteSaasCustomer` com `id` e `company_id` da sessao.
- A consulta ao Supabase ja possuia filtro explicito `company_id = context.companyId`; portanto, nao havia ampliacao do escopo entre empresas. A policy `customers_delete_clients` tambem exige `has_company_permission(company_id, 'access_clients')`.
- A falha de observabilidade era dupla: a tela nao capturava rejeicoes assincronas do DELETE (erro silencioso para o operador) e o PostgREST pode responder sucesso com zero linhas afetadas quando o filtro/RLS nao encontra uma linha. Nesse caso a API retornava `{ success: true }` apesar de nenhum cliente ter sido apagado.

### Correcao aplicada

- `deleteSaasCustomer` agora usa `Prefer: return=representation` e solicita o campo `id` no DELETE. A operacao so e considerada concluida quando a resposta contem o cliente solicitado; zero linhas retornam erro claro.
- A tela passa a capturar a falha e exibir toast destrutivo com a mensagem devolvida pela API. Nao remove mais o cliente da lista local nem mostra sucesso quando a exclusao falha.
- Apos sucesso, a pagina atual e recarregada preservando o filtro de busca ativo.

### Relacionamentos e isolamento

- Nao foi encontrado FK bloqueante nas migrations atuais: `appointments`, `quotes`, `service_orders` e `sales` referenciam o cliente por chave composta `(company_id, customer_id)` com `ON DELETE SET NULL`. As movimentacoes permanecem historicas, com o vinculo de cliente anulado conforme a regra ja declarada no banco.
- Nao foram alterados autenticacao, memberships, permissoes, RLS, `company_id`, vendas, estoque, financeiro ou impressao.

### Testes

- `npm.cmd run typecheck`: aprovado.
- `npm.cmd run build`: aprovado (76/76 paginas).
- `npm.cmd run test -- --run`: aprovado (5 arquivos/20 testes).
- `git diff --check`: aprovado.
- Pendentes de sessao autenticada no Preview: DELETE de cliente sem movimentacoes; DELETE de cliente com movimentacoes (confirmar `ON DELETE SET NULL`); tentativa de DELETE de cliente de outra empresa (deve resultar em erro e nenhuma linha afetada). Este ambiente nao possui credenciais de duas empresas nem navegador autenticado para coletar status/corpo HTTP reais.
