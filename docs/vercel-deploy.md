# Deploy na Vercel

Este projeto ja esta validado localmente com:

- `npm run build`
- `npm run test`
- `npm run typecheck`

Antes do primeiro deploy, use tambem:

```bash
npm run deploy:check
```

## 1. Criar o projeto na Vercel

1. Importe o repositorio na Vercel.
2. Framework detectado: `Next.js`.
3. Branch recomendada para primeiro teste:
   - `saas-migration`
4. Primeiro deploy recomendado:
   - `Preview`

## 2. Node.js

O projeto declara em `package.json`:

```json
"engines": {
  "node": "24.x"
}
```

A documentacao oficial da Vercel informa que `24.x`, `22.x` e `20.x` estao disponiveis, e que `24.x` e o padrao atual:

- https://vercel.com/docs/functions/runtimes/node-js/node-js-versions

## 3. Variaveis de ambiente obrigatorias

Cadastre estas variaveis no projeto da Vercel:

```env
DATABASE_URL=
SESSION_SECRET=
SESSION_COOKIE_SECURE=true
PGSSL=require
SERIAL_SECRET=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SAAS_BOOTSTRAP_SECRET=
ALLOW_DEV_DEFAULT_TENANT=false
DEV_DEFAULT_COMPANY_SLUG=
```

## 4. Origem de cada variavel

- `DATABASE_URL`
  - conexao do Postgres usado pelo runtime legado compartilhado
- `SESSION_SECRET`
  - segredo forte para assinar a sessao do sistema
- `SESSION_COOKIE_SECURE`
  - manter `true` na Vercel
- `PGSSL`
  - manter `require`, salvo se seu provedor exigir outra configuracao
- `SERIAL_SECRET`
  - segredo da validacao/licenciamento atual
- `NEXT_PUBLIC_SUPABASE_URL`
  - URL publica do projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - chave publica anon do Supabase
- `SUPABASE_SERVICE_ROLE_KEY`
  - backend only, nunca vai para o navegador
- `SAAS_BOOTSTRAP_SECRET`
  - backend only, usado pelo bootstrap interno
- `ALLOW_DEV_DEFAULT_TENANT`
  - usar `false` em deploy
- `DEV_DEFAULT_COMPANY_SLUG`
  - opcional; nao usar em producao

## 5. Seed do primeiro superadmin

Para acessar `/admin`, o usuario precisa existir em `public.platform_admins`.

Exemplo:

```sql
insert into public.platform_admins (
  supabase_user_id,
  email,
  display_name,
  status
)
values (
  'SEU_SUPABASE_USER_ID',
  'seuemail@dominio.com',
  'Seu Nome',
  'active'
);
```

O `supabase_user_id` deve ser o `id` real do usuario em `auth.users`.

## 6. Primeiros testes apos o deploy

Teste este roteiro:

1. Abrir o sistema publicado.
2. Validar login.
3. Validar modulos principais.
4. Abrir `/admin` com usuario cadastrado em `platform_admins`.
5. Validar que usuario comum nao acessa `/admin`.
6. Criar uma empresa pelo painel administrativo.
7. Confirmar criacao de:
   - usuario no Supabase Auth
   - `profiles`
   - `companies`
   - `roles`
   - `company_memberships`
   - `company_settings`
   - `company_branding`
   - `audit_logs`
8. Confirmar que o admin criado entra com `tenantAccess = ready`.

## 7. Recomendacao operacional

- Primeiro deploy:
  - `Preview`
- Banco e Supabase:
  - ambiente de teste/homologacao
- So promover para producao depois de validar:
  - login
  - painel `/admin`
  - criacao de empresa
  - isolamento entre tenants
  - suspensao e reativacao

## 8. Comandos locais uteis

```bash
npm run deploy:check
npm run dev
```
