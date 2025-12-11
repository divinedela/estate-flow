-- Agents Module - Row Level Security Policies

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_goals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- AGENTS TABLE POLICIES
-- =====================================================

-- Super admins and agent managers can view all agents in their organization
CREATE POLICY "Super admins and agent managers can view all agents"
    ON agents FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can view their own profile
CREATE POLICY "Agents can view own profile"
    ON agents FOR SELECT
    USING (
        public.user_has_role('agent')
        AND user_id = auth.uid()
    );

-- Super admins and agent managers can insert agents
CREATE POLICY "Super admins and agent managers can create agents"
    ON agents FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Super admins and agent managers can update agents
CREATE POLICY "Super admins and agent managers can update agents"
    ON agents FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can update own profile (limited fields)
CREATE POLICY "Agents can update own profile"
    ON agents FOR UPDATE
    USING (
        public.user_has_role('agent')
        AND user_id = auth.uid()
    );

-- Super admins can delete agents
CREATE POLICY "Super admins can delete agents"
    ON agents FOR DELETE
    USING (public.is_super_admin());

-- =====================================================
-- AGENT TERRITORIES POLICIES
-- =====================================================

-- Super admins and agent managers can view all territories
CREATE POLICY "Super admins and agent managers can view territories"
    ON agent_territories FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can view own territories
CREATE POLICY "Agents can view own territories"
    ON agent_territories FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Super admins and agent managers can manage territories
CREATE POLICY "Super admins and agent managers can manage territories"
    ON agent_territories FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- =====================================================
-- AGENT COMMISSIONS POLICIES
-- =====================================================

-- Super admins and agent managers can view all commissions
CREATE POLICY "Super admins and agent managers can view all commissions"
    ON agent_commissions FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can view own commissions
CREATE POLICY "Agents can view own commissions"
    ON agent_commissions FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Super admins and agent managers can create commissions
CREATE POLICY "Super admins and agent managers can create commissions"
    ON agent_commissions FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Super admins and agent managers can update commissions
CREATE POLICY "Super admins and agent managers can update commissions"
    ON agent_commissions FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Super admins can delete commissions
CREATE POLICY "Super admins can delete commissions"
    ON agent_commissions FOR DELETE
    USING (public.is_super_admin());

-- =====================================================
-- AGENT PROPERTY ASSIGNMENTS POLICIES
-- =====================================================

-- Super admins and agent managers can view all assignments
CREATE POLICY "Super admins and agent managers can view property assignments"
    ON agent_property_assignments FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can view own property assignments
CREATE POLICY "Agents can view own property assignments"
    ON agent_property_assignments FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Super admins and agent managers can manage property assignments
CREATE POLICY "Super admins and agent managers can manage property assignments"
    ON agent_property_assignments FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can update own property assignments (limited fields)
CREATE POLICY "Agents can update own property assignments"
    ON agent_property_assignments FOR UPDATE
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- AGENT CLIENTS POLICIES
-- =====================================================

-- Super admins and agent managers can view all clients
CREATE POLICY "Super admins and agent managers can view all agent clients"
    ON agent_clients FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can view own clients
CREATE POLICY "Agents can view own clients"
    ON agent_clients FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Super admins and agent managers can assign clients
CREATE POLICY "Super admins and agent managers can assign clients"
    ON agent_clients FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can create own client records
CREATE POLICY "Agents can create own client records"
    ON agent_clients FOR INSERT
    WITH CHECK (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Agents and managers can update client records
CREATE POLICY "Agents and managers can update client records"
    ON agent_clients FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Super admins and agent managers can delete client assignments
CREATE POLICY "Super admins and agent managers can delete client assignments"
    ON agent_clients FOR DELETE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- =====================================================
-- AGENT ACTIVITIES POLICIES
-- =====================================================

-- Super admins and agent managers can view all activities
CREATE POLICY "Super admins and agent managers can view all activities"
    ON agent_activities FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can view own activities
CREATE POLICY "Agents can view own activities"
    ON agent_activities FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Agents can create own activities
CREATE POLICY "Agents can create own activities"
    ON agent_activities FOR INSERT
    WITH CHECK (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Agents can update own activities
CREATE POLICY "Agents can update own activities"
    ON agent_activities FOR UPDATE
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Agents and managers can delete activities
CREATE POLICY "Agents and managers can delete activities"
    ON agent_activities FOR DELETE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- AGENT DOCUMENTS POLICIES
-- =====================================================

-- Super admins and agent managers can view all documents
CREATE POLICY "Super admins and agent managers can view all agent documents"
    ON agent_documents FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can view own documents
CREATE POLICY "Agents can view own documents"
    ON agent_documents FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Agents and managers can upload documents
CREATE POLICY "Agents and managers can upload documents"
    ON agent_documents FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Super admins and agent managers can manage documents
CREATE POLICY "Super admins and agent managers can manage documents"
    ON agent_documents FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- =====================================================
-- AGENT PERFORMANCE GOALS POLICIES
-- =====================================================

-- Super admins and agent managers can view all goals
CREATE POLICY "Super admins and agent managers can view all goals"
    ON agent_performance_goals FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- Agents can view own goals
CREATE POLICY "Agents can view own goals"
    ON agent_performance_goals FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- Super admins and agent managers can manage goals
CREATE POLICY "Super admins and agent managers can manage goals"
    ON agent_performance_goals FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );
