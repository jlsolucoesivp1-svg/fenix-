BEGIN;

DROP POLICY IF EXISTS audit_logs_select_admin ON public.audit_logs;

DROP POLICY IF EXISTS memberships_delete_admin ON public.company_memberships;
DROP POLICY IF EXISTS memberships_update_admin ON public.company_memberships;
DROP POLICY IF EXISTS memberships_insert_admin ON public.company_memberships;
DROP POLICY IF EXISTS memberships_select_member ON public.company_memberships;

DROP POLICY IF EXISTS role_permissions_delete_admin ON public.role_permissions;
DROP POLICY IF EXISTS role_permissions_insert_admin ON public.role_permissions;
DROP POLICY IF EXISTS role_permissions_select_member ON public.role_permissions;

DROP POLICY IF EXISTS roles_delete_admin ON public.roles;
DROP POLICY IF EXISTS roles_update_admin ON public.roles;
DROP POLICY IF EXISTS roles_insert_admin ON public.roles;
DROP POLICY IF EXISTS roles_select_member ON public.roles;

DROP POLICY IF EXISTS companies_update_admin ON public.companies;
DROP POLICY IF EXISTS companies_select_member ON public.companies;

DROP POLICY IF EXISTS permissions_select_authenticated ON public.permissions;

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS profiles_select_self ON public.profiles;

DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.company_memberships;
DROP TABLE IF EXISTS public.role_permissions;
DROP TABLE IF EXISTS public.roles;
DROP TABLE IF EXISTS public.permissions;
DROP TABLE IF EXISTS public.companies;
DROP TABLE IF EXISTS public.profiles;

DROP FUNCTION IF EXISTS public.is_company_admin(uuid);
DROP FUNCTION IF EXISTS public.has_company_permission(uuid, text);
DROP FUNCTION IF EXISTS public.is_company_member(uuid);
DROP FUNCTION IF EXISTS public.current_company_id();
DROP FUNCTION IF EXISTS public.auth_user_id();

COMMIT;
