-- =====================================================
-- ASSIGN AGENT ROLES TO USERS
-- Run this after setup-agents-module.sql
-- =====================================================

-- Step 1: View your current users
-- =====================================================
SELECT
    au.id,
    au.full_name,
    au.email,
    ARRAY_AGG(r.name) as roles
FROM app_users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE au.organization_id = (SELECT id FROM organizations LIMIT 1)
GROUP BY au.id, au.full_name, au.email
ORDER BY au.created_at;

-- Step 2: Get role IDs
-- =====================================================
SELECT id, name, description FROM roles WHERE name IN ('super_admin', 'agent', 'agent_manager');

-- Step 3: Assign agent_manager role to your superadmin
-- =====================================================
-- OPTION A: Find your superadmin user and assign agent_manager role
-- Replace 'YOUR_EMAIL_HERE' with your actual email

INSERT INTO user_roles (user_id, role_id)
SELECT
    au.id as user_id,
    r.id as role_id
FROM app_users au
CROSS JOIN roles r
WHERE au.email = 'YOUR_EMAIL_HERE'  -- <-- CHANGE THIS
AND r.name = 'agent_manager'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- OPTION B: Assign to all super_admins
-- Uncomment the following to give all super_admins the agent_manager role

/*
INSERT INTO user_roles (user_id, role_id)
SELECT
    ur.user_id,
    r.id as role_id
FROM user_roles ur
JOIN roles sr ON ur.role_id = sr.id AND sr.name = 'super_admin'
CROSS JOIN roles r
WHERE r.name = 'agent_manager'
ON CONFLICT (user_id, role_id) DO NOTHING;
*/

-- Step 4: Create test agent user (Optional)
-- =====================================================
-- This creates a test agent user account
-- Replace the values with your test data

/*
DO $$
DECLARE
    v_org_id UUID;
    v_user_id UUID;
    v_agent_role_id UUID;
BEGIN
    -- Get organization ID (first org)
    SELECT id INTO v_org_id FROM organizations LIMIT 1;

    -- Get agent role ID
    SELECT id INTO v_agent_role_id FROM roles WHERE name = 'agent';

    -- Create test user in app_users
    INSERT INTO app_users (
        user_id,
        organization_id,
        full_name,
        email,
        role,
        is_active
    ) VALUES (
        uuid_generate_v4(),
        v_org_id,
        'Test Agent',
        'agent@test.com',
        'Agent',
        true
    )
    RETURNING id INTO v_user_id;

    -- Assign agent role
    INSERT INTO user_roles (user_id, role_id)
    VALUES (v_user_id, v_agent_role_id);

    RAISE NOTICE 'Test agent user created: agent@test.com';
END $$;
*/

-- Step 5: Verify role assignments
-- =====================================================
SELECT
    au.full_name,
    au.email,
    r.name as role,
    r.description
FROM app_users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name IN ('agent', 'agent_manager', 'super_admin')
ORDER BY au.full_name, r.name;

-- =====================================================
-- Quick Reference: Common Role Assignment Patterns
-- =====================================================

-- Pattern 1: Add agent_manager to a specific user
/*
INSERT INTO user_roles (user_id, role_id)
SELECT
    au.id,
    (SELECT id FROM roles WHERE name = 'agent_manager')
FROM app_users au
WHERE au.email = 'manager@example.com'
ON CONFLICT DO NOTHING;
*/

-- Pattern 2: Add agent role to a specific user
/*
INSERT INTO user_roles (user_id, role_id)
SELECT
    au.id,
    (SELECT id FROM roles WHERE name = 'agent')
FROM app_users au
WHERE au.email = 'agent@example.com'
ON CONFLICT DO NOTHING;
*/

-- Pattern 3: Remove a role from a user
/*
DELETE FROM user_roles
WHERE user_id = (SELECT id FROM app_users WHERE email = 'user@example.com')
AND role_id = (SELECT id FROM roles WHERE name = 'agent');
*/

-- Pattern 4: View all roles for a specific user
/*
SELECT
    au.full_name,
    au.email,
    r.name as role
FROM app_users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE au.email = 'user@example.com';
*/
