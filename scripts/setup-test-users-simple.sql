-- Simple Test User Setup (Manual Method)
-- 
-- STEP 1: Create users in Supabase Auth Dashboard
-- Go to: Authentication > Users > Add User
-- Create users with these emails and password: TestPassword123!
--
-- STEP 2: Get the user IDs
-- Run this query to get the auth user IDs:
-- SELECT id, email FROM auth.users WHERE email LIKE '%@test.com' ORDER BY email;
--
-- STEP 3: Update the user_id values below and run this script

-- Test Organization (run this first)
INSERT INTO organizations (id, name, code, email, phone, address)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Test Real Estate Development Co.',
    'TEST-ORG',
    'test@estateflow.com',
    '+1234567890',
    '123 Test Street, Test City'
)
ON CONFLICT (id) DO NOTHING;

-- Helper function to create test user (call this for each user)
-- Usage: SELECT create_test_user('AUTH_USER_ID_HERE', 'email@test.com', 'Full Name', 'role_name');
CREATE OR REPLACE FUNCTION create_test_user(
    p_auth_user_id UUID,
    p_email VARCHAR,
    p_full_name VARCHAR,
    p_role_name VARCHAR
)
RETURNS VOID AS $$
DECLARE
    v_app_user_id UUID;
    v_role_id UUID;
    v_org_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Create app_user
    INSERT INTO app_users (user_id, email, full_name, organization_id, is_active)
    VALUES (p_auth_user_id, p_email, p_full_name, v_org_id, TRUE)
    ON CONFLICT (user_id) DO UPDATE
    SET email = p_email, full_name = p_full_name, organization_id = v_org_id
    RETURNING id INTO v_app_user_id;

    -- Get role_id
    SELECT id INTO v_role_id FROM roles WHERE name = p_role_name;
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'Role % not found', p_role_name;
    END IF;

    -- Assign role
    INSERT INTO user_roles (user_id, role_id, organization_id)
    VALUES (v_app_user_id, v_role_id, v_org_id)
    ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;

    RAISE NOTICE 'Created user: % with role: %', p_email, p_role_name;
END;
$$ LANGUAGE plpgsql;

-- Example usage (uncomment and replace AUTH_USER_ID with actual IDs):
/*
-- Get auth user IDs first:
SELECT id, email FROM auth.users WHERE email LIKE '%@test.com' ORDER BY email;

-- Then run these (replace the UUIDs with actual auth user IDs):
SELECT create_test_user('REPLACE_WITH_SUPER_ADMIN_AUTH_ID', 'superadmin@test.com', 'Super Admin User', 'super_admin');
SELECT create_test_user('REPLACE_WITH_HR_MANAGER_AUTH_ID', 'hrmanager@test.com', 'HR Manager User', 'hr_manager');
SELECT create_test_user('REPLACE_WITH_PROJECT_MANAGER_AUTH_ID', 'projectmanager@test.com', 'Project Manager User', 'project_manager');
SELECT create_test_user('REPLACE_WITH_SITE_ENGINEER_AUTH_ID', 'siteengineer@test.com', 'Site Engineer User', 'site_engineer');
SELECT create_test_user('REPLACE_WITH_MARKETING_AUTH_ID', 'marketing@test.com', 'Marketing Officer User', 'marketing_officer');
SELECT create_test_user('REPLACE_WITH_PROCUREMENT_AUTH_ID', 'procurement@test.com', 'Procurement Officer User', 'procurement_officer');
SELECT create_test_user('REPLACE_WITH_INVENTORY_AUTH_ID', 'inventory@test.com', 'Inventory Officer User', 'inventory_officer');
SELECT create_test_user('REPLACE_WITH_FACILITY_AUTH_ID', 'facility@test.com', 'Facility Manager User', 'facility_manager');
SELECT create_test_user('REPLACE_WITH_EXECUTIVE_AUTH_ID', 'executive@test.com', 'Executive User', 'executive');
*/



