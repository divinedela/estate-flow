-- Quick Setup: Create Test Users After Auth Users Exist
-- 
-- STEP 1: Create auth users in Supabase Dashboard (Authentication > Users)
-- STEP 2: Get auth user IDs by running:
--   SELECT id, email FROM auth.users WHERE email LIKE '%@test.com' ORDER BY email;
-- STEP 3: Update the UUIDs below and run this script

-- Ensure test organization exists
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

-- Helper: Get auth user ID by email
-- Usage: SELECT get_auth_user_id('superadmin@test.com');
CREATE OR REPLACE FUNCTION get_auth_user_id(p_email VARCHAR)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create all test users at once
-- Replace the function calls with actual auth user IDs from STEP 2
DO $$
DECLARE
    v_org_id UUID := '00000000-0000-0000-0000-000000000001';
    v_auth_id UUID;
    v_app_user_id UUID;
    v_role_id UUID;
    v_users RECORD;
BEGIN
    -- List of users to create
    FOR v_users IN 
        SELECT * FROM (VALUES
            ('superadmin@test.com', 'Super Admin User', 'super_admin'),
            ('hrmanager@test.com', 'HR Manager User', 'hr_manager'),
            ('projectmanager@test.com', 'Project Manager User', 'project_manager'),
            ('siteengineer@test.com', 'Site Engineer User', 'site_engineer'),
            ('marketing@test.com', 'Marketing Officer User', 'marketing_officer'),
            ('procurement@test.com', 'Procurement Officer User', 'procurement_officer'),
            ('inventory@test.com', 'Inventory Officer User', 'inventory_officer'),
            ('facility@test.com', 'Facility Manager User', 'facility_manager'),
            ('executive@test.com', 'Executive User', 'executive')
        ) AS t(email, full_name, role_name)
    LOOP
        -- Get auth user ID
        v_auth_id := get_auth_user_id(v_users.email);
        
        IF v_auth_id IS NULL THEN
            RAISE NOTICE 'Skipping % - auth user not found. Create in Supabase Dashboard first.', v_users.email;
            CONTINUE;
        END IF;
        
        -- Create app_user
        INSERT INTO app_users (user_id, email, full_name, organization_id, is_active)
        VALUES (v_auth_id, v_users.email, v_users.full_name, v_org_id, TRUE)
        ON CONFLICT (user_id) DO UPDATE
        SET email = v_users.email, full_name = v_users.full_name
        RETURNING id INTO v_app_user_id;
        
        -- Get role_id
        SELECT id INTO v_role_id FROM roles WHERE name = v_users.role_name;
        
        IF v_role_id IS NULL THEN
            RAISE NOTICE 'Role % not found for user %', v_users.role_name, v_users.email;
            CONTINUE;
        END IF;
        
        -- Assign role
        INSERT INTO user_roles (user_id, role_id, organization_id)
        VALUES (v_app_user_id, v_role_id, v_org_id)
        ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
        
        RAISE NOTICE 'Created user: % with role: %', v_users.email, v_users.role_name;
    END LOOP;
END $$;

-- Verify setup
SELECT 
    au.email,
    au.full_name,
    r.name as role_name,
    o.name as organization
FROM app_users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN organizations o ON ur.organization_id = o.id
WHERE au.email LIKE '%@test.com'
ORDER BY au.email;



