-- Fix script for multi-country support
-- Run this if you encountered errors with the original migration

-- =====================================================
-- DROP EXISTING POLICIES (ignore errors if they don't exist)
-- =====================================================
DROP POLICY IF EXISTS "Anyone can view countries" ON countries;
DROP POLICY IF EXISTS "Anyone can view regions" ON regions;
DROP POLICY IF EXISTS "Users can view their org currency rates" ON currency_rates;
DROP POLICY IF EXISTS "Admins can manage currency rates" ON currency_rates;

-- =====================================================
-- RE-CREATE RLS POLICIES
-- =====================================================

-- Countries and regions are public read
CREATE POLICY "Anyone can view countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Anyone can view regions" ON regions FOR SELECT USING (true);

-- Currency rates are organization-specific
CREATE POLICY "Users can view their org currency rates" ON currency_rates
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage currency rates" ON currency_rates
    FOR ALL USING (
        organization_id IN (
            SELECT au.organization_id 
            FROM app_users au
            JOIN user_roles ur ON au.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE au.user_id = auth.uid() 
            AND r.name IN ('super_admin', 'admin')
        )
    );

-- =====================================================
-- TRIGGER (already exists, skip)
-- =====================================================
-- Trigger update_currency_rates_updated_at already exists, no action needed

