-- Row Level Security Policies for Project Expenses

-- =====================================================
-- Enable RLS
-- =====================================================
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EXPENSE_CATEGORIES Policies
-- =====================================================
-- Users can view categories from their organization
CREATE POLICY "Users can view organization expense categories"
    ON expense_categories FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Super admins and project managers can manage categories
CREATE POLICY "Admins and PMs can manage expense categories"
    ON expense_categories FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- PROJECT_EXPENSES Policies
-- =====================================================
-- Users can view expenses for projects in their organization
CREATE POLICY "Users can view organization project expenses"
    ON project_expenses FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN app_users au ON p.organization_id = au.organization_id
            WHERE au.user_id = (SELECT auth.uid())
        )
    );

-- Project managers and super admins can create expenses
CREATE POLICY "Admins and PMs can create expenses"
    ON project_expenses FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR public.user_has_role('site_engineer')
    );

-- Project managers and super admins can update expenses
CREATE POLICY "Admins and PMs can update expenses"
    ON project_expenses FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR public.user_has_role('site_engineer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR public.user_has_role('site_engineer')
    );

-- Only super admins and project managers can delete expenses
CREATE POLICY "Admins and PMs can delete expenses"
    ON project_expenses FOR DELETE
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- BUDGET_ALLOCATIONS Policies
-- =====================================================
-- Users can view budget allocations for their organization projects
CREATE POLICY "Users can view organization budget allocations"
    ON budget_allocations FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN app_users au ON p.organization_id = au.organization_id
            WHERE au.user_id = (SELECT auth.uid())
        )
    );

-- Project managers and super admins can manage budget allocations
CREATE POLICY "Admins and PMs can manage budget allocations"
    ON budget_allocations FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );
