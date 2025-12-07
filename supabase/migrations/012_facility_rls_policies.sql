-- Row Level Security (RLS) Policies for Facility Management Module Tables

-- =====================================================
-- Enable RLS on all facility tables
-- =====================================================
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FACILITIES Policies
-- =====================================================
-- Users can view facilities in their organization
CREATE POLICY "Users can view facilities in organization"
    ON facilities FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Facility managers, project managers, and super admins can manage facilities
CREATE POLICY "Authorized users can manage facilities"
    ON facilities FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- FACILITY UNITS Policies
-- =====================================================
-- Users can view units for facilities they have access to
CREATE POLICY "Users can view facility units"
    ON facility_units FOR SELECT
    USING (
        facility_id IN (
            SELECT id FROM facilities
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Facility managers, project managers, and super admins can manage units
CREATE POLICY "Authorized users can manage facility units"
    ON facility_units FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- ASSETS Policies
-- =====================================================
-- Users can view assets in their organization
CREATE POLICY "Users can view assets in organization"
    ON assets FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Facility managers, project managers, and super admins can manage assets
CREATE POLICY "Authorized users can manage assets"
    ON assets FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- MAINTENANCE REQUESTS Policies
-- =====================================================
-- Users can view maintenance requests in their organization
CREATE POLICY "Users can view maintenance requests in organization"
    ON maintenance_requests FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Users can create maintenance requests
CREATE POLICY "Users can create maintenance requests"
    ON maintenance_requests FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Users can update requests they created
CREATE POLICY "Users can update own maintenance requests"
    ON maintenance_requests FOR UPDATE
    USING (
        requested_by IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        AND status = 'open'
    )
    WITH CHECK (
        requested_by IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- Facility managers and assigned users can update requests
CREATE POLICY "Managers can manage maintenance requests"
    ON maintenance_requests FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- =====================================================
-- MAINTENANCE WORK ORDERS Policies
-- =====================================================
-- Users can view work orders in their organization
CREATE POLICY "Users can view work orders in organization"
    ON maintenance_work_orders FOR SELECT
    USING (
        request_id IN (
            SELECT id FROM maintenance_requests
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Facility managers and assigned users can manage work orders
CREATE POLICY "Authorized users can manage work orders"
    ON maintenance_work_orders FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
        OR assigned_to IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
    );

-- =====================================================
-- PREVENTIVE MAINTENANCE SCHEDULES Policies
-- =====================================================
-- Users can view preventive maintenance schedules in their organization
CREATE POLICY "Users can view preventive maintenance schedules"
    ON preventive_maintenance_schedules FOR SELECT
    USING (
        asset_id IN (
            SELECT id FROM assets
            WHERE organization_id IN (
                SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
            )
        )
    );

-- Facility managers and super admins can manage schedules
CREATE POLICY "Managers can manage preventive maintenance schedules"
    ON preventive_maintenance_schedules FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('facility_manager')
    );



