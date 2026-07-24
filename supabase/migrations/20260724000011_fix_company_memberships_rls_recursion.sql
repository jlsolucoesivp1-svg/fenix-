BEGIN;

-- These helpers are evaluated by policies on company_memberships itself. They
-- must bypass RLS while reading that table, otherwise the policy calls itself
-- recursively until PostgreSQL exhausts its stack.
CREATE OR REPLACE FUNCTION public._is_company_member_internal(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships AS cm
    JOIN public.companies AS c
      ON c.id = cm.company_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
      AND c.status IN ('active', 'trial')
  )
$$;

CREATE OR REPLACE FUNCTION public._has_company_permission_internal(
  target_company_id uuid,
  permission_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships AS cm
    JOIN public.companies AS c
      ON c.id = cm.company_id
    LEFT JOIN public.roles AS r
      ON r.id = cm.role_id
    LEFT JOIN public.role_permissions AS rp
      ON rp.role_id = r.id
    LEFT JOIN public.permissions AS p
      ON p.id = rp.permission_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
      AND c.status IN ('active', 'trial')
      AND (
        cm.is_owner = true
        OR p.code = permission_code
      )
  )
$$;

CREATE OR REPLACE FUNCTION public._is_company_admin_internal(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships AS cm
    JOIN public.companies AS c
      ON c.id = cm.company_id
    LEFT JOIN public.roles AS r
      ON r.id = cm.role_id
    LEFT JOIN public.role_permissions AS rp
      ON rp.role_id = r.id
    LEFT JOIN public.permissions AS p
      ON p.id = rp.permission_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'active'
      AND c.status IN ('active', 'trial')
      AND (
        cm.is_owner = true
        OR r.is_company_admin = true
        OR p.code = 'manage_company'
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public._is_company_member_internal(target_company_id)
$$;

CREATE OR REPLACE FUNCTION public.has_company_permission(target_company_id uuid, permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public._has_company_permission_internal(target_company_id, permission_code)
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public._is_company_admin_internal(target_company_id)
$$;

REVOKE ALL ON FUNCTION public._is_company_member_internal(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._has_company_permission_internal(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._is_company_admin_internal(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_company_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_company_permission(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_company_admin(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_company_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_permission(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid) TO authenticated;

COMMIT;
