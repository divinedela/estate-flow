-- Fix RLS Circular Dependency in HR Module Tables
-- The employees policies were causing infinite recursion because they query
-- the employees table within the RLS policy check

-- =====================================================
-- Drop existing problematic policies
-- =====================================================
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
DROP POLICY IF EXISTS "Employees can view own leave balances" ON leave_balances;
DROP POLICY IF EXISTS "Employees can view own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can create own leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can update own pending leave requests" ON leave_requests;
DROP POLICY IF EXISTS "Employees can view own documents" ON employee_documents;
DROP POLICY IF EXISTS "Employees can view own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Employees can view own payroll" ON payroll_records;

-- =====================================================
-- Create helper function to get employee_id by app_user_id
-- This function uses SECURITY DEFINER to bypass RLS
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_user_employee_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id 
        FROM employees 
        WHERE app_user_id = public.get_user_app_user_id()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- Recreate employees policies without circular dependency
-- =====================================================

-- Employees can view their own record (FIXED)
CREATE POLICY "Employees can view own record"
    ON employees FOR SELECT
    USING (
        app_user_id = public.get_user_app_user_id()
        OR id = public.get_user_employee_id()
    );

-- =====================================================
-- Recreate leave_balances policies without circular dependency
-- =====================================================

CREATE POLICY "Employees can view own leave balances"
    ON leave_balances FOR SELECT
    USING (
        employee_id = public.get_user_employee_id()
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- Recreate leave_requests policies without circular dependency
-- =====================================================

CREATE POLICY "Employees can view own leave requests"
    ON leave_requests FOR SELECT
    USING (
        employee_id = public.get_user_employee_id()
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

CREATE POLICY "Employees can create own leave requests"
    ON leave_requests FOR INSERT
    WITH CHECK (
        employee_id = public.get_user_employee_id()
    );

CREATE POLICY "Employees can update own pending leave requests"
    ON leave_requests FOR UPDATE
    USING (
        employee_id = public.get_user_employee_id()
        AND status = 'pending'
    )
    WITH CHECK (
        employee_id = public.get_user_employee_id()
        AND status = 'pending'
    );

-- =====================================================
-- Recreate employee_documents policies without circular dependency
-- =====================================================

CREATE POLICY "Employees can view own documents"
    ON employee_documents FOR SELECT
    USING (
        employee_id = public.get_user_employee_id()
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- Recreate attendance_logs policies without circular dependency
-- =====================================================

CREATE POLICY "Employees can view own attendance"
    ON attendance_logs FOR SELECT
    USING (
        employee_id = public.get_user_employee_id()
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- Recreate payroll_records policies without circular dependency
-- =====================================================

CREATE POLICY "Employees can view own payroll"
    ON payroll_records FOR SELECT
    USING (
        employee_id = public.get_user_employee_id()
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

