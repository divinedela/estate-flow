-- Assign Super Admin Role to Your User
-- 
-- INSTRUCTIONS:
-- 1. Replace 'YOUR_AUTH_USER_ID' below with your actual Supabase Auth user ID
--    You can find it by:
--    - Going to Supabase Dashboard > Authentication > Users
--    - Or running: SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
--
-- 2. Make sure you have an organization created (or use the test organization ID)
-- 3. Run this script in Supabase SQL Editor

-- =====================================================
-- STEP 1: Find your auth user ID (uncomment and run this first)
-- =====================================================
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- =====================================================
-- STEP 2: Replace 'YOUR_AUTH_USER_ID' with your actual auth user ID
-- =====================================================
DO $$
DECLARE
    v_auth_user_id UUID := 'YOUR_AUTH_USER_ID'; -- ⚠️ REPLACE THIS with your auth user ID
    v_org_id UUID := '00000000-0000-0000-0000-000000000001'; -- Test organization ID
    v_app_user_id UUID;
    v_role_id UUID;
BEGIN
    -- Find app_user record
    SELECT id INTO v_app_user_id
    FROM app_users
    WHERE user_id = v_auth_user_id;
    
    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION 'App user not found. Please create an app_user record first.';
    END IF;
    
    -- Find super_admin role
    SELECT id INTO v_role_id
    FROM roles
    WHERE name = 'super_admin';
    
    IF v_role_id IS NULL THEN
        RAISE EXCEPTION 'super_admin role not found. Please run migrations first.';
    END IF;
    
    -- Assign role
    INSERT INTO user_roles (user_id, role_id, organization_id)
    VALUES (v_app_user_id, v_role_id, v_org_id)
    ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
    
    RAISE NOTICE 'Successfully assigned super_admin role to user!';
END $$;

-- =====================================================
-- VERIFY: Check your roles
-- =====================================================
-- Replace 'YOUR_AUTH_USER_ID' with your auth user ID
SELECT 
    au.email,
    au.full_name,
    r.name as role_name,
    r.description,
    o.name as organization
FROM app_users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN organizations o ON ur.organization_id = o.id
WHERE au.user_id = 'YOUR_AUTH_USER_ID'; -- ⚠️ REPLACE THIS

