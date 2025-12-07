-- Row Level Security (RLS) Policies for Project Management Module Tables

-- =====================================================
-- Enable RLS on all project tables
-- =====================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROJECTS Policies
-- =====================================================
-- Users can view projects in their organization
CREATE POLICY "Users can view projects in organization"
    ON projects FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Project managers, super admins, and team members can manage projects
CREATE POLICY "Authorized users can manage projects"
    ON projects FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR project_manager_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        OR id IN (
            SELECT project_id FROM project_team_members
            WHERE user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- PROJECT PHASES Policies
-- =====================================================
-- Users can view phases for projects they have access to
CREATE POLICY "Users can view project phases"
    ON project_phases FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Project managers and super admins can manage phases
CREATE POLICY "Managers can manage project phases"
    ON project_phases FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR project_id IN (
            SELECT id FROM projects
            WHERE project_manager_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- PROJECT MILESTONES Policies
-- =====================================================
-- Users can view milestones for projects they have access to
CREATE POLICY "Users can view project milestones"
    ON project_milestones FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
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
-- PROJECT TASKS Policies
-- =====================================================
-- Users can view tasks for projects they have access to
CREATE POLICY "Users can view project tasks"
    ON project_tasks FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Users can view their assigned tasks
CREATE POLICY "Users can view assigned tasks"
    ON project_tasks FOR SELECT
    USING (
        assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- Users can update their assigned tasks
CREATE POLICY "Users can update assigned tasks"
    ON project_tasks FOR UPDATE
    USING (
        assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    )
    WITH CHECK (
        assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- Project managers and super admins can manage all tasks
CREATE POLICY "Managers can manage project tasks"
    ON project_tasks FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR project_id IN (
            SELECT id FROM projects
            WHERE project_manager_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- PROJECT TEAM MEMBERS Policies
-- =====================================================
-- Users can view team members for projects they have access to
CREATE POLICY "Users can view project team members"
    ON project_team_members FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
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
-- PROJECT ISSUES Policies
-- =====================================================
-- Users can view issues for projects they have access to
CREATE POLICY "Users can view project issues"
    ON project_issues FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Users can create issues for projects they have access to
CREATE POLICY "Users can create project issues"
    ON project_issues FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Users can update issues assigned to them
CREATE POLICY "Users can update assigned issues"
    ON project_issues FOR UPDATE
    USING (
        assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    )
    WITH CHECK (
        assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
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
-- PROJECT DOCUMENTS Policies
-- =====================================================
-- Users can view documents for projects they have access to
CREATE POLICY "Users can view project documents"
    ON project_documents FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Users can upload documents to projects they have access to
CREATE POLICY "Users can upload project documents"
    ON project_documents FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
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



