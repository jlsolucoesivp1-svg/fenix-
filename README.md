# Fenix SaaS

Sistema de gestao com runtime legado em Postgres e migracao SaaS em andamento com Supabase e painel administrativo da JL Informatica.

## Requisitos

- Node.js 24.x
- npm
- PostgreSQL acessivel por `DATABASE_URL`
- credenciais do Supabase para os fluxos SaaS

## Ambiente local

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo `.env.local` a partir de `.env.example`.

3. Rode o sistema:

```bash
npm run dev
```

4. Abra `http://localhost:3000`.

## Validacao antes de publicar

Execute:

```bash
npm run deploy:check
```

Esse comando roda:
- `typecheck`
- `test`
- `build`

## Deploy na Vercel

O passo a passo completo esta em [docs/vercel-deploy.md](/C:/Users/Servidor/Desktop/Sitema%20Fenix%20vercel%2013-07-2026/bkp%20sistema%2007052026/Fenix%20Saas/docs/vercel-deploy.md).
