-- Run this in the Supabase SQL Editor to recreate the current Docker/Postgres schema
-- used by the Next.js app.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS public.app_records (
  collection text NOT NULL,
  record_id text NOT NULL,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_records_pkey PRIMARY KEY (collection, record_id)
);

CREATE TABLE IF NOT EXISTS public.app_singletons (
  collection text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_records_users_login
ON public.app_records ((data->>'login'))
WHERE collection = 'users';

CREATE INDEX IF NOT EXISTS idx_app_records_customers_name_trgm
ON public.app_records
USING gin (lower(COALESCE(data->>'name', '')) gin_trgm_ops)
WHERE collection = 'customers';
