-- Verify User Roles Setup
-- Run this to check if your user has roles assigned correctly

-- Replace 'your-email@example.com' with your actual email
-- Or replace 'YOUR_AUTH_USER_ID' with your auth user ID

-- =====================================================
-- Method 1: Check by Email
-- =====================================================
SELECT 
    'Auth User' as check_type,
    au.id::text as auth_user_id,
    au.email as email,
    '✓' as status
FROM auth.users au
WHERE au.email = 'superadmin@test.com' -- ⚠️ REPLACE with your email
UNION ALL
SELECT 
    'App User' as check_type,
    app.id::text as app_user_id,
    app.email as email,
    CASE WHEN app.id IS NOT NULL THEN '✓' ELSE '✗' END as status
FROM auth.users au
LEFT JOIN app_users app ON app.user_id = au.id
WHERE au.email = 'superadmin@test.com' -- ⚠️ REPLACE with your email
UNION ALL
SELECT 
    'Roles' as check_type,
    COUNT(ur.id)::text as role_count,
    STRING_AGG(r.name, ', ') as roles,
    CASE WHEN COUNT(ur.id) > 0 THEN '✓' ELSE '✗' END as status
FROM auth.users au
LEFT JOIN app_users app ON app.user_id = au.id
LEFT JOIN user_roles ur ON ur.user_id = app.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE au.email = 'superadmin@test.com' -- ⚠️ REPLACE with your email
GROUP BY au.id;

-- =====================================================
-- Method 2: Detailed Role Check
-- =====================================================
SELECT 
    au.email as auth_email,
    app.email as app_user_email,
    app.id as app_user_id,
    app.full_name,
    r.name as role_name,
    r.description as role_description,
    o.name as organization_name,
    ur.assigned_at
FROM auth.users au
LEFT JOIN app_users app ON app.user_id = au.id
LEFT JOIN user_roles ur ON ur.user_id = app.id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN organizations o ON ur.organization_id = o.id
WHERE au.email = 'superadmin@test.com' -- ⚠️ REPLACE with your email
ORDER BY ur.assigned_at DESC;

-- =====================================================
-- Method 3: Test RLS Policy Access
-- =====================================================
-- This simulates what the app does when fetching roles
-- Run this as the authenticated user (not as service role)
SELECT 
    ur.id,
    r.name as role_name,
    r.description,
    o.name as organization
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
LEFT JOIN organizations o ON ur.organization_id = o.id
WHERE ur.user_id IN (
    SELECT id FROM app_users WHERE user_id = (SELECT auth.uid())
);

-- =====================================================
-- Method 4: Check All Users and Their Roles
-- =====================================================
SELECT 
    au.email,
    app.full_name,
    COUNT(ur.id) as role_count,
    STRING_AGG(r.name, ', ') as roles
FROM auth.users au
LEFT JOIN app_users app ON app.user_id = au.id
LEFT JOIN user_roles ur ON ur.user_id = app.id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY au.id, au.email, app.id, app.full_name
ORDER BY au.email;



