-- Fix Leave Requests RLS Policies
-- Allow HR managers and super admins to create leave requests on behalf of employees

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Employees can create own leave requests" ON leave_requests;

-- Create new insert policy that allows:
-- 1. Employees to create their own leave requests
-- 2. HR managers and super admins to create leave requests for any employee in their organization
CREATE POLICY "Users can create leave requests"
    ON leave_requests FOR INSERT
    WITH CHECK (
        -- Employees can create their own leave requests
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        -- OR HR managers and super admins can create for any employee in their organization
        OR (
            (public.is_super_admin() OR public.user_has_role('hr_manager'))
            AND employee_id IN (
                SELECT e.id FROM employees e
                JOIN app_users au ON au.organization_id = e.organization_id
                WHERE au.user_id = (SELECT auth.uid())
            )
        )
    );

-- Also add a policy for HR managers to manage all leave requests in their organization
DROP POLICY IF EXISTS "HR can approve leave requests" ON leave_requests;

CREATE POLICY "HR can manage leave requests"
    ON leave_requests FOR ALL
    USING (
        (public.is_super_admin() OR public.user_has_role('hr_manager'))
        AND employee_id IN (
            SELECT e.id FROM employees e
            JOIN app_users au ON au.organization_id = e.organization_id
            WHERE au.user_id = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        (public.is_super_admin() OR public.user_has_role('hr_manager'))
        AND employee_id IN (
            SELECT e.id FROM employees e
            JOIN app_users au ON au.organization_id = e.organization_id
            WHERE au.user_id = (SELECT auth.uid())
        )
    );

