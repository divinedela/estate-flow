-- Fix RLS SELECT policies for app_users
-- The 406 error suggests the policies might be conflicting or not working correctly
-- 406 (Not Acceptable) in PostgREST usually means RLS policy evaluation failed

-- Drop existing SELECT policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON app_users;
DROP POLICY IF EXISTS "Users can view organization members" ON app_users;

-- Ensure helper functions exist (they should from migration 016)
-- But let's make sure they're properly defined
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT organization_id 
        FROM app_users 
        WHERE user_id = (SELECT auth.uid())
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Recreate "Users can view own profile" policy
-- This should always work for authenticated users viewing their own record
-- Using a simpler check to avoid any evaluation issues
CREATE POLICY "Users can view own profile"
    ON app_users FOR SELECT
    USING (
        user_id IS NOT NULL 
        AND user_id = (SELECT auth.uid())
    );

-- Recreate "Users can view organization members" policy
-- Uses helper function to avoid circular dependency
-- Super admins can always view
CREATE POLICY "Users can view organization members"
    ON app_users FOR SELECT
    USING (
        public.is_super_admin()
        OR (
            organization_id IS NOT NULL
            AND organization_id = public.get_user_organization_id()
        )
    );

-- Note: Policies are evaluated with OR logic, so if either policy matches, access is granted
