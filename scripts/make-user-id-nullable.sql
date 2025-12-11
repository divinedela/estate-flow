-- Make user_id nullable in app_users to allow creating team member profiles
-- before they have an actual auth account
-- Run this in Supabase SQL Editor

-- Drop the NOT NULL constraint on user_id
ALTER TABLE app_users ALTER COLUMN user_id DROP NOT NULL;

-- Add a unique index for email when user_id is null
-- This prevents duplicate team member profiles for the same email
CREATE UNIQUE INDEX IF NOT EXISTS unique_email_when_no_auth
ON app_users (email)
WHERE user_id IS NULL;

-- Comment on the change
COMMENT ON COLUMN app_users.user_id IS 'Auth user ID - can be NULL for team members who have not yet created an account';
