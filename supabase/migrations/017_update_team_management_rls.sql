-- Update RLS policies to allow project managers to manage team members
-- This allows project managers to create, update, and delete team members in their organization

-- Drop the existing policy that only allows super_admin and hr_manager
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;

-- Create new policy that includes project_manager
CREATE POLICY "Admins and PMs can manage users"
    ON app_users FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    );

-- Update user_roles policy to allow project managers to assign roles
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

CREATE POLICY "Admins and PMs can manage user roles"
    ON user_roles FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    );

-- Update the view policy for user_roles to include project managers
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Users can view own roles"
    ON user_roles FOR SELECT
    USING (
        user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    );
