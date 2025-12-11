-- Fix RLS policies for app_users INSERT operations
-- The issue is that the "Admins can manage users" policy might not be working correctly
-- for INSERT operations when creating new users

-- Drop the existing "Admins can manage users" policy
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

-- Recreate with explicit INSERT, UPDATE, DELETE policies
-- This ensures super admins can insert new users

-- INSERT policy: Super admins and HR managers can insert users
CREATE POLICY "Admins can insert users"
    ON app_users FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- UPDATE policy: Super admins and HR managers can update users
CREATE POLICY "Admins can update users"
    ON app_users FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- DELETE policy: Only super admins can delete users
CREATE POLICY "Super admins can delete users"
    ON app_users FOR DELETE
    USING (public.is_super_admin());

-- Note: SELECT policies are already handled by:
-- - "Users can view own profile"
-- - "Users can view organization members"
