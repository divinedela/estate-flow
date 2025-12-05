-- Fix RLS Circular Dependency in app_users policies
-- The "Users can view organization members" policy was causing infinite recursion
-- because it queries app_users within the RLS policy check

-- =====================================================
-- Drop existing problematic policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view organization members" ON app_users;
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

-- =====================================================
-- Create helper function to get user's organization_id
-- This function uses SECURITY DEFINER to bypass RLS
-- =====================================================
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

-- =====================================================
-- Recreate app_users policies without circular dependency
-- =====================================================

-- Users can view their own profile (unchanged - this is fine)
-- Policy already exists, no need to recreate

-- Users can view other users in their organization (FIXED)
-- Now uses the helper function which bypasses RLS
CREATE POLICY "Users can view organization members"
    ON app_users FOR SELECT
    USING (
        organization_id = public.get_user_organization_id()
        OR public.is_super_admin()
    );

-- =====================================================
-- Recreate user_roles policies without circular dependency
-- =====================================================

-- Users can view their own roles (FIXED)
-- Now uses the helper function to get app_user id
CREATE OR REPLACE FUNCTION public.get_user_app_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM app_users 
        WHERE user_id = (SELECT auth.uid())
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Users can view own roles"
    ON user_roles FOR SELECT
    USING (
        user_id = public.get_user_app_user_id()
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

