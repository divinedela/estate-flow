-- Assign Super Admin Role by Email (Easier Method)
-- 
-- INSTRUCTIONS:
-- 1. Replace 'your-email@example.com' with your actual email address
-- 2. Run this script in Supabase SQL Editor

-- =====================================================
-- Assign super_admin role by email
-- =====================================================
DO $$
DECLARE
    v_email VARCHAR := 'your-email@example.com'; -- ⚠️ REPLACE THIS with your email
    v_auth_user_id UUID;
    v_app_user_id UUID;
    v_role_id UUID;
    v_org_id UUID := '00000000-0000-0000-0000-000000000001'; -- Test organization ID
BEGIN
    -- Find auth user by email
    SELECT id INTO v_auth_user_id
    FROM auth.users
    WHERE email = v_email;
    
    IF v_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found with email: %. Please create the user in Supabase Auth first.', v_email;
    END IF;
    
    -- Find or create app_user record
    SELECT id INTO v_app_user_id
    FROM app_users
    WHERE user_id = v_auth_user_id;
    
    IF v_app_user_id IS NULL THEN
        -- Create app_user if it doesn't exist
        INSERT INTO app_users (user_id, email, full_name, organization_id, is_active)
        VALUES (v_auth_user_id, v_email, 'Admin User', v_org_id, TRUE)
        RETURNING id INTO v_app_user_id;
        
        RAISE NOTICE 'Created app_user record for email: %', v_email;
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
    
    RAISE NOTICE 'Successfully assigned super_admin role to: %', v_email;
END $$;

-- =====================================================
-- VERIFY: Check your roles
-- =====================================================
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
WHERE au.email = 'your-email@example.com'; -- ⚠️ REPLACE THIS with your email



