-- Inventory Module Database Schema
-- This migration creates tables for items, stock locations, stock levels, transactions, and reorder rules

-- =====================================================
-- ITEMS (Materials/Products)
-- =====================================================
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., 'construction_materials', 'tools', 'office_supplies'
    unit_of_measure VARCHAR(50) NOT NULL DEFAULT 'pcs', -- 'pcs', 'kg', 'm', 'm2', 'm3', 'l'
    item_type VARCHAR(50) DEFAULT 'material', -- 'material', 'tool', 'equipment', 'consumable'
    barcode VARCHAR(100),
    manufacturer VARCHAR(255),
    model_number VARCHAR(100),
    specifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(organization_id, item_code)
);

-- =====================================================
-- STOCK LOCATIONS
-- =====================================================
CREATE TABLE stock_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50), -- 'warehouse', 'site', 'office', 'vehicle'
    address TEXT,
    project_id UUID, -- Link to project if location is project-specific
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(organization_id, code)
);

-- =====================================================
-- STOCK LEVELS
-- =====================================================
CREATE TABLE stock_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    quantity DECIMAL(12, 3) NOT NULL DEFAULT 0,
    reserved_quantity DECIMAL(12, 3) DEFAULT 0, -- Reserved for specific projects/orders
    last_counted_at TIMESTAMP WITH TIME ZONE,
    last_counted_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, location_id)
);

-- =====================================================
-- STOCK TRANSACTIONS
-- =====================================================
CREATE TABLE stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'inbound', 'outbound', 'transfer', 'adjustment', 'return'
    reference_type VARCHAR(100), -- e.g., 'purchase_order', 'project', 'goods_receipt', 'manual'
    reference_id UUID, -- ID of the related document (PO, project, etc.)
    quantity DECIMAL(12, 3) NOT NULL,
    unit_cost DECIMAL(12, 2),
    total_cost DECIMAL(15, 2),
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    project_id UUID, -- Link to project if transaction is project-related
    created_by UUID NOT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- REORDER RULES
-- =====================================================
CREATE TABLE reorder_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    min_quantity DECIMAL(12, 3) NOT NULL, -- Reorder point
    max_quantity DECIMAL(12, 3), -- Maximum stock level
    reorder_quantity DECIMAL(12, 3), -- Quantity to order when reorder point is reached
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(item_id, location_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_items_organization_id ON items(organization_id);
CREATE INDEX idx_items_code ON items(item_code);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_stock_locations_organization_id ON stock_locations(organization_id);
CREATE INDEX idx_stock_levels_item_id ON stock_levels(item_id);
CREATE INDEX idx_stock_levels_location_id ON stock_levels(location_id);
CREATE INDEX idx_stock_transactions_organization_id ON stock_transactions(organization_id);
CREATE INDEX idx_stock_transactions_item_id ON stock_transactions(item_id);
CREATE INDEX idx_stock_transactions_location_id ON stock_transactions(location_id);
CREATE INDEX idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX idx_stock_transactions_date ON stock_transactions(transaction_date);
CREATE INDEX idx_stock_transactions_project_id ON stock_transactions(project_id);
CREATE INDEX idx_reorder_rules_item_id ON reorder_rules(item_id);
CREATE INDEX idx_reorder_rules_location_id ON reorder_rules(location_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at for inventory tables
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_locations_updated_at BEFORE UPDATE ON stock_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_levels_updated_at BEFORE UPDATE ON stock_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reorder_rules_updated_at BEFORE UPDATE ON reorder_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update stock level after transaction
CREATE OR REPLACE FUNCTION update_stock_level()
RETURNS TRIGGER AS $$
DECLARE
    v_current_quantity DECIMAL(12, 3);
    v_new_quantity DECIMAL(12, 3);
BEGIN
    -- Get current stock level
    SELECT quantity INTO v_current_quantity
    FROM stock_levels
    WHERE item_id = NEW.item_id AND location_id = NEW.location_id;

    IF v_current_quantity IS NULL THEN
        -- Create new stock level record
        INSERT INTO stock_levels (item_id, location_id, quantity)
        VALUES (NEW.item_id, NEW.location_id, 0);
        v_current_quantity := 0;
    END IF;

    -- Calculate new quantity based on transaction type
    CASE NEW.transaction_type
        WHEN 'inbound' THEN
            v_new_quantity := v_current_quantity + NEW.quantity;
        WHEN 'return' THEN
            v_new_quantity := v_current_quantity + NEW.quantity;
        WHEN 'outbound' THEN
            v_new_quantity := v_current_quantity - NEW.quantity;
        WHEN 'transfer' THEN
            v_new_quantity := v_current_quantity - NEW.quantity;
        WHEN 'adjustment' THEN
            v_new_quantity := NEW.quantity; -- Adjustment sets the quantity directly
        ELSE
            v_new_quantity := v_current_quantity;
    END CASE;

    -- Update stock level
    UPDATE stock_levels
    SET quantity = v_new_quantity,
        updated_at = NOW()
    WHERE item_id = NEW.item_id AND location_id = NEW.location_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stock_transaction_update_level
    AFTER INSERT ON stock_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_level();

-- Function to check low stock and create notifications
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_min_quantity DECIMAL(12, 3);
    v_reorder_quantity DECIMAL(12, 3);
BEGIN
    -- Check if reorder rule exists
    SELECT min_quantity, reorder_quantity
    INTO v_min_quantity, v_reorder_quantity
    FROM reorder_rules
    WHERE item_id = NEW.item_id
    AND location_id = NEW.location_id
    AND is_active = TRUE;

    IF v_min_quantity IS NOT NULL AND NEW.quantity <= v_min_quantity THEN
        -- Create notification for inventory officers
        INSERT INTO notifications (user_id, type, title, message, payload)
        SELECT 
            au.id,
            'low_stock',
            'Low Stock Alert',
            'Item "' || (SELECT name FROM items WHERE id = NEW.item_id) || '" at location "' || 
            (SELECT name FROM stock_locations WHERE id = NEW.location_id) || '" is below reorder point',
            jsonb_build_object(
                'item_id', NEW.item_id,
                'location_id', NEW.location_id,
                'current_quantity', NEW.quantity,
                'min_quantity', v_min_quantity,
                'reorder_quantity', v_reorder_quantity
            )
        FROM app_users au
        JOIN user_roles ur ON au.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'inventory_officer'
        AND au.organization_id = (SELECT organization_id FROM items WHERE id = NEW.item_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_low_stock_alert
    AFTER UPDATE OF quantity ON stock_levels
    FOR EACH ROW
    WHEN (NEW.quantity < OLD.quantity)
    EXECUTE FUNCTION check_low_stock();

