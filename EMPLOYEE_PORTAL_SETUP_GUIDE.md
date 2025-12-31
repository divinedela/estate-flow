# Employee Self-Service Portal - Setup Guide

## Overview

The Employee Self-Service Portal allows regular employees to access and manage their personal HR information without needing to contact HR for routine tasks.

## Features Implemented

### ✅ Employee Dashboard (`/employee`)
**Key Sections:**
- **Welcome Header** - Displays employee name, position, and department
- **Leave Balance Card** - Shows remaining leave days, used/allocated breakdown, pending requests
- **Attendance This Month** - Present days, absent days, total records
- **Today's Status** - Current day attendance status with check-in time
- **My Documents** - Total documents count with expiry alerts
- **Quick Actions** - Fast links to Request Leave, View Profile, Documents, Attendance
- **Recent Leave Requests** - Last 5 leave requests with status
- **Document Expiry Alerts** - Proactive notifications for documents expiring within 30 days

### ✅ My Profile (`/employee/profile`)
**Information Displayed:**
- **Personal Information:**
  - Full name
  - Email and phone
  - Date of birth
  - Address
- **Employment Details:**
  - Employee number
  - Position and department
  - Employment type (Full-time, Part-time, Contract, Intern)
  - Hire date
  - Reporting manager
- **Emergency Contact:**
  - Contact name
  - Contact phone
- **Note:** Profile is read-only. Updates must be requested through HR.

### ✅ My Leave (`/employee/leave`)
**Features:**
- **Leave Balances** - Cards showing each leave type:
  - Allocated days
  - Used days
  - Pending days (awaiting approval)
  - Carried forward days
  - Remaining balance calculation
- **Leave Request History** - Complete list of all leave requests:
  - Leave type and duration
  - Number of days
  - Request reason
  - Status (Pending, Approved, Rejected, Cancelled)
  - Approval/Rejection details
  - Approver information
- **Request Leave** - Button to submit new leave request

### 📝 Additional Pages (To Be Created)
- **Leave Request Form** (`/employee/leave/request`)
- **My Attendance** (`/employee/attendance`) - Calendar view and monthly summary
- **My Documents** (`/employee/documents`) - View, download, upload documents

## Setup Instructions

### Step 1: Apply Database Migration

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project
3. Click on **SQL Editor**
4. Copy the contents of `supabase/migrations/029_employee_role.sql`
5. Paste and execute in the SQL Editor

**What this migration does:**
- Creates the `employee` role
- Adds employee-specific permissions
- Creates RLS policies for employee self-service access
- Allows employees to view their own:
  - Employee profile
  - Leave balances and requests
  - Attendance records
  - Documents
  - Payroll records (if applicable)

### Step 2: Assign Employee Role to Users

For each employee who should have portal access:

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find the user's email
3. Note their `id` (UUID)
4. Go to **SQL Editor** and run:

```sql
-- First, get the employee's app_user id
SELECT id, full_name FROM app_users WHERE email = 'employee@company.com';

-- Then get the employee role id
SELECT id FROM roles WHERE name = 'employee';

-- Assign the employee role
INSERT INTO user_roles (user_id, role_id, organization_id)
VALUES (
  '[app_user_id_from_step_1]',
  '[role_id_from_step_2]',
  '[organization_id]'  -- Get this from the app_users table
)
ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
```

**OR** use the simplified query:

```sql
-- Assign employee role by email
WITH employee_data AS (
  SELECT au.id as user_id, au.organization_id
  FROM app_users au
  WHERE au.email = 'employee@company.com'
),
role_data AS (
  SELECT id as role_id FROM roles WHERE name = 'employee'
)
INSERT INTO user_roles (user_id, role_id, organization_id)
SELECT ed.user_id, rd.role_id, ed.organization_id
FROM employee_data ed, role_data rd
ON CONFLICT (user_id, role_id, organization_id) DO NOTHING;
```

### Step 3: Link Users to Employee Records

