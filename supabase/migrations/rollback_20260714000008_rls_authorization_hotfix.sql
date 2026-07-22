BEGIN;

CREATE OR REPLACE FUNCTION public.is_company_member(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    JOIN public.companies c
      ON c.id = cm.company_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = public.auth_user_id()
      AND cm.status = 'active'
      AND c.status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_company_permission(target_company_id uuid, permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    JOIN public.companies c
      ON c.id = cm.company_id
    LEFT JOIN public.roles r
      ON r.id = cm.role_id
    LEFT JOIN public.role_permissions rp
      ON rp.role_id = r.id
    LEFT JOIN public.permissions p
      ON p.id = rp.permission_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = public.auth_user_id()
      AND cm.status = 'active'
      AND c.status = 'active'
      AND (
        cm.is_owner = true
        OR p.code = permission_code
      )
  )
$$;

CREATE OR REPLACE FUNCTION public.is_company_admin(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_memberships cm
    JOIN public.companies c
      ON c.id = cm.company_id
    LEFT JOIN public.roles r
      ON r.id = cm.role_id
    WHERE cm.company_id = target_company_id
      AND cm.user_id = public.auth_user_id()
      AND cm.status = 'active'
      AND c.status = 'active'
      AND (
        cm.is_owner = true
        OR (r.is_company_admin = true)
        OR public.has_company_permission(target_company_id, 'manage_company')
      )
  )
$$;

REVOKE ALL ON FUNCTION public.is_company_member(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_company_permission(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_company_admin(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_company_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_company_permission(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_admin(uuid) TO anon, authenticated;

DROP FUNCTION IF EXISTS public._is_company_admin_internal(uuid);
DROP FUNCTION IF EXISTS public._has_company_permission_internal(uuid, text);
DROP FUNCTION IF EXISTS public._is_company_member_internal(uuid);

COMMIT;
