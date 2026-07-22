# Migracao de dados do Postgres Docker para o Supabase

## Arquivo gerado

- `ferramentas/14-exportar-dados-supabase.ps1`

## O que o script faz

1. Conecta em um container Docker que ja esteja rodando Postgres.
2. Executa `pg_dump` em modo `data-only` apenas das tabelas usadas pelo app atual:
   - `public.app_records`
   - `public.app_singletons`
3. Forca `PGCLIENTENCODING=UTF8` e copia o dump bruto do container para o host sem passar pelo pipeline textual do PowerShell.
4. Remove trechos desnecessarios ou potencialmente chatos para restore no Supabase, como `SET`, `OWNER TO` e metacomandos do `pg_dump`.
5. Gera um `.sql` final pronto para restore com `BEGIN` e `COMMIT`.

## Pre-requisito

Antes do restore, aplique o schema no Supabase:

- `supabase/migrations/20260708_000001_init_fenix_app_storage.sql`
ou
- `sql/supabase-manual-init.sql`

## Fluxo recomendado

### 1. Descobrir o nome do container do Postgres local

```powershell
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
```

### 2. Exportar os dados

Exemplo, se o nome do container for `fenix-postgres`:

```powershell
powershell -ExecutionPolicy Bypass -File .\ferramentas\14-exportar-dados-supabase.ps1 -SourceContainer fenix-postgres
```

Se quiser informar banco e usuario explicitamente:

```powershell
powershell -ExecutionPolicy Bypass -File .\ferramentas\14-exportar-dados-supabase.ps1 -SourceContainer fenix-postgres -SourceDatabase sistema_fenix -SourceUser postgres
```

O script vai gerar um arquivo em `backups\supabase-data_YYYY-MM-DD_HH-mm-ss.sql`.

### 3. Definir a connection string do Supabase

Use a string de conexao do Supabase com SSL obrigatorio:

```powershell
$env:SUPABASE_DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
```

Se a senha tiver caracteres especiais, use a senha URL-encoded.

### 4. Restaurar no Supabase usando um `psql` dentro de Docker

Use o script de restore do repositorio:

```powershell
powershell -ExecutionPolicy Bypass -File .\ferramentas\15-restaurar-supabase.ps1 -InputFile .\backups\supabase-data_YYYY-MM-DD_HH-mm-ss.sql
```

Esse script envia os bytes do arquivo direto para o `psql`, sem recodificar o conteudo pelo console do Windows.

## Reset opcional antes do restore

Se o Supabase ja tiver dados nessas tabelas e voce quiser sobrescrever:

```powershell
docker run --rm postgres:16-alpine psql "$env:SUPABASE_DATABASE_URL" -c "TRUNCATE TABLE public.app_records, public.app_singletons;"
```

Depois rode o restore normalmente.

## Observacoes

- O fluxo acima migra os dados do app web atual. Ele nao migra o schema relacional do subprojeto `delphi-erp`.
- O restore pressupoe que o schema ja existe no Supabase.
- O dump foi intencionalmente limitado as tabelas `app_records` e `app_singletons`, que sao as tabelas realmente usadas pelo app Next atual.
- Evite usar `Get-Content ... | docker run ... psql ...` para esse restore no Windows. Esse pipeline textual pode corromper acentos e gerar textos com `?` ou mojibake como `Perif├®ricos`.
