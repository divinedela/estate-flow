-- Row Level Security (RLS) Policies for Marketing/CRM Module Tables

-- =====================================================
-- Enable RLS on all CRM tables
-- =====================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CAMPAIGNS Policies
-- =====================================================
-- Users in organization can view campaigns
CREATE POLICY "Users can view campaigns in organization"
    ON campaigns FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Marketing officers and super admins can manage campaigns
CREATE POLICY "Marketing can manage campaigns"
    ON campaigns FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    );

-- =====================================================
-- CONTACTS Policies
-- =====================================================
-- Users in organization can view contacts
CREATE POLICY "Users can view contacts in organization"
    ON contacts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Marketing officers and super admins can manage contacts
CREATE POLICY "Marketing can manage contacts"
    ON contacts FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    );

-- =====================================================
-- LEADS Policies
-- =====================================================
-- Users can view leads in their organization
CREATE POLICY "Users can view leads in organization"
    ON leads FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Users can view their own assigned leads
CREATE POLICY "Users can view assigned leads"
    ON leads FOR SELECT
    USING (
        assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- Marketing officers can manage all leads
CREATE POLICY "Marketing can manage leads"
    ON leads FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    );

-- Users can update their own assigned leads
CREATE POLICY "Users can update assigned leads"
    ON leads FOR UPDATE
    USING (
        assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    )
    WITH CHECK (
        assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- =====================================================
-- PROPERTIES Policies
-- =====================================================
-- Everyone in organization can view properties
CREATE POLICY "Users can view properties in organization"
    ON properties FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Marketing officers, project managers, and super admins can manage properties
CREATE POLICY "Authorized users can manage properties"
    ON properties FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- UNITS Policies
-- =====================================================
-- Everyone in organization can view units
CREATE POLICY "Users can view units in organization"
    ON units FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Marketing officers, project managers, and super admins can manage units
CREATE POLICY "Authorized users can manage units"
    ON units FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- INTERACTIONS Policies
-- =====================================================
-- Users can view interactions in their organization
CREATE POLICY "Users can view interactions in organization"
    ON interactions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Users can view interactions for their assigned leads
CREATE POLICY "Users can view interactions for assigned leads"
    ON interactions FOR SELECT
    USING (
        lead_id IN (
            SELECT id FROM leads 
            WHERE assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
    );

-- Users can create interactions for their assigned leads
CREATE POLICY "Users can create interactions for assigned leads"
    ON interactions FOR INSERT
    WITH CHECK (
        lead_id IN (
            SELECT id FROM leads 
            WHERE assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        OR public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    );

-- Marketing officers and super admins can manage all interactions
CREATE POLICY "Marketing can manage interactions"
    ON interactions FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('marketing_officer')
    );



