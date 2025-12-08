-- Row Level Security (RLS) Policies for Core Tables
-- These policies enforce role-based and organization-based access control

-- =====================================================
-- Enable RLS on all tables
-- =====================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Helper function to get current user's app_user_id
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION public.user_has_role(p_role_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        JOIN app_users au ON ur.user_id = au.id
        WHERE au.user_id = (SELECT auth.uid())
        AND r.name = p_role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.user_has_role('super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ORGANIZATIONS Policies
-- =====================================================
-- Super admins can do everything
CREATE POLICY "Super admins can manage all organizations"
    ON organizations FOR ALL
    USING (public.is_super_admin());

-- Users can view their own organization
CREATE POLICY "Users can view their organization"
    ON organizations FOR SELECT
    USING (
        id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
        OR id IN (
            SELECT ur.organization_id FROM user_roles ur
            JOIN app_users au ON ur.user_id = au.id
            WHERE au.user_id = (SELECT auth.uid())
        )
    );

-- =====================================================
-- ROLES Policies
-- =====================================================
-- Everyone can view roles (for UI dropdowns)
CREATE POLICY "Everyone can view roles"
    ON roles FOR SELECT
    USING (TRUE);

-- Only super admins can modify roles
CREATE POLICY "Super admins can manage roles"
    ON roles FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- =====================================================
-- PERMISSIONS Policies
-- =====================================================
-- Everyone can view permissions
CREATE POLICY "Everyone can view permissions"
    ON permissions FOR SELECT
    USING (TRUE);

-- Only super admins can manage permissions
CREATE POLICY "Super admins can manage permissions"
    ON permissions FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- =====================================================
-- ROLE_PERMISSIONS Policies
-- =====================================================
-- Everyone can view role permissions
CREATE POLICY "Everyone can view role permissions"
    ON role_permissions FOR SELECT
    USING (TRUE);

-- Only super admins can manage role permissions
CREATE POLICY "Super admins can manage role permissions"
    ON role_permissions FOR ALL
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- =====================================================
-- APP_USERS Policies
-- =====================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON app_users FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- Users can view other users in their organization
CREATE POLICY "Users can view organization members"
    ON app_users FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
        OR public.is_super_admin()
    );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
    ON app_users FOR UPDATE
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- Super admins and HR managers can manage users
CREATE POLICY "Admins can manage users"
    ON app_users FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- USER_ROLES Policies
-- =====================================================
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
    ON user_roles FOR SELECT
    USING (
        user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- Only super admins and HR managers can assign roles
CREATE POLICY "Admins can manage user roles"
    ON user_roles FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- NOTIFICATIONS Policies
-- =====================================================
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid())));

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid())))
    WITH CHECK (user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid())));

-- System can create notifications (via service role or triggers)
-- Note: In production, notifications should be created via Edge Functions or service role

-- =====================================================
-- AUDIT_LOGS Policies
-- =====================================================
-- Users can view audit logs for their own actions
CREATE POLICY "Users can view own audit logs"
    ON audit_logs FOR SELECT
    USING (
        actor_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- Super admins can view all audit logs
CREATE POLICY "Super admins can view all audit logs"
    ON audit_logs FOR SELECT
    USING (public.is_super_admin());

-- Only system can create audit logs (via triggers or service role)
-- Note: In production, audit logs should be created via triggers or Edge Functions

