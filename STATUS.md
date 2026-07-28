# Status do Projeto Fenix SaaS

Atualizado em 2026-07-27 (America/Sao_Paulo).

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
- Validacao manual E2E (venda sem cliente/com cliente, baixa de estoque, financeiro, historico, dialogos A4 e termico): **pendente**. O navegador integrado nao estava disponivel nesta sessao e nao foi possivel autenticar/operar o tenant real localmente; nao registrar como validado ate executar a checklist no Preview ou local autenticado.

### Pendencia objetiva para encerrar esta correcao

- Executar no tenant de teste a checklist manual solicitada: uma venda sem cliente e uma com cliente, verificando estoque, financeiro e historico; em ambas, testar A4 (abertura automatica, imprimir e cancelar) e termica. Nenhuma venda adicional deve ser criada ao escolher ou repetir a impressao.

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
