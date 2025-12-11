-- =====================================================
-- AGENTS MODULE COMPLETE SETUP SCRIPT
-- Run this script in Supabase SQL Editor
-- =====================================================

-- Step 1: Add agent and agent_manager roles
-- =====================================================
INSERT INTO roles (name, description) VALUES
('agent', 'Real Estate Agent - Can manage own profile, clients, and commissions'),
('agent_manager', 'Agent Manager / Sales Manager - Can manage team agents and approve commissions')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create agents database schema
-- =====================================================

-- AGENTS TABLE
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    license_number VARCHAR(100),
    license_expiry_date DATE,
    license_state VARCHAR(100),
    certifications TEXT[],
    employment_status VARCHAR(50) DEFAULT 'active',
    employment_type VARCHAR(50) DEFAULT 'full_time',
    hire_date DATE,
    termination_date DATE,
    specializations TEXT[],
    agent_level VARCHAR(50) DEFAULT 'junior',
    manager_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    commission_type VARCHAR(50) DEFAULT 'percentage',
    commission_rate DECIMAL(5, 2) DEFAULT 3.00,
    commission_split_enabled BOOLEAN DEFAULT FALSE,
    total_sales_count INTEGER DEFAULT 0,
    total_sales_value DECIMAL(15, 2) DEFAULT 0,
    total_commission_earned DECIMAL(15, 2) DEFAULT 0,
    average_deal_size DECIMAL(15, 2) DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    profile_photo_url TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- AGENT TERRITORIES
CREATE TABLE IF NOT EXISTS agent_territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    territory_name VARCHAR(255) NOT NULL,
    territory_type VARCHAR(50) DEFAULT 'geographic',
    cities TEXT[],
    states TEXT[],
    postal_codes TEXT[],
    coordinates JSONB,
    sales_count INTEGER DEFAULT 0,
    sales_value DECIMAL(15, 2) DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AGENT COMMISSIONS
CREATE TABLE IF NOT EXISTS agent_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    deal_description TEXT,
    sale_amount DECIMAL(15, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(15, 2) NOT NULL,
    split_percentage DECIMAL(5, 2) DEFAULT 100.00,
    final_commission DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payment_status VARCHAR(50) DEFAULT 'unpaid',
    transaction_date DATE NOT NULL,
    approval_date DATE,
    payment_date DATE,
    expected_payment_date DATE,
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    payment_amount DECIMAL(15, 2),
    notes TEXT,
    dispute_reason TEXT,
    approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AGENT PROPERTY ASSIGNMENTS
CREATE TABLE IF NOT EXISTS agent_property_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assignment_type VARCHAR(50) DEFAULT 'primary',
    assignment_status VARCHAR(50) DEFAULT 'active',
    listing_date DATE,
    listing_price DECIMAL(15, 2),
    expected_close_date DATE,
    actual_close_date DATE,
    final_sale_price DECIMAL(15, 2),
    views_count INTEGER DEFAULT 0,
    inquiries_count INTEGER DEFAULT 0,
    viewings_scheduled INTEGER DEFAULT 0,
    viewings_completed INTEGER DEFAULT 0,
    offers_received INTEGER DEFAULT 0,
    assigned_date DATE DEFAULT CURRENT_DATE,
    unassigned_date DATE,
    assigned_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, property_id)
);

-- AGENT CLIENTS
CREATE TABLE IF NOT EXISTS agent_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    client_type VARCHAR(50) DEFAULT 'buyer',
    status VARCHAR(50) DEFAULT 'active',
    priority VARCHAR(50) DEFAULT 'medium',
    budget_min DECIMAL(15, 2),
    budget_max DECIMAL(15, 2),
    property_preferences JSONB,
    first_contact_date DATE,
    last_contact_date DATE,
    next_follow_up_date DATE,
    total_interactions INTEGER DEFAULT 0,
    converted BOOLEAN DEFAULT FALSE,
    conversion_date DATE,
    conversion_value DECIMAL(15, 2),
    assigned_date DATE DEFAULT CURRENT_DATE,
    assigned_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AGENT ACTIVITIES
