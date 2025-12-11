-- Project Expenses Schema
-- Detailed expense tracking for projects

-- =====================================================
-- EXPENSE CATEGORIES
-- =====================================================
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- Insert default expense categories
INSERT INTO expense_categories (organization_id, name, description, color, is_active)
SELECT
    o.id,
    category_name,
    category_desc,
    category_color,
    TRUE
FROM organizations o
CROSS JOIN (
    VALUES
        ('Labor', 'Employee salaries and contractor payments', '#3B82F6'),
        ('Materials', 'Construction materials and supplies', '#10B981'),
        ('Equipment', 'Equipment rental and maintenance', '#F59E0B'),
        ('Subcontractors', 'Third-party contractor services', '#8B5CF6'),
        ('Permits & Fees', 'Government permits and regulatory fees', '#EF4444'),
        ('Transportation', 'Vehicle and material transportation costs', '#06B6D4'),
        ('Utilities', 'Water, electricity, and other utilities', '#84CC16'),
        ('Other', 'Miscellaneous expenses', '#6B7280')
) AS categories(category_name, category_desc, category_color);

-- =====================================================
-- PROJECT EXPENSES
-- =====================================================
CREATE TABLE project_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
    vendor VARCHAR(255),
    invoice_number VARCHAR(100),
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'overdue', 'cancelled'
    payment_date DATE,
    payment_method VARCHAR(50), -- 'cash', 'check', 'bank_transfer', 'credit_card'
    receipt_url TEXT,
    notes TEXT,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BUDGET ALLOCATIONS
-- =====================================================
CREATE TABLE budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    allocated_amount DECIMAL(15, 2) NOT NULL CHECK (allocated_amount >= 0),
    notes TEXT,
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, category_id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_expense_categories_organization_id ON expense_categories(organization_id);
CREATE INDEX idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX idx_project_expenses_category_id ON project_expenses(category_id);
CREATE INDEX idx_project_expenses_expense_date ON project_expenses(expense_date);
CREATE INDEX idx_project_expenses_payment_status ON project_expenses(payment_status);
CREATE INDEX idx_budget_allocations_project_id ON budget_allocations(project_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_project_expenses_updated_at BEFORE UPDATE ON project_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_allocations_updated_at BEFORE UPDATE ON budget_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Update project actual_cost when expenses change
-- =====================================================
CREATE OR REPLACE FUNCTION update_project_actual_cost()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate actual_cost for the project
    UPDATE projects
    SET actual_cost = (
        SELECT COALESCE(SUM(amount), 0)
        FROM project_expenses
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        AND payment_status IN ('paid', 'pending')
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project actual_cost
CREATE TRIGGER trigger_update_project_actual_cost
AFTER INSERT OR UPDATE OR DELETE ON project_expenses
FOR EACH ROW
EXECUTE FUNCTION update_project_actual_cost();
