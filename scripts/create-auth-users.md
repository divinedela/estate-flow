# Creating Auth Users Manually

Since the automated script may have limitations with the Supabase Admin API, here's how to create auth users manually:

## Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication > Users**
3. Click **"Add User"** or **"Invite User"**
4. For each test account:
   - **Email**: Use the email from the list below
   - **Password**: `TestPassword123!`
   - **Auto Confirm**: ✅ Check this box
5. Click **"Create User"**

### Test Accounts to Create:
- superadmin@test.com
- hrmanager@test.com
- projectmanager@test.com
- siteengineer@test.com
- marketing@test.com
- procurement@test.com
- inventory@test.com
- facility@test.com
- executive@test.com

## Method 2: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase auth users create superadmin@test.com --password TestPassword123! --email-confirm
supabase auth users create hrmanager@test.com --password TestPassword123! --email-confirm
supabase auth users create projectmanager@test.com --password TestPassword123! --email-confirm
supabase auth users create siteengineer@test.com --password TestPassword123! --email-confirm
supabase auth users create marketing@test.com --password TestPassword123! --email-confirm
supabase auth users create procurement@test.com --password TestPassword123! --email-confirm
supabase auth users create inventory@test.com --password TestPassword123! --email-confirm
supabase auth users create facility@test.com --password TestPassword123! --email-confirm
supabase auth users create executive@test.com --password TestPassword123! --email-confirm
```

## Method 3: After Creating Auth Users

Once auth users are created, you can:

1. **Get the user IDs**:
   ```sql
   SELECT id, email FROM auth.users WHERE email LIKE '%@test.com' ORDER BY email;
   ```

2. **Run the setup script** which will create app_users and assign roles:
   ```bash
   npm run setup:test-users
   ```

   Or use the SQL helper function from `setup-test-users-simple.sql`

## Quick SQL Setup After Auth Users Exist

After creating auth users, run this in Supabase SQL Editor (replace the UUIDs with actual auth user IDs):

```sql
-- First, get auth user IDs
SELECT id, email FROM auth.users WHERE email LIKE '%@test.com';

-- Then use the helper function (replace UUIDs):
SELECT create_test_user('AUTH_USER_ID_HERE', 'superadmin@test.com', 'Super Admin User', 'super_admin');
SELECT create_test_user('AUTH_USER_ID_HERE', 'hrmanager@test.com', 'HR Manager User', 'hr_manager');
-- ... and so on for each user
```



