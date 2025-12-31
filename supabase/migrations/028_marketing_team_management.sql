-- Marketing Team Management Schema
-- This migration adds support for marketing managers to create and manage team members

-- =====================================================
-- ADD MARKETING TEAM MEMBER ROLE
-- =====================================================
INSERT INTO roles (name, description, is_system) VALUES
    ('marketing_team_member', 'Marketing team member with limited client management access', TRUE)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- MARKETING TEAMS TABLE
-- Tracks relationships between marketing managers and their team members
-- =====================================================
CREATE TABLE IF NOT EXISTS marketing_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    team_member_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES app_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(manager_id, team_member_id, organization_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketing_teams_manager ON marketing_teams(manager_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_marketing_teams_member ON marketing_teams(team_member_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_marketing_teams_org ON marketing_teams(organization_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if a user is a marketing manager
CREATE OR REPLACE FUNCTION is_marketing_manager()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN app_users au ON au.id = ur.user_id
        WHERE au.user_id = auth.uid()
        AND r.name = 'marketing_officer'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is a marketing team member
CREATE OR REPLACE FUNCTION is_marketing_team_member()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        JOIN app_users au ON au.id = ur.user_id
        WHERE au.user_id = auth.uid()
        AND r.name = 'marketing_team_member'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get manager ID for a team member
CREATE OR REPLACE FUNCTION get_team_member_manager_id()
RETURNS UUID AS $$
DECLARE
    current_user_id UUID;
    manager_id UUID;
BEGIN
    -- Get the app_users id for the current auth user
    SELECT id INTO current_user_id
    FROM app_users
    WHERE user_id = auth.uid();

    -- Get the manager_id for this team member
    SELECT mt.manager_id INTO manager_id
    FROM marketing_teams mt
    WHERE mt.team_member_id = current_user_id
    AND mt.is_active = TRUE
    LIMIT 1;

    RETURN manager_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a lead is assigned to user's team
CREATE OR REPLACE FUNCTION is_lead_in_my_team(lead_assigned_to UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the app_users id for the current auth user
    SELECT id INTO current_user_id
    FROM app_users
    WHERE user_id = auth.uid();

    -- Check if the lead is assigned to:
    -- 1. The current user directly, OR
    -- 2. Any of the current user's team members (if user is a marketing manager)
    RETURN EXISTS (
        SELECT 1 WHERE lead_assigned_to = current_user_id
        OR EXISTS (
            SELECT 1 FROM marketing_teams mt
            WHERE mt.manager_id = current_user_id
            AND mt.team_member_id = lead_assigned_to
            AND mt.is_active = TRUE
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES FOR MARKETING_TEAMS TABLE
-- =====================================================

-- Enable RLS
ALTER TABLE marketing_teams ENABLE ROW LEVEL SECURITY;

-- Marketing managers can view their team
CREATE POLICY marketing_teams_view_own_team ON marketing_teams
    FOR SELECT
    USING (
        manager_id = get_user_id()
        OR is_super_admin()
    );

-- Team members can view their manager relationship
CREATE POLICY marketing_teams_view_own_membership ON marketing_teams
    FOR SELECT
    USING (
        team_member_id = get_user_id()
        OR is_super_admin()
    );

-- Only marketing managers and super admins can insert team members
CREATE POLICY marketing_teams_insert ON marketing_teams
    FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR (is_marketing_manager() AND manager_id = get_user_id())
    );

-- Only marketing managers and super admins can update team members
CREATE POLICY marketing_teams_update ON marketing_teams
    FOR UPDATE
    USING (
        is_super_admin()
        OR (is_marketing_manager() AND manager_id = get_user_id())
    );

-- Only marketing managers and super admins can delete team relationships
CREATE POLICY marketing_teams_delete ON marketing_teams
    FOR DELETE
    USING (
        is_super_admin()
        OR (is_marketing_manager() AND manager_id = get_user_id())
    );

-- =====================================================
-- UPDATE LEADS RLS POLICIES
-- Add policies for team member access to leads
-- =====================================================

-- Drop existing lead policies that might conflict
DROP POLICY IF EXISTS leads_view_assigned ON leads;
DROP POLICY IF EXISTS leads_update_assigned ON leads;

-- Marketing team members can view leads assigned to them
CREATE POLICY leads_view_team_assigned ON leads
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM user_roles
            WHERE user_id = get_user_id()
        )
        AND (
            assigned_to = get_user_id() -- Assigned directly to user
            OR is_super_admin()
            OR is_marketing_manager()
            OR EXISTS ( -- User is the manager of the assigned person
                SELECT 1 FROM marketing_teams mt
                WHERE mt.manager_id = get_user_id()
                AND mt.team_member_id = assigned_to
                AND mt.is_active = TRUE
            )
        )
    );

-- Team members can update leads assigned to them
CREATE POLICY leads_update_team_assigned ON leads
    FOR UPDATE
    USING (
        (assigned_to = get_user_id() AND (is_marketing_team_member() OR is_marketing_manager()))
        OR is_super_admin()
        OR (is_marketing_manager() AND is_lead_in_my_team(assigned_to))
    );

-- Marketing managers can assign/reassign leads to their team members
CREATE POLICY leads_insert_by_manager ON leads
    FOR INSERT
    WITH CHECK (
        is_super_admin()
        OR is_marketing_manager()
    );

-- =====================================================
-- PERMISSIONS FOR MARKETING TEAM MEMBERS
-- =====================================================

-- Add basic permissions for marketing team members
INSERT INTO permissions (name, description, resource, action) VALUES
    ('view_assigned_leads', 'View leads assigned to the user', 'marketing', 'read'),
    ('update_assigned_leads', 'Update leads assigned to the user', 'marketing', 'write'),
    ('view_contacts', 'View contact database', 'marketing', 'read'),
    ('create_interactions', 'Create interactions with clients', 'marketing', 'write')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to marketing_team_member role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'marketing_team_member'
AND p.name IN ('view_assigned_leads', 'update_assigned_leads', 'view_contacts', 'create_interactions')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp on marketing_teams
CREATE OR REPLACE FUNCTION update_marketing_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketing_teams_updated_at
    BEFORE UPDATE ON marketing_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_marketing_teams_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE marketing_teams IS 'Manages relationships between marketing managers and their team members';
COMMENT ON COLUMN marketing_teams.manager_id IS 'The marketing manager (marketing_officer role)';
COMMENT ON COLUMN marketing_teams.team_member_id IS 'The team member (marketing_team_member role)';
COMMENT ON COLUMN marketing_teams.is_active IS 'Whether this team relationship is currently active';
