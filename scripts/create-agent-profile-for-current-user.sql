-- =====================================================
-- CREATE AGENT PROFILE FOR CURRENT USER
-- Run this in your Supabase SQL Editor to create an agent profile
-- for your logged-in user account
-- =====================================================

-- Step 1: Check your current user info
-- =====================================================
SELECT
    au.id as app_user_id,
    au.user_id,
    au.full_name,
    au.email,
    au.organization_id,
    ARRAY_AGG(r.name) as roles
FROM app_users au
LEFT JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE au.email = 'YOUR_EMAIL_HERE'  -- <-- CHANGE THIS TO YOUR EMAIL
GROUP BY au.id, au.user_id, au.full_name, au.email, au.organization_id;

-- Step 2: Create agent profile for your user
-- =====================================================
-- IMPORTANT: Replace 'YOUR_EMAIL_HERE' with your actual email address

DO $$
DECLARE
    v_app_user_id UUID;
    v_user_id UUID;
    v_org_id UUID;
    v_email VARCHAR(255) := 'YOUR_EMAIL_HERE';  -- <-- CHANGE THIS TO YOUR EMAIL
    v_agent_id UUID;
    v_agent_code VARCHAR(50);
BEGIN
    -- Get user details
    SELECT id, user_id, organization_id
    INTO v_app_user_id, v_user_id, v_org_id
    FROM app_users
    WHERE email = v_email;

    IF v_app_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with email: %', v_email;
    END IF;

    -- Check if agent profile already exists
    IF EXISTS (SELECT 1 FROM agents WHERE user_id = v_app_user_id OR email = v_email) THEN
        RAISE NOTICE '⚠️  Agent profile already exists for this user';
        RETURN;
    END IF;

    -- Generate agent code
    v_agent_code := 'AG' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');

    -- Create agent profile
    INSERT INTO agents (
        organization_id,
        user_id,
        agent_code,
        first_name,
        last_name,
        email,
        employment_status,
        employment_type,
        agent_level,
        commission_type,
        commission_rate,
        hire_date,
        created_by
    )
    SELECT
        v_org_id,
        v_app_user_id,
        v_agent_code,
        SPLIT_PART(au.full_name, ' ', 1) as first_name,
        COALESCE(SPLIT_PART(au.full_name, ' ', 2), SPLIT_PART(au.full_name, ' ', 1)) as last_name,
        au.email,
        'active',
        'full_time',
        'senior',
        'percentage',
        3.00,
        CURRENT_DATE,
        v_app_user_id
    FROM app_users au
    WHERE au.id = v_app_user_id
    RETURNING id INTO v_agent_id;

    RAISE NOTICE '✅ Agent profile created successfully!';
    RAISE NOTICE '   Agent ID: %', v_agent_id;
    RAISE NOTICE '   Agent Code: %', v_agent_code;
    RAISE NOTICE '   Email: %', v_email;
    RAISE NOTICE '';
    RAISE NOTICE '🎉 You can now access the Agent Dashboard!';

END $$;

-- Step 3: Verify agent profile was created
-- =====================================================
SELECT
    a.id,
    a.agent_code,
    a.first_name,
    a.last_name,
    a.email,
    a.employment_status,
    a.agent_level,
    a.commission_rate,
    au.full_name as app_user_name,
    au.email as app_user_email
FROM agents a
JOIN app_users au ON a.user_id = au.id
WHERE a.email = 'YOUR_EMAIL_HERE'  -- <-- CHANGE THIS TO YOUR EMAIL
OR au.email = 'YOUR_EMAIL_HERE';  -- <-- CHANGE THIS TO YOUR EMAIL

-- =====================================================
-- ALTERNATIVE: Create agent profile for ALL users with agent role
-- =====================================================
-- Uncomment this if you want to create agent profiles for all users
-- who have the agent role but don't have an agent profile yet

/*
DO $$
DECLARE
    v_user RECORD;
    v_agent_code VARCHAR(50);
    v_agent_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Loop through all users with agent role but no agent profile
    FOR v_user IN
        SELECT DISTINCT
            au.id as app_user_id,
            au.user_id,
            au.organization_id,
            au.full_name,
            au.email
        FROM app_users au
        JOIN user_roles ur ON au.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name IN ('agent', 'agent_manager')
        AND au.id NOT IN (SELECT user_id FROM agents WHERE user_id IS NOT NULL)
        AND au.organization_id IS NOT NULL
    LOOP
        -- Generate unique agent code
        v_agent_code := 'AG' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');

        -- Create agent profile
        INSERT INTO agents (
            organization_id,
            user_id,
            agent_code,
            first_name,
            last_name,
            email,
            employment_status,
            employment_type,
            agent_level,
            commission_type,
            commission_rate,
            hire_date,
            created_by
        ) VALUES (
            v_user.organization_id,
            v_user.app_user_id,
            v_agent_code,
            SPLIT_PART(v_user.full_name, ' ', 1),
            COALESCE(SPLIT_PART(v_user.full_name, ' ', 2), SPLIT_PART(v_user.full_name, ' ', 1)),
            v_user.email,
            'active',
            'full_time',
            'senior',
            'percentage',
            3.00,
            CURRENT_DATE,
            v_user.app_user_id
        )
        RETURNING id INTO v_agent_id;

        v_count := v_count + 1;

        RAISE NOTICE '✅ Created agent profile for: % (Code: %)', v_user.email, v_agent_code;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '🎉 Created % agent profiles!', v_count;
END $$;
*/
