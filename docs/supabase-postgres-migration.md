# Migracao do schema atual para Supabase

## Escopo coberto

Os arquivos abaixo recriam o schema usado hoje pelo app web em Docker:

- `supabase/migrations/20260708_000001_init_fenix_app_storage.sql`
- `sql/supabase-manual-init.sql`

Esse schema corresponde ao armazenamento JSONB esperado pelo app em `src/lib/server/postgres.ts`:

- `public.app_records`
- `public.app_singletons`
- indice parcial por login de usuario
- indice trigram para busca de clientes por nome

## O que nao foi gerado

O projeto atual nao usa Prisma, TypeORM, Sequelize ou Knex para o app web principal. Por isso, nao foi gerado `schema.prisma` nem migrations de ORM.

Tambem nao inclui o schema do subprojeto `delphi-erp/`, porque ele e um projeto separado do app web atual e usa outro modelo de dados.

## Como aplicar no Supabase

Opcao 1:

- Coloque `supabase/migrations/20260708_000001_init_fenix_app_storage.sql` no fluxo de migrations do projeto Supabase.

Opcao 2:

- Copie e execute `sql/supabase-manual-init.sql` no SQL Editor do Supabase.

## Recursos Postgres usados hoje e compatibilidade com Supabase

- `jsonb`: suportado normalmente no Supabase.
- `timestamptz`: suportado normalmente.
- `pg_trgm`: em geral disponivel no Supabase, mas depende de permissao/extensao habilitada no projeto. Se a extensao nao puder ser criada, o schema base funciona, mas o indice trigram nao sera criado.
- indice parcial com expressao `((data->>'login'))`: suportado no Supabase.
- indice GIN com `gin_trgm_ops` sobre expressao: suportado quando `pg_trgm` estiver habilitada.

## Diferencas e cuidados

- O app nao cria mais o schema automaticamente em runtime. A migration precisa ser aplicada antes de apontar o app para a base.
- O schema atual nao depende de `uuid-ossp`, `pgcrypto`, triggers ou funcoes customizadas.
- O app atual tambem nao configura RLS. Se voce ativar RLS no Supabase para essas tabelas, as queries do servidor vao falhar ate que policies sejam criadas.
- O schema e propositalmente generico e guarda os dados da aplicacao dentro de colunas `jsonb`. Isso preserva compatibilidade com o app atual, mas nao converte o banco para um modelo relacional nativo do Supabase.
- O endpoint de busca de clientes usa `LIKE` sobre JSONB e se beneficia do indice trigram. Sem `pg_trgm`, a busca continua funcionando, mas tende a piorar de performance conforme o volume cresce.
- Em Windows, evite migrar dados SQL usando pipeline textual do PowerShell entre arquivo, `docker` e `psql`. Para preservar UTF-8, use os scripts `ferramentas/14-exportar-dados-supabase.ps1` e `ferramentas/15-restaurar-supabase.ps1`, que evitam a recodificacao pelo console.
