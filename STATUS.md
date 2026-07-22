# Status do Projeto Fênix SaaS

Atualizado em 2026-07-22 (America/Sao_Paulo).

## Status Geral

- Branch atual: `rescue-saas-20260722`.
- Último commit realizado: `170434f fix(saas): normalize auth response and rollback flow`.
- Commit da correção visual do painel: `3f05584 fix(admin): normalize theme contrast and form accessibility`.
- Deploy na Vercel funcionando.
- Painel `/admin` funcionando.
- Tema do painel corrigido e contraste normalizado.

## O que foi concluído

- Integração GitHub ↔ Vercel funcionando.
- Login do Super Admin funcionando.
- Usuário presente em `platform_admins`.
- Painel administrativo acessível.
- Correção visual aplicada e validada.
- Build passando.

## Problema encontrado hoje

Durante o cadastro de empresas:

- O usuário era criado no Supabase Auth.
- O sistema retornava `Supabase Auth não retornou o usuário criado`.
- A empresa não era criada em `companies`.
- `company_memberships` não era criada.
- `company_settings` e `company_branding` também não eram criadas.

## Diagnóstico

Foi identificado que:

- O endpoint do Supabase Auth retornava o usuário em formato diferente do esperado.
- O código esperava `payload.user.id`.
- Era necessário normalizar a resposta.
- A criação do usuário ocorria fora do bloco de rollback.

## Correções aplicadas

Arquivos alterados:

- `src/lib/server/saas-bootstrap.ts`
  - Normalização da resposta do Auth para aceitar tanto o usuário no objeto raiz quanto em `payload.user`.
  - Correção em `fetchSupabaseAuthUser`.
  - Preservação das mensagens reais de erro retornadas pelo Supabase.

- `src/lib/server/saas-control-plane.ts`
  - Inclusão da criação do usuário dentro do fluxo de rollback.
  - Limpeza do usuário Auth em caso de falha posterior.

Nenhuma migration, RLS ou banco foi alterado.

Build executado com sucesso após as correções.

## Próximo passo obrigatório

Realizar um teste ponta a ponta:

1. Criar uma nova empresa pelo `/admin`.
2. Confirmar a criação do usuário em Authentication.
3. Confirmar a criação em `companies`.
4. Confirmar a criação em `company_memberships`.
5. Confirmar a criação de `company_settings`.
6. Confirmar a criação de `company_branding`.
7. Confirmar que a empresa aparece imediatamente na listagem.
8. Confirmar o login do administrador da empresa.

Somente após esse teste:

- fazer commit;
- fazer push;
- validar na Vercel.

## Observações

- Ainda existem arquivos antigos e alterações não relacionadas no repositório.
- Não utilizar `git add .` sem revisar cuidadosamente os arquivos.
- As correções de tema e de provisionamento já possuem commits locais; validar o teste ponta a ponta antes de qualquer novo push ou deploy.
