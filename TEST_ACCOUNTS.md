# Test Accounts Guide

This guide helps you create test accounts with different roles to test all features of the Estate Flow ERP system.

## Quick Setup Options

### Option 1: Automated Script (Recommended)

**Prerequisites:**
1. Complete all database migrations (001-014)
2. Set up your `.env.local` file with Supabase credentials
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (required for creating auth users)

**Run Setup Script:**
```bash
npm run setup:test-users
```

This will automatically:
- ✅ Create test organization
- ✅ Create 9 test users in Supabase Auth
- ✅ Create app user records
- ✅ Assign roles to each user

**All accounts use password: `TestPassword123!`**

**Note:** If the script can't create auth users (API limitations), it will guide you to create them manually first.

### Option 2: Quick SQL Setup (Fastest)

1. **Create auth users in Supabase Dashboard:**
   - Go to Authentication > Users > Add User
   - Create all 9 users with password: `TestPassword123!`
   - Emails: superadmin@test.com, hrmanager@test.com, etc.

2. **Run the quick setup SQL:**
   ```sql
   -- In Supabase SQL Editor, run:
   -- scripts/quick-setup.sql
   ```
   
   This will automatically:
   - Find auth users by email
   - Create app_user records
   - Assign roles

### Option 3: Manual Step-by-Step

See detailed instructions below.

## Manual Setup

If you prefer to set up manually:

### Step 1: Create Auth Users

Go to Supabase Dashboard > Authentication > Users > Add User

Create these users (all with password: `TestPassword123!`):
1. superadmin@test.com
2. hrmanager@test.com
3. projectmanager@test.com
4. siteengineer@test.com
5. marketing@test.com
6. procurement@test.com
7. inventory@test.com
8. facility@test.com
9. executive@test.com

### Step 2: Get Auth User IDs

Run this query in Supabase SQL Editor:
```sql
SELECT id, email FROM auth.users WHERE email LIKE '%@test.com' ORDER BY email;
```

### Step 3: Create App Users and Assign Roles

Run the SQL script: `scripts/setup-test-users-simple.sql`

Or use the helper function:
```sql
SELECT create_test_user('AUTH_USER_ID', 'email@test.com', 'Full Name', 'role_name');
```

## Test Accounts Summary

| Email | Password | Role | Primary Access |
|-------|----------|------|----------------|
| superadmin@test.com | TestPassword123! | Super Admin | Everything |
| hrmanager@test.com | TestPassword123! | HR Manager | HR Module |
| projectmanager@test.com | TestPassword123! | Project Manager | Projects |
| siteengineer@test.com | TestPassword123! | Site Engineer | Site Operations |
| marketing@test.com | TestPassword123! | Marketing Officer | CRM/Marketing |
| procurement@test.com | TestPassword123! | Procurement Officer | Purchasing |
| inventory@test.com | TestPassword123! | Inventory Officer | Inventory |
| facility@test.com | TestPassword123! | Facility Manager | Facilities |
| executive@test.com | TestPassword123! | Executive | Read-only |

## Feature Testing Matrix

### Super Admin
- ✅ All modules (full access)
- ✅ User & role management
- ✅ Organization settings
- ✅ Audit logs
- ✅ System configuration

### HR Manager
- ✅ Employee CRUD
- ✅ Leave request approval
- ✅ Document management
- ✅ Attendance tracking
- ✅ Payroll management

### Project Manager
- ✅ Create/edit projects
- ✅ Assign tasks
- ✅ Manage team members
- ✅ Track progress
- ✅ View budgets

### Site Engineer
- ✅ View assigned projects
- ✅ Update task status
- ✅ Report issues
- ✅ View project details
- ❌ Cannot create projects

### Marketing Officer
- ✅ Manage leads
- ✅ Create campaigns
- ✅ Add/edit properties
- ✅ Track interactions
- ✅ View analytics

### Procurement Officer
- ✅ Approve PRs
- ✅ Create POs
- ✅ Manage suppliers
- ✅ Process GRNs
- ✅ Handle invoices

### Inventory Officer
- ✅ Manage items
- ✅ Record transactions
- ✅ Set reorder rules
- ✅ View stock levels
- ✅ Generate reports

### Facility Manager
- ✅ Manage facilities
- ✅ Handle maintenance requests
- ✅ Assign work orders
- ✅ Track assets
- ✅ Schedule preventive maintenance

### Executive
- ✅ View all dashboards
- ✅ View reports
- ✅ View KPIs
- ❌ No write access
- ❌ Cannot modify data

## Testing Workflows

### HR Workflow
1. Login as `hrmanager@test.com`
2. Add employees
3. Create leave types
4. Approve leave requests
5. Upload documents

### Project Workflow
1. Login as `projectmanager@test.com`
2. Create a new project
3. Add phases and milestones
4. Assign tasks to team members
5. Track progress

### Procurement Workflow
1. Login as regular user (create PR)
2. Login as `procurement@test.com` (approve PR)
3. Create PO from approved PR
4. Login as `inventory@test.com` (receive goods)
5. Verify stock updated

### Marketing Workflow
1. Login as `marketing@test.com`
2. Create a campaign
3. Add leads
4. Track interactions
5. Convert leads to customers

## Troubleshooting

### Users can't log in
- Check that auth users were created in Supabase Auth
- Verify password is correct
- Check that app_users record exists

### Users see "No permission" errors
- Verify user_roles table has entries
- Check that roles are assigned correctly
- Ensure organization_id matches

### Can't see data
- Verify RLS policies are enabled
- Check that user has correct organization_id
- Ensure role permissions are set up

## Cleanup

To remove all test data:
```sql
-- Remove test users (be careful!)
DELETE FROM user_roles WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM app_users WHERE organization_id = '00000000-0000-0000-0000-000000000001';
DELETE FROM organizations WHERE id = '00000000-0000-0000-0000-000000000001';
-- Then delete auth users from Supabase Dashboard
```

