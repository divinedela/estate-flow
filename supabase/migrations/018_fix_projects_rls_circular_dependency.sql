-- Fix RLS Circular Dependency in Projects Module
-- The projects policies were causing infinite recursion because they query app_users
-- within the RLS policy check, which can create circular dependencies

-- =====================================================
-- Drop existing problematic policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view projects in organization" ON projects;
DROP POLICY IF EXISTS "Authorized users can manage projects" ON projects;
DROP POLICY IF EXISTS "Users can view project phases" ON project_phases;
DROP POLICY IF EXISTS "Managers can manage project phases" ON project_phases;
DROP POLICY IF EXISTS "Users can view project milestones" ON project_milestones;
DROP POLICY IF EXISTS "Managers can manage project milestones" ON project_milestones;
DROP POLICY IF EXISTS "Users can view project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON project_tasks;
DROP POLICY IF EXISTS "Managers can manage project tasks" ON project_tasks;
DROP POLICY IF EXISTS "Users can view project team members" ON project_team_members;
DROP POLICY IF EXISTS "Managers can manage project team members" ON project_team_members;
DROP POLICY IF EXISTS "Users can view project issues" ON project_issues;
DROP POLICY IF EXISTS "Users can create project issues" ON project_issues;
DROP POLICY IF EXISTS "Users can update assigned issues" ON project_issues;
DROP POLICY IF EXISTS "Managers can manage project issues" ON project_issues;
DROP POLICY IF EXISTS "Users can view project documents" ON project_documents;
DROP POLICY IF EXISTS "Users can upload project documents" ON project_documents;
DROP POLICY IF EXISTS "Managers can manage project documents" ON project_documents;

-- =====================================================
-- Create helper function to get user's app_user id
-- This function uses SECURITY DEFINER to bypass RLS
-- =====================================================
-- Note: This function may already exist from migration 016, but we'll ensure it exists
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

-- =====================================================
-- Create helper function to check if user is project manager
-- This function uses SECURITY DEFINER to bypass RLS when querying projects
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_user_project_manager(p_project_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_app_user_id UUID;
BEGIN
    v_app_user_id := public.get_user_app_user_id();
    IF v_app_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN EXISTS (
        SELECT 1
        FROM projects
        WHERE id = p_project_id
        AND project_manager_id = v_app_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- Recreate PROJECTS policies without circular dependency
-- =====================================================

-- Users can view projects in their organization
CREATE POLICY "Users can view projects in organization"
    ON projects FOR SELECT
    USING (
        organization_id = public.get_user_organization_id()
        OR public.is_super_admin()
    );

-- Project managers, super admins, and team members can manage projects
-- Note: We removed the project_team_members check to avoid circular dependency
-- Team members can still view projects through the SELECT policy above
CREATE POLICY "Authorized users can manage projects"
    ON projects FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR project_manager_id = public.get_user_app_user_id()
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR organization_id = public.get_user_organization_id()
    );

-- =====================================================
-- Recreate PROJECT PHASES policies without circular dependency
-- =====================================================

-- Users can view phases for projects they have access to
CREATE POLICY "Users can view project phases"
    ON project_phases FOR SELECT
    USING (
        public.is_super_admin()
        OR project_id IN (
            SELECT id FROM projects
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Project managers and super admins can manage phases
CREATE POLICY "Managers can manage project phases"
    ON project_phases FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR public.is_user_project_manager(project_id)
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- Recreate PROJECT MILESTONES policies without circular dependency
-- =====================================================

-- Users can view milestones for projects they have access to
CREATE POLICY "Users can view project milestones"
    ON project_milestones FOR SELECT
    USING (
        public.is_super_admin()
        OR project_id IN (
            SELECT id FROM projects
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Project managers and super admins can manage milestones
CREATE POLICY "Managers can manage project milestones"
    ON project_milestones FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- Recreate PROJECT TASKS policies without circular dependency
-- =====================================================

-- Users can view tasks for projects they have access to
CREATE POLICY "Users can view project tasks"
    ON project_tasks FOR SELECT
    USING (
        public.is_super_admin()
        OR project_id IN (
            SELECT id FROM projects
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Users can view their assigned tasks
CREATE POLICY "Users can view assigned tasks"
    ON project_tasks FOR SELECT
    USING (
        assigned_to = public.get_user_app_user_id()
    );

-- Users can update their assigned tasks
CREATE POLICY "Users can update assigned tasks"
    ON project_tasks FOR UPDATE
    USING (
        assigned_to = public.get_user_app_user_id()
    )
    WITH CHECK (
        assigned_to = public.get_user_app_user_id()
    );

-- Project managers and super admins can manage all tasks
CREATE POLICY "Managers can manage project tasks"
    ON project_tasks FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR public.is_user_project_manager(project_id)
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- Recreate PROJECT TEAM MEMBERS policies without circular dependency
-- =====================================================

-- Users can view team members for projects they have access to
CREATE POLICY "Users can view project team members"
    ON project_team_members FOR SELECT
    USING (
        public.is_super_admin()
        OR project_id IN (
            SELECT id FROM projects
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Project managers and super admins can manage team members
CREATE POLICY "Managers can manage project team members"
    ON project_team_members FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- Recreate PROJECT ISSUES policies without circular dependency
-- =====================================================

-- Users can view issues for projects they have access to
CREATE POLICY "Users can view project issues"
    ON project_issues FOR SELECT
    USING (
        public.is_super_admin()
        OR project_id IN (
            SELECT id FROM projects
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Users can create issues for projects they have access to
CREATE POLICY "Users can create project issues"
    ON project_issues FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR project_id IN (
            SELECT id FROM projects
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Users can update issues assigned to them
CREATE POLICY "Users can update assigned issues"
    ON project_issues FOR UPDATE
    USING (
        assigned_to = public.get_user_app_user_id()
    )
    WITH CHECK (
        assigned_to = public.get_user_app_user_id()
    );

-- Project managers and super admins can manage all issues
CREATE POLICY "Managers can manage project issues"
    ON project_issues FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- Recreate PROJECT DOCUMENTS policies without circular dependency
-- =====================================================

-- Users can view documents for projects they have access to
CREATE POLICY "Users can view project documents"
    ON project_documents FOR SELECT
    USING (
        public.is_super_admin()
        OR project_id IN (
            SELECT id FROM projects
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Users can upload documents to projects they have access to
CREATE POLICY "Users can upload project documents"
    ON project_documents FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR project_id IN (
            SELECT id FROM projects
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Project managers and super admins can manage all documents
CREATE POLICY "Managers can manage project documents"
    ON project_documents FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

