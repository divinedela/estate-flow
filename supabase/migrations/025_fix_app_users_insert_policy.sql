-- Fix app_users INSERT policy for super admin user creation
-- When a super admin creates a new user via signUp, the context is the NEW user (not the admin)
-- So we need separate INSERT policy that allows super admins to insert on behalf of others

-- =====================================================
-- Drop and recreate the "Admins can manage users" policy
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

-- Super admins and HR managers can UPDATE and DELETE users
CREATE POLICY "Admins can update and delete users"
    ON app_users FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

CREATE POLICY "Admins can delete users"
    ON app_users FOR DELETE
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- Super admins and HR managers can INSERT new users
-- This is more permissive to allow creating users
CREATE POLICY "Admins can insert users"
    ON app_users FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- Also need to ensure super admins can read all users
-- =====================================================
DROP POLICY IF EXISTS "Super admins can view all users" ON app_users;

CREATE POLICY "Super admins can view all users"
    ON app_users FOR SELECT
    USING (public.is_super_admin());