For the portal to work, users must have an employee record:

```sql
-- Check if user has an employee record
SELECT e.*
FROM employees e
JOIN app_users au ON au.id = e.app_user_id
WHERE au.email = 'employee@company.com';

-- If no record exists, you need to create one or link existing employee
-- Option 1: Link existing employee record to app_user
UPDATE employees
SET app_user_id = (SELECT id FROM app_users WHERE email = 'employee@company.com')
WHERE employee_number = 'EMP001';

-- Option 2: Create new employee record (use the HR module UI instead)
-- Go to /hr/employees/new to create a complete employee profile
```

### Step 4: Verify Access

1. **Login as the employee**
2. Check the sidebar - you should see:
   - My Dashboard
   - My Profile
   - My Leave
   - My Attendance
   - My Documents
3. Navigate to **My Dashboard** (`/employee`)
4. Verify all data loads correctly

## Employee Permissions

### What Employees CAN Do:
- ✅ View their own employee profile
- ✅ View leave balances for current year
- ✅ View all their leave requests (history)
- ✅ Submit new leave requests
- ✅ View their attendance records
- ✅ View and download their documents
- ✅ View their payslips (if payroll is configured)

### What Employees CANNOT Do:
- ❌ View other employees' data
- ❌ Edit their own profile (must request changes through HR)
- ❌ Approve/reject leave requests
- ❌ Create attendance records (HR/Manager only)
- ❌ Upload documents (HR only, unless specifically allowed)
- ❌ Access HR management functions
- ❌ View organization-wide reports

## Security & Privacy

### Row Level Security (RLS)
All employee data is protected by RLS policies that ensure:
- Employees can ONLY see their own data
- Data is filtered by the logged-in user's `app_user_id`
- Cross-employee data leakage is prevented
- HR managers and super admins can see all data

### Data Access Flow
```
1. User logs in → Supabase Auth
2. Gets app_user record → Links to employee record
3. RLS policies filter data → Only returns employee's own records
4. Dashboard displays → Employee's personal data only
```

## Troubleshooting

### Employee can't see dashboard
**Problem:** "Employee record not found" error

**Solution:**
1. Verify employee has `employee` role assigned
2. Check that user's `app_users` record exists
3. Ensure employee record has correct `app_user_id` linking

```sql
-- Debug query
SELECT
  au.email,
  au.id as app_user_id,
  e.employee_number,
  e.app_user_id as employee_link,
  r.name as role
FROM app_users au
LEFT JOIN employees e ON e.app_user_id = au.id
LEFT JOIN user_roles ur ON ur.user_id = au.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE au.email = 'employee@company.com';
```

### Leave balances not showing
**Problem:** No leave balances appear

**Solution:**
1. Check if leave balances exist for current year:

```sql
SELECT * FROM leave_balances
WHERE employee_id = '[employee_id]'
AND year = EXTRACT(YEAR FROM CURRENT_DATE);
```

2. If missing, create leave balances (HR function):
   - Go to `/hr/employees/[id]`
   - HR can allocate leave balances for the employee

### Sidebar not showing employee menu
**Problem:** Employee role assigned but sidebar shows nothing

**Solution:**
1. Clear browser cache and refresh
2. Verify role assignment in database
3. Check that user is logged in correctly
4. Ensure sidebar has been updated with employee navigation items

## Database Schema Reference

### Key Tables Used

#### employees
- Links to `app_users` via `app_user_id`
- Contains all employee information

#### leave_balances
- Tracks leave allocation per employee per year
- Fields: `allocated_days`, `used_days`, `pending_days`, `carried_forward_days`

#### leave_requests
- Individual leave applications
- Status: pending, approved, rejected, cancelled

#### attendance_logs
- Daily attendance records
- Fields: `check_in_time`, `check_out_time`, `hours_worked`, `status`

#### employee_documents
- Document storage with expiry tracking
- Links to Supabase Storage for file storage

## Server Actions API

Located in `app/actions/employee.ts`:

