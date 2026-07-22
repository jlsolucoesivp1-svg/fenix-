CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supabase_user_id uuid NULL,
  legacy_user_id text NULL,
  email text NULL,
  display_name text NULL,
  status text NOT NULL DEFAULT 'active',
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT platform_admins_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE UNIQUE INDEX idx_platform_admins_supabase_user_id
ON public.platform_admins (supabase_user_id)
WHERE supabase_user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_platform_admins_legacy_user_id
ON public.platform_admins (legacy_user_id)
WHERE legacy_user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_platform_admins_email_lower
ON public.platform_admins (lower(email))
WHERE email IS NOT NULL;

CREATE INDEX idx_platform_admins_status
ON public.platform_admins (status);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.platform_admins FROM anon, authenticated;

COMMENT ON TABLE public.platform_admins IS 'Tabela de superadministradores da plataforma JL Informatica. Uso exclusivo do backend administrativo.';
