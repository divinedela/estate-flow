-- Agents Module Database Schema
-- This migration creates tables for real estate agents, commission tracking, and performance management

-- =====================================================
-- AGENTS
-- =====================================================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_users(id) ON DELETE SET NULL, -- Link to app user if they have login
    agent_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),

    -- License & Certifications
    license_number VARCHAR(100),
    license_expiry_date DATE,
    license_state VARCHAR(100),
    certifications TEXT[], -- Array of certifications

    -- Employment Details
    employment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'on_leave', 'inactive', 'terminated'
    employment_type VARCHAR(50) DEFAULT 'full_time', -- 'full_time', 'part_time', 'contract', 'independent'
    hire_date DATE,
    termination_date DATE,

    -- Specialization & Territory
    specializations TEXT[], -- e.g., ['residential', 'commercial', 'luxury', 'land']
    agent_level VARCHAR(50) DEFAULT 'junior', -- 'junior', 'senior', 'team_lead', 'manager'
    manager_id UUID REFERENCES agents(id) ON DELETE SET NULL, -- Reporting manager

    -- Commission Structure
    commission_type VARCHAR(50) DEFAULT 'percentage', -- 'percentage', 'flat_rate', 'tiered'
    commission_rate DECIMAL(5, 2) DEFAULT 3.00, -- Default 3% commission
    commission_split_enabled BOOLEAN DEFAULT FALSE,

    -- Performance
    total_sales_count INTEGER DEFAULT 0,
    total_sales_value DECIMAL(15, 2) DEFAULT 0,
    total_commission_earned DECIMAL(15, 2) DEFAULT 0,
    average_deal_size DECIMAL(15, 2) DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage

    -- Contact & Profile
    profile_photo_url TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    -- Additional Info
    notes TEXT,
    tags TEXT[],

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- AGENT TERRITORIES
-- =====================================================
CREATE TABLE agent_territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    territory_name VARCHAR(255) NOT NULL,
    territory_type VARCHAR(50) DEFAULT 'geographic', -- 'geographic', 'property_type', 'price_range'

    -- Geographic boundaries
    cities TEXT[], -- Array of cities
    states TEXT[], -- Array of states
    postal_codes TEXT[], -- Array of postal codes
    coordinates JSONB, -- GeoJSON for map boundaries

    -- Performance
    sales_count INTEGER DEFAULT 0,
    sales_value DECIMAL(15, 2) DEFAULT 0,

    is_primary BOOLEAN DEFAULT FALSE, -- Primary territory for this agent
    is_active BOOLEAN DEFAULT TRUE,
    assigned_date DATE DEFAULT CURRENT_DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGENT COMMISSIONS
-- =====================================================
CREATE TABLE agent_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'lease', 'renewal'
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

    -- Commission Calculation
    sale_amount DECIMAL(15, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(15, 2) NOT NULL,
    split_percentage DECIMAL(5, 2) DEFAULT 100.00, -- If split with other agents
    final_commission DECIMAL(15, 2) NOT NULL, -- After split

    -- Commission Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'paid', 'disputed', 'cancelled'
    payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'partially_paid', 'paid'

    -- Dates
    transaction_date DATE NOT NULL,
    approval_date DATE,
    payment_date DATE,
    expected_payment_date DATE,

    -- Payment Details
    payment_method VARCHAR(100),
    payment_reference VARCHAR(255),
    payment_amount DECIMAL(15, 2),

    -- Additional Info
    notes TEXT,
    dispute_reason TEXT,

    approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGENT PROPERTY ASSIGNMENTS
-- =====================================================
CREATE TABLE agent_property_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    assignment_type VARCHAR(50) DEFAULT 'primary', -- 'primary', 'secondary', 'co_agent'
    assignment_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'completed'

    -- Listing Details
    listing_date DATE,
    listing_price DECIMAL(15, 2),
    expected_close_date DATE,
    actual_close_date DATE,
    final_sale_price DECIMAL(15, 2),

    -- Performance
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

    UNIQUE(agent_id, property_id) -- One primary assignment per property per agent
);

-- =====================================================
-- AGENT CLIENT ASSIGNMENTS
-- =====================================================
CREATE TABLE agent_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Client Details
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    client_type VARCHAR(50) DEFAULT 'buyer', -- 'buyer', 'seller', 'tenant', 'landlord'

    -- Client Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'hot', 'cold', 'converted', 'lost'
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'

    -- Requirements
    budget_min DECIMAL(15, 2),
    budget_max DECIMAL(15, 2),
    property_preferences JSONB, -- Bedrooms, bathrooms, location, etc.

    -- Engagement
    first_contact_date DATE,
    last_contact_date DATE,
    next_follow_up_date DATE,
    total_interactions INTEGER DEFAULT 0,

    -- Conversion
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

