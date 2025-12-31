-- Employee Self-Service Role Migration
-- This migration adds the 'employee' role for employee self-service portal

-- =====================================================
-- ADD EMPLOYEE ROLE
-- =====================================================
INSERT INTO roles (name, description, is_system) VALUES
    ('employee', 'Regular employee with access to self-service portal', TRUE)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- PERMISSIONS FOR EMPLOYEES
-- =====================================================

-- Add employee self-service permissions
INSERT INTO permissions (name, description, resource, action) VALUES
    ('view_own_profile', 'View own employee profile', 'hr', 'read'),
    ('view_own_leave_balance', 'View own leave balances', 'hr', 'read'),
    ('request_leave', 'Submit leave requests', 'hr', 'write'),
    ('view_own_leave_requests', 'View own leave request history', 'hr', 'read'),
    ('view_own_attendance', 'View own attendance records', 'hr', 'read'),
    ('view_own_documents', 'View own documents', 'hr', 'read'),
    ('view_own_payslips', 'View own payslips', 'hr', 'read')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to employee role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'employee'
AND p.name IN (
    'view_own_profile',
    'view_own_leave_balance',
    'request_leave',
    'view_own_leave_requests',
    'view_own_attendance',
    'view_own_documents',
    'view_own_payslips'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- =====================================================
-- UPDATE RLS POLICIES FOR EMPLOYEE ACCESS
-- =====================================================

-- Allow employees to view their own employee record
CREATE POLICY IF NOT EXISTS employees_view_own ON employees
    FOR SELECT
    USING (
        app_user_id = get_user_id()
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = get_user_id()
            AND r.name IN ('hr_manager', 'super_admin')
        )
    );

-- Allow employees to view their own leave balances
CREATE POLICY IF NOT EXISTS leave_balances_view_own ON leave_balances
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = leave_balances.employee_id
            AND e.app_user_id = get_user_id()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = get_user_id()
            AND r.name IN ('hr_manager', 'super_admin')
        )
    );

-- Allow employees to view their own leave requests
CREATE POLICY IF NOT EXISTS leave_requests_view_own ON leave_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = leave_requests.employee_id
            AND e.app_user_id = get_user_id()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = get_user_id()
            AND r.name IN ('hr_manager', 'super_admin')
        )
    );

-- Allow employees to create their own leave requests
CREATE POLICY IF NOT EXISTS leave_requests_create_own ON leave_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = leave_requests.employee_id
            AND e.app_user_id = get_user_id()
        )
    );

-- Allow employees to view their own attendance records
CREATE POLICY IF NOT EXISTS attendance_logs_view_own ON attendance_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = attendance_logs.employee_id
            AND e.app_user_id = get_user_id()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = get_user_id()
            AND r.name IN ('hr_manager', 'project_manager', 'super_admin')
        )
    );

-- Allow employees to view their own documents
CREATE POLICY IF NOT EXISTS employee_documents_view_own ON employee_documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = employee_documents.employee_id
            AND e.app_user_id = get_user_id()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = get_user_id()
            AND r.name IN ('hr_manager', 'super_admin')
        )
    );

-- Allow employees to view their own payroll records (if they exist)
CREATE POLICY IF NOT EXISTS payroll_records_view_own ON payroll_records
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = payroll_records.employee_id
            AND e.app_user_id = get_user_id()
        )
        OR EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = get_user_id()
            AND r.name IN ('hr_manager', 'super_admin')
        )
    );

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON ROLE employee IS 'Regular employee role with self-service portal access';
