-- =====================================================
-- STEP 1: ASSIGN AGENT_MANAGER ROLE TO YOUR USER
-- =====================================================
-- This gives your superadmin account the ability to manage agents
-- Replace 'YOUR_EMAIL_HERE' with your actual login email

-- First, let's see your current user and roles:
SELECT
    au.id,
    au.full_name,
    au.email,
    ARRAY_AGG(r.name) as current_roles
FROM app_users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE au.email ILIKE '%' -- Shows all users, you can filter by your email
GROUP BY au.id, au.full_name, au.email
ORDER BY au.created_at DESC;

-- Now assign agent_manager role to your superadmin:
-- ⚠️  CHANGE THE EMAIL BELOW TO YOUR EMAIL! ⚠️

INSERT INTO user_roles (user_id, role_id)
SELECT
    au.id as user_id,
    r.id as role_id
FROM app_users au
CROSS JOIN roles r
WHERE au.email = 'YOUR_EMAIL_HERE'  -- <-- CHANGE THIS TO YOUR EMAIL!
AND r.name = 'agent_manager'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify it worked:
SELECT
    au.full_name,
    au.email,
    ARRAY_AGG(r.name) as roles
FROM app_users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE au.email = 'YOUR_EMAIL_HERE'  -- <-- CHANGE THIS TO YOUR EMAIL!
GROUP BY au.full_name, au.email;

-- =====================================================
-- Success! You should now see both roles:
-- - super_admin (existing)
-- - agent_manager (newly added)
--
-- Next step: Refresh your app and look for "Agents" in the sidebar!
-- =====================================================
