-- Row Level Security (RLS) Policies for HR Module Tables

-- =====================================================
-- Enable RLS on all HR tables
-- =====================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EMPLOYEES Policies
-- =====================================================
-- HR managers and super admins can view all employees in their organization
CREATE POLICY "HR can view employees in organization"
    ON employees FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
        AND (
            public.is_super_admin()
            OR public.user_has_role('hr_manager')
            OR public.user_has_role('project_manager')
        )
    );

-- Employees can view their own record
CREATE POLICY "Employees can view own record"
    ON employees FOR SELECT
    USING (
        app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        OR id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
    );

-- HR managers and super admins can manage employees
CREATE POLICY "HR can manage employees"
    ON employees FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- LEAVE TYPES Policies
-- =====================================================
-- Everyone in organization can view leave types
CREATE POLICY "Users can view leave types in organization"
    ON leave_types FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM app_users WHERE user_id = (SELECT auth.uid())
        )
    );

-- Only HR managers and super admins can manage leave types
CREATE POLICY "HR can manage leave types"
    ON leave_types FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- LEAVE BALANCES Policies
-- =====================================================
-- Employees can view their own leave balances
CREATE POLICY "Employees can view own leave balances"
    ON leave_balances FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- HR managers can manage leave balances
CREATE POLICY "HR can manage leave balances"
    ON leave_balances FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- LEAVE REQUESTS Policies
-- =====================================================
-- Employees can view their own leave requests
CREATE POLICY "Employees can view own leave requests"
    ON leave_requests FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- Employees can create their own leave requests
CREATE POLICY "Employees can create own leave requests"
    ON leave_requests FOR INSERT
    WITH CHECK (
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
    );

-- Employees can update their own pending leave requests
CREATE POLICY "Employees can update own pending leave requests"
    ON leave_requests FOR UPDATE
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        AND status = 'pending'
    )
    WITH CHECK (
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        AND status = 'pending'
    );

-- HR managers and super admins can approve/reject leave requests
CREATE POLICY "HR can approve leave requests"
    ON leave_requests FOR UPDATE
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- EMPLOYEE DOCUMENTS Policies
-- =====================================================
-- Employees can view their own documents
CREATE POLICY "Employees can view own documents"
    ON employee_documents FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- HR managers can manage documents
CREATE POLICY "HR can manage documents"
    ON employee_documents FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- =====================================================
-- ATTENDANCE LOGS Policies
-- =====================================================
-- Employees can view their own attendance
CREATE POLICY "Employees can view own attendance"
    ON attendance_logs FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    );

-- HR managers and project managers can manage attendance
CREATE POLICY "Managers can manage attendance"
    ON attendance_logs FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
        OR public.user_has_role('project_manager')
    );

-- =====================================================
-- PAYROLL RECORDS Policies
-- =====================================================
-- Employees can view their own payroll records
CREATE POLICY "Employees can view own payroll"
    ON payroll_records FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM employees 
            WHERE app_user_id IN (SELECT id FROM app_users WHERE user_id = (SELECT auth.uid()))
        )
        OR public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

-- Only HR managers and super admins can manage payroll
CREATE POLICY "HR can manage payroll"
    ON payroll_records FOR ALL
    USING (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    )
    WITH CHECK (
        public.is_super_admin()
        OR public.user_has_role('hr_manager')
    );