CREATE TABLE IF NOT EXISTS agent_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_status VARCHAR(50) DEFAULT 'completed',
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id UUID REFERENCES agent_clients(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    outcome VARCHAR(50),
    outcome_notes TEXT,
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AGENT DOCUMENTS
CREATE TABLE IF NOT EXISTS agent_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    document_number VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    expiry_alert_sent BOOLEAN DEFAULT FALSE,
    expiry_alert_date DATE,
    uploaded_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AGENT PERFORMANCE GOALS
CREATE TABLE IF NOT EXISTS agent_performance_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    goal_period VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER,
    quarter INTEGER,
    sales_count_goal INTEGER,
    sales_value_goal DECIMAL(15, 2),
    commission_goal DECIMAL(15, 2),
    calls_goal INTEGER,
    meetings_goal INTEGER,
    viewings_goal INTEGER,
    actual_sales_count INTEGER DEFAULT 0,
    actual_sales_value DECIMAL(15, 2) DEFAULT 0,
    actual_commission DECIMAL(15, 2) DEFAULT 0,
    actual_calls INTEGER DEFAULT 0,
    actual_meetings INTEGER DEFAULT 0,
    actual_viewings INTEGER DEFAULT 0,
    goal_achieved BOOLEAN DEFAULT FALSE,
    achievement_percentage DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(agent_id, goal_period, year, month, quarter)
);

-- Step 3: Create indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agents_organization_id ON agents(organization_id);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(employment_status);
CREATE INDEX IF NOT EXISTS idx_agents_manager_id ON agents(manager_id);
CREATE INDEX IF NOT EXISTS idx_agents_license_expiry ON agents(license_expiry_date);

