-- Facility Management Module Database Schema
-- This migration creates tables for facilities, estates, units, assets, maintenance requests, and work orders

-- =====================================================
-- FACILITIES / ESTATES
-- =====================================================
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    facility_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100), -- 'residential', 'commercial', 'mixed_use', 'office', 'retail'
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    total_units INTEGER,
    total_area DECIMAL(12, 2),
    year_built INTEGER,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'under_construction', 'renovation', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(organization_id, facility_code)
);

-- =====================================================
-- UNITS (Apartments, offices, shops within facilities)
-- =====================================================
CREATE TABLE facility_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    unit_number VARCHAR(50) NOT NULL,
    unit_type VARCHAR(100), -- 'apartment', 'office', 'shop', 'warehouse', 'parking'
    floor_number INTEGER,
    area DECIMAL(10, 2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'occupied', 'maintenance', 'reserved'
    current_tenant_id UUID, -- Reference to contact/lead if applicable
    rent_amount DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(facility_id, unit_number)
);

-- =====================================================
-- ASSETS (Equipment, machinery, fixtures)
-- =====================================================
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES facility_units(id) ON DELETE SET NULL,
    asset_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(100), -- 'hvac', 'elevator', 'generator', 'plumbing', 'electrical', 'security'
    manufacturer VARCHAR(255),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    warranty_expiry_date DATE,
    installation_date DATE,
    location_description TEXT,
    status VARCHAR(50) DEFAULT 'operational', -- 'operational', 'maintenance', 'out_of_service', 'retired'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(organization_id, asset_code)
);

-- =====================================================
-- MAINTENANCE REQUESTS
-- =====================================================
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES facility_units(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    request_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    request_type VARCHAR(100), -- 'repair', 'preventive', 'inspection', 'emergency', 'upgrade'
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent', 'emergency'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'assigned', 'in_progress', 'completed', 'cancelled'
    requested_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    requested_date DATE DEFAULT CURRENT_DATE,
    requested_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_to UUID REFERENCES app_users(id) ON DELETE SET NULL,
    assigned_date DATE,
    completed_date DATE,
    completion_notes TEXT,
    photos TEXT[], -- Array of photo URLs (Supabase Storage)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MAINTENANCE WORK ORDERS
-- =====================================================
CREATE TABLE maintenance_work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    work_order_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES app_users(id) ON DELETE SET NULL,
    vendor_id UUID, -- Reference to supplier/vendor if external
    scheduled_date DATE,
    scheduled_time TIME,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    labor_cost DECIMAL(12, 2),
    material_cost DECIMAL(12, 2),
    total_cost DECIMAL(12, 2),
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
    completion_notes TEXT,
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- PREVENTIVE MAINTENANCE SCHEDULES
-- =====================================================
CREATE TABLE preventive_maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    schedule_name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'
    frequency_value INTEGER, -- For custom frequency
    next_due_date DATE NOT NULL,
    last_performed_date DATE,
    estimated_duration_minutes INTEGER,
    checklist JSONB DEFAULT '[]', -- Array of checklist items
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_facilities_organization_id ON facilities(organization_id);
CREATE INDEX idx_facility_units_facility_id ON facility_units(facility_id);
CREATE INDEX idx_assets_organization_id ON assets(organization_id);
CREATE INDEX idx_assets_facility_id ON assets(facility_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_maintenance_requests_organization_id ON maintenance_requests(organization_id);
CREATE INDEX idx_maintenance_requests_facility_id ON maintenance_requests(facility_id);
CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);
CREATE INDEX idx_maintenance_work_orders_request_id ON maintenance_work_orders(request_id);
CREATE INDEX idx_maintenance_work_orders_status ON maintenance_work_orders(status);
CREATE INDEX idx_preventive_maintenance_asset_id ON preventive_maintenance_schedules(asset_id);
CREATE INDEX idx_preventive_maintenance_next_due ON preventive_maintenance_schedules(next_due_date) WHERE is_active = TRUE;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at for facility tables
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facility_units_updated_at BEFORE UPDATE ON facility_units
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_work_orders_updated_at BEFORE UPDATE ON maintenance_work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preventive_maintenance_updated_at BEFORE UPDATE ON preventive_maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create work order from maintenance request
CREATE OR REPLACE FUNCTION create_work_order_from_request()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'assigned' AND OLD.status != 'assigned' THEN
        INSERT INTO maintenance_work_orders (
            request_id,
            work_order_number,
            title,
            description,
            assigned_to,
            scheduled_date,
            status,
            created_by
        )
        VALUES (
            NEW.id,
            'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 10000)::TEXT, 4, '0'),
            NEW.title,
            NEW.description,
            NEW.assigned_to,
            CURRENT_DATE + INTERVAL '1 day',
            'scheduled',
            NEW.assigned_to
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_work_order
    AFTER UPDATE OF status ON maintenance_requests
    FOR EACH ROW
    WHEN (NEW.status = 'assigned' AND OLD.status != 'assigned')
    EXECUTE FUNCTION create_work_order_from_request();

