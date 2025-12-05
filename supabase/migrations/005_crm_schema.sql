-- Marketing/CRM Module Database Schema
-- This migration creates tables for campaigns, leads, contacts, properties, and interactions

-- =====================================================
-- CAMPAIGNS
-- =====================================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(100), -- e.g., 'digital', 'print', 'event', 'referral'
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'active', 'paused', 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- CONTACTS
-- =====================================================
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    phone_secondary VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    company VARCHAR(255),
    job_title VARCHAR(100),
    source VARCHAR(100), -- How they found us
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'do_not_contact'
    notes TEXT,
    tags TEXT[], -- Array of tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- LEADS
-- =====================================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES app_users(id) ON DELETE SET NULL,
    lead_source VARCHAR(100), -- e.g., 'website', 'referral', 'walk_in', 'campaign'
    status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'hot', 'warm', 'cold', 'converted', 'lost'
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high'
    interest_type VARCHAR(100), -- e.g., 'buy', 'rent', 'invest'
    budget_min DECIMAL(12, 2),
    budget_max DECIMAL(12, 2),
    preferred_location TEXT,
    preferred_property_type VARCHAR(100), -- e.g., 'apartment', 'villa', 'office', 'land'
    expected_timeline VARCHAR(100),
    notes TEXT,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    converted_to_customer_id UUID, -- Reference to customer/contact after conversion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- PROPERTIES
-- =====================================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID, -- Will reference projects table (created in Stage 3)
    property_code VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    property_type VARCHAR(100) NOT NULL, -- 'apartment', 'villa', 'office', 'shop', 'land', 'warehouse'
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_area DECIMAL(10, 2), -- in square meters/feet
    built_up_area DECIMAL(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    parking_spaces INTEGER,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'reserved', 'sold', 'leased', 'under_construction'
    listing_price DECIMAL(12, 2),
    rent_price DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    description TEXT,
    amenities TEXT[], -- Array of amenities
    images TEXT[], -- Array of image URLs (Supabase Storage)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- UNITS (Sub-properties, e.g., individual apartments in a building)
-- =====================================================
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    unit_number VARCHAR(50) NOT NULL,
    floor_number INTEGER,
    unit_type VARCHAR(100), -- e.g., 'studio', '1br', '2br', '3br', 'penthouse'
    area DECIMAL(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'reserved', 'sold', 'leased', 'maintenance'
    listing_price DECIMAL(12, 2),
    rent_price DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    description TEXT,
    images TEXT[], -- Array of image URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(property_id, unit_number)
);

-- =====================================================
-- INTERACTIONS (Calls, emails, visits, follow-ups)
-- =====================================================
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'site_visit', 'follow_up', 'note'
    subject VARCHAR(255),
    description TEXT,
    interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    outcome VARCHAR(100), -- e.g., 'interested', 'not_interested', 'follow_up_required', 'converted'
    next_action TEXT,
    next_action_date TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_campaigns_organization_id ON campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_contact_id ON leads(contact_id);
CREATE INDEX idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_next_follow_up ON leads(next_follow_up_date) WHERE next_follow_up_date IS NOT NULL;
CREATE INDEX idx_properties_organization_id ON properties(organization_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_units_property_id ON units(property_id);
CREATE INDEX idx_units_status ON units(status);
CREATE INDEX idx_interactions_organization_id ON interactions(organization_id);
CREATE INDEX idx_interactions_lead_id ON interactions(lead_id);
CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_interactions_type ON interactions(interaction_type);
CREATE INDEX idx_interactions_date ON interactions(interaction_date);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at for CRM tables
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create notification for overdue follow-ups
CREATE OR REPLACE FUNCTION notify_overdue_followup()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.next_follow_up_date IS NOT NULL AND NEW.next_follow_up_date < NOW() THEN
        -- Create notification for assigned user
        INSERT INTO notifications (user_id, type, title, message, payload)
        SELECT 
            NEW.assigned_to,
            'overdue_followup',
            'Overdue Follow-up',
            'Lead "' || COALESCE((SELECT first_name || ' ' || last_name FROM contacts WHERE id = NEW.contact_id), 'Unknown') || '" has an overdue follow-up',
            jsonb_build_object(
                'lead_id', NEW.id,
                'follow_up_date', NEW.next_follow_up_date
            )
        WHERE NEW.assigned_to IS NOT NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_overdue_followup
    AFTER INSERT OR UPDATE OF next_follow_up_date ON leads
    FOR EACH ROW
    WHEN (NEW.next_follow_up_date IS NOT NULL)
    EXECUTE FUNCTION notify_overdue_followup();

