-- Project Expenses Schema and RLS Policies
-- Run this in Supabase SQL Editor

-- =====================================================
-- EXPENSE CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name)
);

-- =====================================================
-- PROJECT EXPENSES
-- =====================================================
CREATE TABLE IF NOT EXISTS project_expenses (
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
CREATE TABLE IF NOT EXISTS budget_allocations (
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
CREATE INDEX IF NOT EXISTS idx_expense_categories_organization_id ON expense_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_project_id ON project_expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_category_id ON project_expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_expense_date ON project_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_project_expenses_payment_status ON project_expenses(payment_status);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_project_id ON budget_allocations(project_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS update_project_expenses_updated_at ON project_expenses;
CREATE TRIGGER update_project_expenses_updated_at BEFORE UPDATE ON project_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_budget_allocations_updated_at ON budget_allocations;
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
DROP TRIGGER IF EXISTS trigger_update_project_actual_cost ON project_expenses;
CREATE TRIGGER trigger_update_project_actual_cost
AFTER INSERT OR UPDATE OR DELETE ON project_expenses
FOR EACH ROW
EXECUTE FUNCTION update_project_actual_cost();

-- =====================================================
-- Enable RLS
-- =====================================================
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_allocations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view organization expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Admins and PMs can manage expense categories" ON expense_categories;
DROP POLICY IF EXISTS "Users can view organization project expenses" ON project_expenses;
DROP POLICY IF EXISTS "Admins and PMs can create expenses" ON project_expenses;
DROP POLICY IF EXISTS "Admins and PMs can update expenses" ON project_expenses;
DROP POLICY IF EXISTS "Admins and PMs can delete expenses" ON project_expenses;
DROP POLICY IF EXISTS "Users can view organization budget allocations" ON budget_allocations;
DROP POLICY IF EXISTS "Admins and PMs can manage budget allocations" ON budget_allocations;

-- EXPENSE_CATEGORIES Policies
CREATE POLICY "Users can view organization expense categories"
    ON expense_categories FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

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

-- PROJECT_EXPENSES Policies
CREATE POLICY "Users can view organization project expenses"
    ON project_expenses FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN app_users au ON p.organization_id = au.organization_id
            WHERE au.user_id = (SELECT auth.uid())
        )
    );

CREATE POLICY "Admins and PMs can create expenses"
    ON project_expenses FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
        OR public.user_has_role('site_engineer')
    );

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

CREATE POLICY "Admins and PMs can delete expenses"
    ON project_expenses FOR DELETE
    USING (
        public.is_super_admin()
        OR public.user_has_role('project_manager')
    );

-- BUDGET_ALLOCATIONS Policies
CREATE POLICY "Users can view organization budget allocations"
    ON budget_allocations FOR SELECT
    USING (
        project_id IN (
            SELECT p.id FROM projects p
            JOIN app_users au ON p.organization_id = au.organization_id
            WHERE au.user_id = (SELECT auth.uid())
        )
    );

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

-- Insert default expense categories for all organizations
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
) AS categories(category_name, category_desc, category_color)
WHERE NOT EXISTS (
    SELECT 1 FROM expense_categories ec
    WHERE ec.organization_id = o.id AND ec.name = category_name
);
