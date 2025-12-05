-- Purchasing/Procurement Module Database Schema
-- This migration creates tables for suppliers, purchase requisitions, purchase orders, goods receipts, and invoices

-- =====================================================
-- SUPPLIERS
-- =====================================================
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supplier_code VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    phone_secondary VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(100),
    payment_terms VARCHAR(100), -- e.g., 'Net 30', 'COD', 'Advance'
    currency VARCHAR(10) DEFAULT 'USD',
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'blacklisted'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(organization_id, supplier_code)
);

-- =====================================================
-- PURCHASE REQUISITIONS (PRs)
-- =====================================================
CREATE TABLE purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pr_number VARCHAR(100) UNIQUE NOT NULL,
    requested_by UUID NOT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    project_id UUID, -- Link to project if PR is project-specific
    department VARCHAR(100),
    purpose TEXT,
    priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'rejected', 'converted_to_po', 'cancelled'
    requested_date DATE DEFAULT CURRENT_DATE,
    required_date DATE,
    approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PURCHASE REQUISITION ITEMS
-- =====================================================
CREATE TABLE purchase_requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pr_id UUID NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL, -- Link to inventory item if applicable
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_of_measure VARCHAR(50),
    estimated_unit_price DECIMAL(12, 2),
    estimated_total_price DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PURCHASE ORDERS (POs)
-- =====================================================
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    pr_id UUID REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
    po_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    project_id UUID, -- Link to project if PO is project-specific
    issued_by UUID NOT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent', 'acknowledged', 'partial', 'received', 'cancelled'
    payment_terms VARCHAR(100),
    delivery_address TEXT,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PURCHASE ORDER ITEMS
-- =====================================================
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_of_measure VARCHAR(50),
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    received_quantity DECIMAL(12, 3) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GOODS RECEIPTS (GRNs)
-- =====================================================
CREATE TABLE goods_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    grn_number VARCHAR(100) UNIQUE NOT NULL,
    received_by UUID NOT NULL REFERENCES app_users(id) ON DELETE SET NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    received_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location_id UUID REFERENCES stock_locations(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'completed', 'rejected'
    quality_check_notes TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- GOODS RECEIPT ITEMS
-- =====================================================
CREATE TABLE goods_receipt_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grn_id UUID NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_item_id UUID NOT NULL REFERENCES purchase_order_items(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE SET NULL,
    quantity_received DECIMAL(12, 3) NOT NULL,
    quantity_accepted DECIMAL(12, 3) NOT NULL,
    quantity_rejected DECIMAL(12, 3) DEFAULT 0,
    unit_price DECIMAL(12, 2),
    total_price DECIMAL(15, 2),
    condition_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    po_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'paid', 'overdue', 'cancelled'
    payment_date DATE,
    payment_reference VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_suppliers_organization_id ON suppliers(organization_id);
CREATE INDEX idx_suppliers_status ON suppliers(status);
CREATE INDEX idx_purchase_requisitions_organization_id ON purchase_requisitions(organization_id);
CREATE INDEX idx_purchase_requisitions_requested_by ON purchase_requisitions(requested_by);
CREATE INDEX idx_purchase_requisitions_status ON purchase_requisitions(status);
CREATE INDEX idx_purchase_requisitions_project_id ON purchase_requisitions(project_id);
CREATE INDEX idx_purchase_requisition_items_pr_id ON purchase_requisition_items(pr_id);
CREATE INDEX idx_purchase_orders_organization_id ON purchase_orders(organization_id);
CREATE INDEX idx_purchase_orders_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_pr_id ON purchase_orders(pr_id);
CREATE INDEX idx_purchase_order_items_po_id ON purchase_order_items(po_id);
CREATE INDEX idx_goods_receipts_organization_id ON goods_receipts(organization_id);
CREATE INDEX idx_goods_receipts_po_id ON goods_receipts(po_id);
CREATE INDEX idx_goods_receipts_status ON goods_receipts(status);
CREATE INDEX idx_goods_receipt_items_grn_id ON goods_receipt_items(grn_id);
CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_supplier_id ON invoices(supplier_id);
CREATE INDEX idx_invoices_po_id ON invoices(po_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at for procurement tables
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_requisitions_updated_at BEFORE UPDATE ON purchase_requisitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_goods_receipts_updated_at BEFORE UPDATE ON goods_receipts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate PR total amount
CREATE OR REPLACE FUNCTION calculate_pr_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE purchase_requisitions
    SET total_amount = (
        SELECT COALESCE(SUM(estimated_total_price), 0)
        FROM purchase_requisition_items
        WHERE pr_id = COALESCE(NEW.pr_id, OLD.pr_id)
    )
    WHERE id = COALESCE(NEW.pr_id, OLD.pr_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pr_total_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON purchase_requisition_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_pr_total();

-- Function to calculate PO total amount
CREATE OR REPLACE FUNCTION calculate_po_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE purchase_orders
    SET total_amount = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM purchase_order_items
        WHERE po_id = COALESCE(NEW.po_id, OLD.po_id)
    )
    WHERE id = COALESCE(NEW.po_id, OLD.po_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_po_total_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_po_total();

-- Function to update inventory when GRN is completed
CREATE OR REPLACE FUNCTION update_inventory_from_grn()
RETURNS TRIGGER AS $$
DECLARE
    v_item_id UUID;
    v_location_id UUID;
    v_quantity DECIMAL(12, 3);
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- For each accepted item in the GRN, create stock transaction
        FOR v_item_id, v_location_id, v_quantity IN
            SELECT gri.item_id, gr.location_id, gri.quantity_accepted
            FROM goods_receipt_items gri
            JOIN goods_receipts gr ON gri.grn_id = gr.id
            WHERE gri.grn_id = NEW.id
            AND gri.item_id IS NOT NULL
            AND gr.location_id IS NOT NULL
        LOOP
            -- Create inbound stock transaction
            INSERT INTO stock_transactions (
                organization_id,
                item_id,
                location_id,
                transaction_type,
                reference_type,
                reference_id,
                quantity,
                transaction_date,
                created_by
            )
            SELECT 
                gr.organization_id,
                v_item_id,
                v_location_id,
                'inbound',
                'goods_receipt',
                NEW.id,
                v_quantity,
                NEW.received_date,
                NEW.received_by
            FROM goods_receipts gr
            WHERE gr.id = NEW.id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_on_grn_completion
    AFTER UPDATE OF status ON goods_receipts
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_inventory_from_grn();

