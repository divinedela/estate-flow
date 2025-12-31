# Marketing Team Management - Setup Guide

This guide will help you set up the marketing team management feature, which allows marketing managers to create and manage team members who can login and handle their assigned clients.

## Features Overview

- **Marketing Manager** (marketing_officer role) can:
  - Create team member accounts
  - View all team members and their performance
  - Assign/reassign leads to team members
  - View team-wide statistics
  - Deactivate/reactivate team members

- **Marketing Team Member** (marketing_team_member role) can:
  - Login with their credentials
  - View their personal dashboard
  - See only leads assigned to them
  - Update their assigned leads
  - View contact information
  - Track their conversion rate

## Setup Instructions

### Step 1: Apply Database Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/028_marketing_team_management.sql`
6. Paste it into the SQL Editor
7. Click **Run** to execute the migration

The migration will create:
- New `marketing_team_member` role
- `marketing_teams` table for team relationships
- Helper functions for team management
- Row Level Security (RLS) policies for proper access control
- Permissions for team members

### Step 2: Verify Migration

After running the migration, verify it was successful:

1. In Supabase Dashboard, go to **Database** > **Tables**
2. Confirm you see a new table: `marketing_teams`
3. Go to **Authentication** > **Policies**
4. Confirm new policies were created for `marketing_teams` and `leads` tables

### Step 3: Access Team Management

1. Login as a user with `marketing_officer` or `super_admin` role
2. Navigate to **Marketing / CRM** from the sidebar
3. Click on the **Team** quick link (or go to `/marketing/team`)
4. You should see the Team Management page with:
   - Team overview statistics
   - "Add Team Member" button
   - Team members list (empty initially)

### Step 4: Create Your First Team Member

1. On the Team Management page, click **Add Team Member**
2. Fill in the required information:
   - **Full Name**: Team member's full name
   - **Email**: Their login email (must be unique)
   - **Phone**: Contact number (optional)
   - **Password**: Initial password (min 6 characters)
3. Click **Create Team Member**
4. The new team member will appear in your team list

### Step 5: Team Member Login

1. The team member can now login at `/login` with their credentials
2. Upon login, they will see:
   - **My Dashboard** in the sidebar (their personal dashboard at `/marketing-team`)
   - **My Leads** - Shows only leads assigned to them
   - **Contacts** - Access to the contact database

## Assigning Leads to Team Members

### Option 1: During Lead Creation
When creating a new lead, the "Assigned To" dropdown will show:
- **Me (Manager)** - Assign to yourself
- All your active team members

### Option 2: Reassigning Existing Leads
1. Go to **Marketing / CRM** > **Leads**
2. Click on a lead to edit
3. Update the "Assigned To" field
4. Save the changes

## Team Member Permissions

Team members have access to:
- ✅ View leads assigned to them
- ✅ Update their assigned leads (status, notes, interactions)
- ✅ View contact database
- ✅ Create interactions with clients
- ❌ Cannot create new leads (manager only)
- ❌ Cannot view leads assigned to other team members
- ❌ Cannot access team management
- ❌ Cannot reassign leads

## Manager Features

### View Team Performance
On the `/marketing/team` page, managers can see:
- **Team Size**: Number of active team members
- **Total Leads**: All leads across the entire team
- **Active Leads**: Leads currently in progress
- **Converted Leads**: Successfully closed deals
- **Team Conversion Rate**: Average conversion rate

### Individual Team Member Stats
For each team member, view:
- Total leads assigned
- Active leads (in progress)
- Converted leads
- Individual conversion rate
- Join date
- Contact information

### Deactivate/Reactivate Team Members
1. Click the three dots (⋮) next to a team member
2. Select **Deactivate** to prevent login (soft delete)
3. Select **Reactivate** to restore access
4. Deactivated members cannot login but their data is preserved

## Dashboard Views

### Marketing Manager Dashboard (`/marketing`)
Shows:
- Combined team statistics
- All leads (including team members' leads)
- Team quick link
- Standard marketing officer features

### Team Member Dashboard (`/marketing-team`)
Shows:
- Personal statistics only
- Recently assigned leads
- Manager information
- Quick links to leads and contacts

## Troubleshooting

### Team member can't login
- Verify the account is **active** in the team members list
- Check that the correct email and password are being used
- Ensure the migration was applied successfully

### Team member sees "Access Denied"
- Verify they have the `marketing_team_member` role assigned
- Check that the `marketing_teams` relationship exists
- Confirm RLS policies were created correctly

### Leads not showing for team member
- Verify leads are assigned to their user ID
- Check that the team member is linked to the manager
- Review RLS policies on the `leads` table

### Cannot create team members
- Ensure you're logged in as `marketing_officer` or `super_admin`
- Check browser console for errors
- Verify database permissions are correct

## Database Schema

### marketing_teams Table
```sql
- id: UUID (primary key)
- organization_id: UUID (organization reference)
- manager_id: UUID (marketing officer user)
- team_member_id: UUID (team member user)
- is_active: BOOLEAN (active status)
- assigned_at: TIMESTAMP (when added to team)
- assigned_by: UUID (who added them)
```

### Key Relationships
- `manager_id` → `app_users` (marketing officer)
- `team_member_id` → `app_users` (team member)
- Team members linked to ONE manager
- Managers can have MANY team members
- Leads assigned to `app_users.id` (can be manager or team member)

## Security Features

### Row Level Security (RLS)
- Marketing managers can only see/manage their own team members
- Team members can only see leads assigned to them
- Team members cannot see other team members
- Super admins can see everything

### Data Access
- Managers see: Their leads + all team members' leads
- Team members see: Only their assigned leads
- Contacts: Visible to both (organization-wide)
- Properties: Visible to both (organization-wide)

## API Reference

### Server Actions (app/actions/marketing-teams.ts)

#### `createTeamMember(data)`
Creates a new team member account
- **Parameters**: `{ email, password, full_name, phone? }`
- **Returns**: `{ success, data, error, message }`
- **Permissions**: marketing_officer, super_admin

#### `getTeamMembers()`
Gets all team members for current manager
- **Returns**: `{ success, data, error }`
- **Data includes**: User info + lead statistics

#### `deactivateTeamMember(teamMemberId)`
Deactivates a team member
- **Parameters**: `teamMemberId: string`
- **Returns**: `{ success, error, message }`

#### `reactivateTeamMember(teamMemberId)`
Reactivates a team member
- **Parameters**: `teamMemberId: string`
- **Returns**: `{ success, error, message }`

#### `getTeamMembersForAssignment()`
Gets team members for lead assignment dropdown
- **Returns**: `{ success, data }` with manager + team members

#### `getTeamOverview()`
Gets team-wide statistics
- **Returns**: `{ success, data }` with aggregated stats

## Next Steps

1. ✅ Apply the database migration
2. ✅ Create your first team member
3. ✅ Assign some leads to the team member
4. ✅ Have the team member login and test
5. ✅ Monitor team performance from `/marketing/team`

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Review Supabase logs for database errors
3. Verify all migrations ran successfully
4. Check that RLS policies are enabled

For additional help, refer to the implementation files:
- Database: `supabase/migrations/028_marketing_team_management.sql`
- Server Actions: `app/actions/marketing-teams.ts`
- Team Page: `app/(app)/marketing/team/page.tsx`
- Team Dashboard: `app/(app)/marketing-team/page.tsx`
- Components: `components/marketing/`
