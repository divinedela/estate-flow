-- Row Level Security (RLS) Policies for Procurement Module Tables

-- =====================================================
-- Enable RLS on all procurement tables
-- =====================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SUPPLIERS Policies
-- =====================================================
-- Users can view suppliers in their organization
CREATE POLICY "Users can view suppliers in organization"
    ON suppliers FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Procurement officers, project managers, and super admins can manage suppliers
CREATE POLICY "Authorized users can manage suppliers"
    ON suppliers FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- PURCHASE REQUISITIONS Policies
-- =====================================================
-- Users can view PRs in their organization
CREATE POLICY "Users can view purchase requisitions in organization"
    ON purchase_requisitions FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Users can create PRs
CREATE POLICY "Users can create purchase requisitions"
    ON purchase_requisitions FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
        AND requested_by IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- Users can update their own draft PRs
CREATE POLICY "Users can update own draft PRs"
    ON purchase_requisitions FOR UPDATE
    USING (
        requested_by IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        AND status = 'draft'
    )
    WITH CHECK (
        requested_by IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        AND status = 'draft'
    );

-- Procurement officers and super admins can approve PRs
CREATE POLICY "Procurement can approve purchase requisitions"
    ON purchase_requisitions FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    );

-- =====================================================
-- PURCHASE REQUISITION ITEMS Policies
-- =====================================================
-- Users can view PR items for PRs they have access to
CREATE POLICY "Users can view purchase requisition items"
    ON purchase_requisition_items FOR SELECT
    USING (
        pr_id IN (
            SELECT id FROM purchase_requisitions
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Users can manage items for their own draft PRs
CREATE POLICY "Users can manage own PR items"
    ON purchase_requisition_items FOR ALL
    USING (
        pr_id IN (
            SELECT id FROM purchase_requisitions
            WHERE requested_by IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
            AND status = 'draft'
        )
    )
    WITH CHECK (
        pr_id IN (
            SELECT id FROM purchase_requisitions
            WHERE requested_by IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
            AND status = 'draft'
        )
    );

-- Procurement officers can manage all PR items
CREATE POLICY "Procurement can manage PR items"
    ON purchase_requisition_items FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    );

-- =====================================================
-- PURCHASE ORDERS Policies
-- =====================================================
-- Users can view POs in their organization
CREATE POLICY "Users can view purchase orders in organization"
    ON purchase_orders FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Procurement officers and super admins can manage POs
CREATE POLICY "Procurement can manage purchase orders"
    ON purchase_orders FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    );

-- =====================================================
-- PURCHASE ORDER ITEMS Policies
-- =====================================================
-- Users can view PO items for POs they have access to
CREATE POLICY "Users can view purchase order items"
    ON purchase_order_items FOR SELECT
    USING (
        po_id IN (
            SELECT id FROM purchase_orders
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Procurement officers can manage PO items
CREATE POLICY "Procurement can manage PO items"
    ON purchase_order_items FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    );

-- =====================================================
-- GOODS RECEIPTS Policies
-- =====================================================
-- Users can view GRNs in their organization
CREATE POLICY "Users can view goods receipts in organization"
    ON goods_receipts FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Inventory officers, procurement officers, and super admins can create GRNs
CREATE POLICY "Authorized users can create goods receipts"
    ON goods_receipts FOR INSERT
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('procurement_officer')
    );

-- Inventory officers, procurement officers, and super admins can manage GRNs
CREATE POLICY "Authorized users can manage goods receipts"
    ON goods_receipts FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('procurement_officer')
        OR received_by IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('procurement_officer')
    );

-- =====================================================
-- GOODS RECEIPT ITEMS Policies
-- =====================================================
-- Users can view GRN items for GRNs they have access to
CREATE POLICY "Users can view goods receipt items"
    ON goods_receipt_items FOR SELECT
    USING (
        grn_id IN (
            SELECT id FROM goods_receipts
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Authorized users can manage GRN items
CREATE POLICY "Authorized users can manage GRN items"
    ON goods_receipt_items FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('procurement_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('inventory_officer')
        OR public.user_has_role('procurement_officer')
    );

-- =====================================================
-- INVOICES Policies
-- =====================================================
-- Users can view invoices in their organization
CREATE POLICY "Users can view invoices in organization"
    ON invoices FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Procurement officers and super admins can manage invoices
CREATE POLICY "Procurement can manage invoices"
    ON invoices FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('procurement_officer')
    );

