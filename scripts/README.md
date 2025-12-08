# Test User Setup Scripts

## Quick Setup

### Option 1: Automated Script (Recommended)

1. Make sure your `.env.local` file has your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the setup script:
   ```bash
   npx tsx scripts/setup-test-users.ts
   ```

This will automatically:
- Create a test organization
- Create 9 test users in Supabase Auth
- Create app_user records for each
- Assign appropriate roles to each user

### Option 2: Manual Setup via SQL

1. Go to Supabase Dashboard > Authentication > Users
2. Create users manually with these emails:
   - superadmin@test.com
   - hrmanager@test.com
   - projectmanager@test.com
   - siteengineer@test.com
   - marketing@test.com
   - procurement@test.com
   - inventory@test.com
   - facility@test.com
   - executive@test.com

3. Set password for all: `TestPassword123!`

4. Run the SQL migration `015_test_data.sql` in Supabase SQL Editor, uncommenting and updating the user_id values

## Test Accounts

All test accounts use the password: **TestPassword123!**

| Email | Role | Access |
|-------|------|--------|
| superadmin@test.com | Super Admin | Full system access |
| hrmanager@test.com | HR Manager | HR module management |
| projectmanager@test.com | Project Manager | Project oversight |
| siteengineer@test.com | Site Engineer | Site supervision |
| marketing@test.com | Marketing Officer | Marketing & CRM |
| procurement@test.com | Procurement Officer | Purchasing & procurement |
| inventory@test.com | Inventory Officer | Stock & inventory |
| facility@test.com | Facility Manager | Facility & maintenance |
| executive@test.com | Executive | Read-only access |

## Testing Features by Role

### Super Admin
- ✅ All modules
- ✅ User management
- ✅ Role management
- ✅ System settings
- ✅ Audit logs

### HR Manager
- ✅ Employee management
- ✅ Leave requests approval
- ✅ Document management
- ✅ Attendance tracking
- ✅ Payroll (if implemented)

### Project Manager
- ✅ Project creation & management
- ✅ Task assignment
- ✅ Team management
- ✅ Project dashboards
- ✅ Budget tracking

### Site Engineer
- ✅ View assigned projects
- ✅ Update task status
- ✅ Report issues
- ✅ View project details

### Marketing Officer
- ✅ Lead management
- ✅ Campaign creation
- ✅ Property listings
- ✅ Contact management
- ✅ Interaction tracking

### Procurement Officer
- ✅ Supplier management
- ✅ Purchase requisition approval
- ✅ Purchase order creation
- ✅ Goods receipt processing
- ✅ Invoice management

### Inventory Officer
- ✅ Item management
- ✅ Stock transactions
- ✅ Stock level monitoring
- ✅ Reorder rules
- ✅ Inventory reports

### Facility Manager
- ✅ Facility management
- ✅ Maintenance requests
- ✅ Work order assignment
- ✅ Asset tracking
- ✅ Preventive maintenance

### Executive
- ✅ View all dashboards (read-only)
- ✅ View reports
- ✅ View KPIs
- ❌ No write access



