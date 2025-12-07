-- Row Level Security (RLS) Policies for Inventory Module Tables

-- =====================================================
-- Enable RLS on all inventory tables
-- =====================================================
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reorder_rules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ITEMS Policies
-- =====================================================
-- Users can view items in their organization
CREATE POLICY "Users can view items in organization"
    ON items FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Inventory officers, project managers, and super admins can manage items
CREATE POLICY "Authorized users can manage items"
    ON items FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- STOCK LOCATIONS Policies
-- =====================================================
-- Users can view locations in their organization
CREATE POLICY "Users can view stock locations in organization"
    ON stock_locations FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Inventory officers, project managers, and super admins can manage locations
CREATE POLICY "Authorized users can manage stock locations"
    ON stock_locations FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- STOCK LEVELS Policies
-- =====================================================
-- Users can view stock levels in their organization
CREATE POLICY "Users can view stock levels in organization"
    ON stock_levels FOR SELECT
    USING (
        item_id IN (
            SELECT id FROM items
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Inventory officers, project managers, and super admins can manage stock levels
CREATE POLICY "Authorized users can manage stock levels"
    ON stock_levels FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- STOCK TRANSACTIONS Policies
-- =====================================================
-- Users can view transactions in their organization
CREATE POLICY "Users can view stock transactions in organization"
    ON stock_transactions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Inventory officers, project managers, and super admins can create transactions
CREATE POLICY "Authorized users can create stock transactions"
    ON stock_transactions FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('project_manager')
    );

-- Only inventory officers and super admins can modify transactions
CREATE POLICY "Inventory officers can manage stock transactions"
    ON stock_transactions FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
    );

-- =====================================================
-- REORDER RULES Policies
-- =====================================================
-- Users can view reorder rules in their organization
CREATE POLICY "Users can view reorder rules in organization"
    ON reorder_rules FOR SELECT
    USING (
        item_id IN (
            SELECT id FROM items
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Inventory officers and super admins can manage reorder rules
CREATE POLICY "Inventory officers can manage reorder rules"
    ON reorder_rules FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
    );



