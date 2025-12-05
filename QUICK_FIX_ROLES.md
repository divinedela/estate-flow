# Quick Fix: Assign Super Admin Role

If you're seeing "You don't have permission to access this resource" on all pages except the dashboard, it means your user doesn't have a role assigned.

## Quick Solution

### Option 1: Assign Role by Email (Easiest)

1. Open Supabase SQL Editor
2. Open the file: `scripts/assign-role-by-email.sql`
3. Replace `'your-email@example.com'` with your actual email address
4. Run the script

This will:
- Find your auth user by email
- Create an `app_user` record if it doesn't exist
- Assign the `super_admin` role to you

### Option 2: Assign Role by Auth User ID

1. Get your auth user ID:
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```

2. Open `scripts/assign-super-admin-role.sql`
3. Replace `'YOUR_AUTH_USER_ID'` with your actual auth user ID
4. Run the script

## Verify Your Role

After running the script, verify your role assignment:

```sql
SELECT 
    au.email,
    au.full_name,
    r.name as role_name,
    o.name as organization
FROM app_users au
JOIN user_roles ur ON au.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN organizations o ON ur.organization_id = o.id
WHERE au.email = 'your-email@example.com';
```

You should see `super_admin` in the `role_name` column.

## After Assigning the Role

1. **Refresh your browser** (or log out and log back in)
2. You should now be able to access all pages

## Available Roles

- `super_admin` - Full access to everything
- `hr_manager` - HR module access
- `project_manager` - Project management access
- `site_engineer` - Site operations access
- `marketing_officer` - Marketing/CRM access
- `procurement_officer` - Purchasing access
- `inventory_officer` - Inventory access
- `facility_manager` - Facility management access
- `executive` - Read-only access

## Troubleshooting

**Still seeing permission errors?**
1. Make sure you refreshed the page or logged out/in
2. Check browser console for any errors
3. Verify the role was assigned using the verification query above
4. Make sure your `app_user` record exists and is linked to your auth user

