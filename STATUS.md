# Status do Projeto Fenix SaaS

Atualizado em 2026-07-24 11:50:44 -03:00 (America/Sao_Paulo).

## Estado do repositorio

- Branch atual: `rescue-saas-20260722`.
- Ultimo commit local e remoto: `c211e92 fix(users): support Supabase admin user response formats`.
- A branch local esta alinhada com `origin/rescue-saas-20260722`.
- Arvore de trabalho estava limpa antes desta atualizacao deste arquivo; esta alteracao em `STATUS.md` permanece apenas local ate um futuro commit solicitado.

## Resolvido hoje

- Login do Super Admin validado no Preview: `POST /auth/v1/token?grant_type=password` respondeu HTTP 200 e o painel identificou o usuario como platform admin.
- Criacao de empresa e acesso do administrador inicial revisados; empresa em `trial` e membership ativa permitem acesso ao tenant.
- Recursao RLS em `company_memberships` corrigida.
  - A policy `memberships_select_member` chama `is_company_member(company_id)`.
  - A versao defeituosa da funcao consultava `company_memberships` sem `SECURITY DEFINER`, reexecutando a mesma policy ate gerar `ERROR 54001: stack depth limit exceeded`.
  - A migration `20260724000011_fix_company_memberships_rls_recursion.sql` restaura as funcoes de autorizacao como `SECURITY DEFINER`, com `search_path` seguro e suporte a empresas `active` e `trial`.
- Migration de RLS confirmada como aplicada no Supabase remoto: `20260724000011` aparece no historico local e remoto.
- Login do administrador da empresa funcionando no Auth: o password grant respondeu HTTP 200; a falha posterior de acesso era a recursao de membership, agora corrigida pela migration.
- Fluxo de criacao parcial de usuario recebeu rollback:
  - se profile, role, permissoes, membership ou confirmacao final falharem, a role gerenciada e removida e o usuario e excluido de `auth.users`;
  - as FKs removem profile e membership associados;
  - a API registra a etapa e a mensagem da falha, sem registrar senha.
- Formato da resposta administrativa do Supabase Auth corrigido:
  - `createAuthUser()` agora aceita tanto `{ user: { id } }` quanto o objeto direto `{ id, email, ... }` retornado pelo GoTrue.

## Problema atual

- Criacao de novo usuario de empresa retorna HTTP `422`.
- Etapa informada: `criar usuario no Supabase Auth`.
- Mensagem exibida: `Falha na operacao (422)`.
- Ainda nao foi registrado o corpo exato retornado pelo Supabase para essa tentativa; portanto ainda nao se sabe se e-mail ja existe ou qual campo esta sendo rejeitado.

## Proxima acao exata

1. Analisar o `POST /auth/v1/admin/users` da tentativa de criacao de usuario.
2. Registrar o JSON enviado, ocultando/removendo a senha antes do log.
3. Registrar o status HTTP e o corpo completo da resposta do Supabase.
4. Identificar `error`, `error_code`, `message` e `msg` retornados.
5. Confirmar se o e-mail ja existe em `auth.users` ou qual campo esta sendo rejeitado.
6. Nao corrigir por tentativa antes de apresentar a causa comprovada.

## Arquivos alterados e migrations criadas hoje

- `src/app/api/auth/supabase-login/route.ts`
- `src/app/api/usuarios/route.ts`
- `src/app/page.tsx`
- `src/lib/server/saas-bootstrap.ts`
- `src/lib/server/saas-control-plane.ts`
- `src/lib/server/saas-users.ts`
- `src/lib/storage.ts`
- `supabase/migrations/20260724000011_fix_company_memberships_rls_recursion.sql`

## Commits, push e deploy

- As correcoes de hoje ja foram commitadas e enviadas para `origin/rescue-saas-20260722`:
  - `4e74b2d fix(auth): resolve first login for SaaS admin`
  - `ef5d017 fix(auth): diagnose first login flow`
  - `10dd1f2 perf(saas): optimize company bootstrap and reduce provisioning latency`
  - `9c51d01 fix(rls): resolve company_memberships recursion`
  - `f8b12e4 fix(users): add rollback for failed user provisioning`
  - `c211e92 fix(users): support Supabase admin user response formats`
- A migration RLS foi aplicada no Supabase remoto.
- Existem varios deployments de Preview prontos na Vercel; o mais recente no momento desta atualizacao e `https://fenix-saas-geki944wf-jlsolucoesivp1-3372s-projects.vercel.app`.
- Nenhum novo commit, push ou deploy foi feito nesta atualizacao de STATUS.
- A unica alteracao local pendente agora e este `STATUS.md` atualizado.

## Comandos para retomar

```powershell
Get-Content STATUS.md
git status --short
git log -1 --oneline
vercel.cmd logs --environment preview --no-branch --since 2h --limit 100 --expand --no-color --query "/api/usuarios"
supabase.cmd migration list --linked
npm.cmd run build
git diff --check
git diff
```

Nao fazer commit, push ou deploy sem solicitacao explicita.
