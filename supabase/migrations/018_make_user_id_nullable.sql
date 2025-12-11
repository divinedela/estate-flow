-- Make user_id nullable in app_users to allow creating team member profiles
-- before they have an actual auth account

-- Drop the NOT NULL constraint on user_id
ALTER TABLE app_users ALTER COLUMN user_id DROP NOT NULL;

-- Update the unique constraint to allow multiple NULL values
-- (PostgreSQL allows multiple NULLs in a UNIQUE column)
-- The UNIQUE constraint on user_id is already fine for this use case

-- Add a check constraint to ensure email is unique when user_id is null
-- This prevents duplicate team member profiles for the same email
CREATE UNIQUE INDEX unique_email_when_no_auth
ON app_users (email)
WHERE user_id IS NULL;

-- Comment on the change
COMMENT ON COLUMN app_users.user_id IS 'Auth user ID - can be NULL for team members who have not yet created an account';