### `getMyEmployeeProfile()`
Returns the logged-in employee's complete profile including manager info

### `getMyLeaveBalances()`
Returns leave balances for current year with leave type details

### `getMyLeaveRequests(limit?)`
Returns employee's leave request history, optionally limited

### `getMyAttendance(startDate?, endDate?)`
Returns attendance records for specified date range

### `getTodayAttendance()`
Returns today's attendance record if it exists

### `getMyDocuments()`
Returns employee documents with expiry alerts

### `getEmployeeDashboardStats()`
Returns aggregated statistics for the dashboard:
- Leave: total allocated/used/remaining/pending
- Attendance: present/absent days this month
- Documents: expiring count

## File Structure

```
app/(app)/employee/
├── page.tsx                    # Employee Dashboard
├── profile/
│   └── page.tsx               # My Profile
├── leave/
│   ├── page.tsx               # Leave Balances & History
│   └── request/
│       └── page.tsx           # Request Leave Form (to be created)
├── attendance/
│   └── page.tsx               # My Attendance (to be created)
└── documents/
    └── page.tsx               # My Documents (to be created)

app/actions/
└── employee.ts                 # Server actions for employee data

supabase/migrations/
└── 029_employee_role.sql       # Employee role migration

components/layout/
└── sidebar.tsx                 # Updated with employee navigation
```

## Next Steps - Additional Features to Implement

### 1. Leave Request Form
Create `/employee/leave/request/page.tsx`:
- Select leave type dropdown
- Date range picker (start date, end date)
- Automatic working days calculation
- Reason textarea
- Submit button → Create leave request

### 2. My Attendance Page
Create `/employee/attendance/page.tsx`:
- Calendar view of attendance
- Month navigation
- Daily attendance records table
- Present/Absent/Late status indicators
- Monthly summary statistics

### 3. My Documents Page
Create `/employee/documents/page.tsx`:
- List all employee documents
- Filter by document type
- Download buttons
- Expiry date sorting
- Upload capability (if permitted)
- Expiry notifications

### 4. Payroll Integration (Optional)
If payroll module is developed:
- Create `/employee/payroll/page.tsx`
- Display payslips by month
- Download PDF functionality
- Year-to-date summary
- Tax documents access

### 5. Notifications System
- Real-time leave request status updates
- Document expiry reminders
- Birthday wishes
- Company announcements
- Task assignments from project module

## Benefits of Employee Portal

### For Employees:
- ✅ 24/7 access to personal HR information
- ✅ Self-service leave requests (no email needed)
- ✅ Transparency on leave balances
- ✅ Easy access to documents
- ✅ Attendance tracking
- ✅ Reduced dependency on HR

### For HR Department:
- ✅ Reduced routine inquiries
- ✅ Automated leave request workflow
- ✅ Better employee engagement
- ✅ Audit trail for all actions
- ✅ Time saved on manual processes
- ✅ Improved data accuracy

### For Organization:
- ✅ Digital transformation of HR processes
- ✅ Employee empowerment
- ✅ Reduced administrative overhead
- ✅ Better compliance and record-keeping
- ✅ Modern workplace culture

## Support

For issues or feature requests:
1. Check this documentation
2. Review Supabase logs for errors
3. Verify RLS policies are correctly applied
4. Contact system administrator

## Implementation Checklist

- [x] Database migration applied
- [x] Employee role created
- [x] RLS policies configured
- [x] Server actions created
- [x] Employee dashboard built
- [x] My Profile page created
- [x] My Leave page created
- [x] Sidebar navigation updated
- [ ] Leave request form created
- [ ] My Attendance page created
- [ ] My Documents page created
- [ ] Employee roles assigned to users
- [ ] Testing with real employee data
- [ ] User training completed

## Conclusion

The Employee Self-Service Portal provides a modern, secure way for employees to manage their HR-related tasks independently. Follow this guide to complete the setup and unlock the full potential of your Estate Flow ERP system.
