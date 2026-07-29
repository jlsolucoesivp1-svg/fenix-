BEGIN;

-- A company administrator is an administrator only within its own active
-- membership. This keeps the tenant boundary in the RLS predicate while
-- making the existing roles.is_company_admin flag effective everywhere.
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
      AND c.status IN ('active', 'trial')
      AND (
        cm.is_owner = true
        OR r.is_company_admin = true
        OR p.code = permission_code
      )
  )
$$;

COMMIT;