-- =====================================================
-- AGENT ACTIVITIES
-- =====================================================
CREATE TABLE agent_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'viewing', 'follow_up', 'other'
    activity_status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'completed', 'cancelled', 'no_show'

    -- Related Records
    client_id UUID REFERENCES agent_clients(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

    -- Activity Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),

    -- Scheduling
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,

    -- Outcome
    outcome VARCHAR(50), -- 'successful', 'unsuccessful', 'rescheduled', 'no_response'
    outcome_notes TEXT,

    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGENT DOCUMENTS
-- =====================================================
CREATE TABLE agent_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    document_type VARCHAR(100) NOT NULL, -- 'license', 'certification', 'insurance', 'contract', 'other'
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,

    -- Document Details
    document_number VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    issuing_authority VARCHAR(255),

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'revoked', 'pending_renewal'

    -- Alerts
    expiry_alert_sent BOOLEAN DEFAULT FALSE,
    expiry_alert_date DATE,

    uploaded_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AGENT PERFORMANCE GOALS
-- =====================================================
CREATE TABLE agent_performance_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    goal_period VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'yearly'
    year INTEGER NOT NULL,
    month INTEGER, -- 1-12, null for quarterly/yearly
    quarter INTEGER, -- 1-4, null for monthly/yearly

    -- Sales Goals
    sales_count_goal INTEGER,
    sales_value_goal DECIMAL(15, 2),
    commission_goal DECIMAL(15, 2),

    -- Activity Goals
    calls_goal INTEGER,
    meetings_goal INTEGER,
    viewings_goal INTEGER,

    -- Actual Performance
    actual_sales_count INTEGER DEFAULT 0,
    actual_sales_value DECIMAL(15, 2) DEFAULT 0,
    actual_commission DECIMAL(15, 2) DEFAULT 0,
    actual_calls INTEGER DEFAULT 0,
    actual_meetings INTEGER DEFAULT 0,
    actual_viewings INTEGER DEFAULT 0,

    -- Achievement
    goal_achieved BOOLEAN DEFAULT FALSE,
    achievement_percentage DECIMAL(5, 2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(agent_id, goal_period, year, month, quarter)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_agents_organization_id ON agents(organization_id);
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_status ON agents(employment_status);
CREATE INDEX idx_agents_manager_id ON agents(manager_id);
CREATE INDEX idx_agents_license_expiry ON agents(license_expiry_date);

CREATE INDEX idx_agent_territories_agent_id ON agent_territories(agent_id);
CREATE INDEX idx_agent_territories_organization_id ON agent_territories(organization_id);

CREATE INDEX idx_agent_commissions_agent_id ON agent_commissions(agent_id);
CREATE INDEX idx_agent_commissions_organization_id ON agent_commissions(organization_id);
CREATE INDEX idx_agent_commissions_status ON agent_commissions(status);
CREATE INDEX idx_agent_commissions_payment_status ON agent_commissions(payment_status);
CREATE INDEX idx_agent_commissions_transaction_date ON agent_commissions(transaction_date);

CREATE INDEX idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);
CREATE INDEX idx_agent_property_assignments_status ON agent_property_assignments(assignment_status);

CREATE INDEX idx_agent_clients_agent_id ON agent_clients(agent_id);
CREATE INDEX idx_agent_clients_lead_id ON agent_clients(lead_id);
CREATE INDEX idx_agent_clients_status ON agent_clients(status);
CREATE INDEX idx_agent_clients_next_follow_up ON agent_clients(next_follow_up_date);

CREATE INDEX idx_agent_activities_agent_id ON agent_activities(agent_id);
CREATE INDEX idx_agent_activities_type ON agent_activities(activity_type);
CREATE INDEX idx_agent_activities_scheduled_date ON agent_activities(scheduled_date);
CREATE INDEX idx_agent_activities_client_id ON agent_activities(client_id);

CREATE INDEX idx_agent_documents_agent_id ON agent_documents(agent_id);
CREATE INDEX idx_agent_documents_type ON agent_documents(document_type);
CREATE INDEX idx_agent_documents_expiry_date ON agent_documents(expiry_date);

CREATE INDEX idx_agent_performance_goals_agent_id ON agent_performance_goals(agent_id);
CREATE INDEX idx_agent_performance_goals_period ON agent_performance_goals(goal_period, year, month, quarter);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at timestamp
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

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate agent performance metrics
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

-- Function to get top performing agents
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
    -- Calculate start date based on period
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