CREATE INDEX IF NOT EXISTS idx_agent_territories_agent_id ON agent_territories(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_territories_organization_id ON agent_territories(organization_id);

CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent_id ON agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_organization_id ON agent_commissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON agent_commissions(status);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_payment_status ON agent_commissions(payment_status);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_transaction_date ON agent_commissions(transaction_date);

CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_status ON agent_property_assignments(assignment_status);

CREATE INDEX IF NOT EXISTS idx_agent_clients_agent_id ON agent_clients(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_clients_lead_id ON agent_clients(lead_id);
CREATE INDEX IF NOT EXISTS idx_agent_clients_status ON agent_clients(status);
CREATE INDEX IF NOT EXISTS idx_agent_clients_next_follow_up ON agent_clients(next_follow_up_date);

CREATE INDEX IF NOT EXISTS idx_agent_activities_agent_id ON agent_activities(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_activities_type ON agent_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_agent_activities_scheduled_date ON agent_activities(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_agent_activities_client_id ON agent_activities(client_id);

CREATE INDEX IF NOT EXISTS idx_agent_documents_agent_id ON agent_documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_documents_type ON agent_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_agent_documents_expiry_date ON agent_documents(expiry_date);

CREATE INDEX IF NOT EXISTS idx_agent_performance_goals_agent_id ON agent_performance_goals(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_performance_goals_period ON agent_performance_goals(goal_period, year, month, quarter);

-- Step 4: Create triggers for updated_at
-- =====================================================
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_territories_updated_at BEFORE UPDATE ON agent_territories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_commissions_updated_at BEFORE UPDATE ON agent_commissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_property_assignments_updated_at BEFORE UPDATE ON agent_property_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_clients_updated_at BEFORE UPDATE ON agent_clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_activities_updated_at BEFORE UPDATE ON agent_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_documents_updated_at BEFORE UPDATE ON agent_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_performance_goals_updated_at BEFORE UPDATE ON agent_performance_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create helper functions
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_agent_performance(p_agent_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    total_sales INTEGER,
    total_sales_value DECIMAL(15, 2),
    total_commission DECIMAL(15, 2),
    avg_deal_size DECIMAL(15, 2),
    conversion_rate DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total_sales,
        COALESCE(SUM(sale_amount), 0)::DECIMAL(15, 2) as total_sales_value,
        COALESCE(SUM(final_commission), 0)::DECIMAL(15, 2) as total_commission,
        COALESCE(AVG(sale_amount), 0)::DECIMAL(15, 2) as avg_deal_size,
        CASE
            WHEN COUNT(*) > 0 THEN
                (COUNT(*) FILTER (WHERE status = 'paid')::DECIMAL / COUNT(*)::DECIMAL * 100)::DECIMAL(5, 2)
            ELSE 0
        END as conversion_rate
    FROM agent_commissions
    WHERE agent_id = p_agent_id
    AND transaction_date BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_top_agents(p_organization_id UUID, p_limit INTEGER DEFAULT 10, p_period VARCHAR DEFAULT 'month')
RETURNS TABLE (
    agent_id UUID,
    agent_name VARCHAR(255),
    total_sales INTEGER,
    total_revenue DECIMAL(15, 2),
    total_commission DECIMAL(15, 2),
    rank INTEGER
) AS $$
DECLARE
    v_start_date DATE;
BEGIN
    v_start_date := CASE p_period
        WHEN 'week' THEN CURRENT_DATE - INTERVAL '7 days'
        WHEN 'month' THEN CURRENT_DATE - INTERVAL '30 days'
        WHEN 'quarter' THEN CURRENT_DATE - INTERVAL '90 days'
        WHEN 'year' THEN CURRENT_DATE - INTERVAL '365 days'
        ELSE CURRENT_DATE - INTERVAL '30 days'
    END;

    RETURN QUERY
    SELECT
        a.id as agent_id,
        (a.first_name || ' ' || a.last_name)::VARCHAR(255) as agent_name,
        COUNT(c.id)::INTEGER as total_sales,
        COALESCE(SUM(c.sale_amount), 0)::DECIMAL(15, 2) as total_revenue,
        COALESCE(SUM(c.final_commission), 0)::DECIMAL(15, 2) as total_commission,
        ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.final_commission), 0) DESC)::INTEGER as rank
    FROM agents a
    LEFT JOIN agent_commissions c ON a.id = c.agent_id AND c.transaction_date >= v_start_date
    WHERE a.organization_id = p_organization_id
    AND a.employment_status = 'active'
    GROUP BY a.id, a.first_name, a.last_name
    ORDER BY total_commission DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Enable RLS on all tables
-- =====================================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_goals ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
-- =====================================================

-- AGENTS POLICIES
CREATE POLICY "Super admins and agent managers can view all agents"
    ON agents FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Agents can view own profile"
    ON agents FOR SELECT
    USING (
        public.user_has_role('agent')
        AND user_id = auth.uid()
    );

CREATE POLICY "Super admins and agent managers can create agents"
    ON agents FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Super admins and agent managers can update agents"
    ON agents FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Agents can update own profile"
    ON agents FOR UPDATE
    USING (
        public.user_has_role('agent')
        AND user_id = auth.uid()
    );

CREATE POLICY "Super admins can delete agents"
    ON agents FOR DELETE
    USING (public.is_super_admin());

-- AGENT COMMISSIONS POLICIES
CREATE POLICY "Super admins and agent managers can view all commissions"
    ON agent_commissions FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Agents can view own commissions"
    ON agent_commissions FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins and agent managers can create commissions"
    ON agent_commissions FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Super admins and agent managers can update commissions"
    ON agent_commissions FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Super admins can delete commissions"
    ON agent_commissions FOR DELETE
    USING (public.is_super_admin());

-- AGENT CLIENTS POLICIES
CREATE POLICY "Super admins and agent managers can view all agent clients"
    ON agent_clients FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Agents can view own clients"
    ON agent_clients FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins and agent managers can assign clients"
    ON agent_clients FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Agents can create own client records"
    ON agent_clients FOR INSERT
    WITH CHECK (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agents and managers can update client records"
    ON agent_clients FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Super admins and agent managers can delete client assignments"
    ON agent_clients FOR DELETE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- AGENT ACTIVITIES POLICIES
CREATE POLICY "Super admins and agent managers can view all activities"
    ON agent_activities FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

CREATE POLICY "Agents can view own activities"
    ON agent_activities FOR SELECT
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agents can create own activities"
    ON agent_activities FOR INSERT
    WITH CHECK (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agents can update own activities"
    ON agent_activities FOR UPDATE
    USING (
        agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agents and managers can delete activities"
    ON agent_activities FOR DELETE
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (
            SELECT id FROM agents WHERE user_id = auth.uid()
        )
    );

-- AGENT TERRITORIES POLICIES (Basic - Full policies in separate migration)
CREATE POLICY "Users can view territories"
    ON agent_territories FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Managers can manage territories"
    ON agent_territories FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- AGENT PROPERTY ASSIGNMENTS POLICIES (Basic)
CREATE POLICY "Users can view property assignments"
    ON agent_property_assignments FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Managers can manage property assignments"
    ON agent_property_assignments FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- AGENT DOCUMENTS POLICIES (Basic)
CREATE POLICY "Users can view documents"
    ON agent_documents FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Managers can manage documents"
    ON agent_documents FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- AGENT PERFORMANCE GOALS POLICIES (Basic)
CREATE POLICY "Users can view goals"
    ON agent_performance_goals FOR SELECT
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
        OR agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    );

CREATE POLICY "Managers can manage goals"
    ON agent_performance_goals FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('agent_manager')
    );

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '✅ Agents module setup complete!';
    RAISE NOTICE '✅ Database schema created';
    RAISE NOTICE '✅ RLS policies applied';
    RAISE NOTICE '✅ Roles added (agent, agent_manager)';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Assign roles to users via user_roles table';
    RAISE NOTICE '2. Create test agents via the /agents/new page';
    RAISE NOTICE '3. Test the agents module functionality';
END $$;
