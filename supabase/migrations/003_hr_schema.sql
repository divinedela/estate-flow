-- HR Module Database Schema
-- This migration creates tables for employee management, documents, leave, and attendance

-- =====================================================
-- EMPLOYEES
-- =====================================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_number VARCHAR(50) UNIQUE,
    app_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL, -- Link to app_users if employee has system access
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    hire_date DATE NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    employment_type VARCHAR(50), -- e.g., 'full_time', 'part_time', 'contract', 'intern'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'terminated', 'on_leave'
    manager_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    salary DECIMAL(12, 2),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- LEAVE TYPES
-- =====================================================
CREATE TABLE leave_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    max_days_per_year INTEGER,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    carry_forward BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, code)
);

-- =====================================================
-- LEAVE BALANCES
-- =====================================================
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    allocated_days DECIMAL(5, 2) DEFAULT 0,
    used_days DECIMAL(5, 2) DEFAULT 0,
    pending_days DECIMAL(5, 2) DEFAULT 0,
    carried_forward_days DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, leave_type_id, year)
);

-- =====================================================
-- LEAVE REQUESTS
-- =====================================================
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested DECIMAL(5, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- EMPLOYEE DOCUMENTS
-- =====================================================
CREATE TABLE employee_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- e.g., 'contract', 'id_card', 'certificate', 'license'
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_name VARCHAR(255),
    file_size INTEGER,
    expiry_date DATE,
    issued_date DATE,
    issued_by VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- ATTENDANCE LOGS
-- =====================================================
CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    hours_worked DECIMAL(5, 2),
    status VARCHAR(50) DEFAULT 'present', -- 'present', 'absent', 'late', 'half_day', 'on_leave'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    UNIQUE(employee_id, date)
);

-- =====================================================
-- PAYROLL RECORDS (Optional - Simplified)
-- =====================================================
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    gross_salary DECIMAL(12, 2) NOT NULL,
    deductions DECIMAL(12, 2) DEFAULT 0,
    net_salary DECIMAL(12, 2) NOT NULL,
    payment_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processed', 'paid'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES app_users(id) ON DELETE SET NULL
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_employees_organization_id ON employees(organization_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_manager_id ON employees(manager_id);
CREATE INDEX idx_leave_balances_employee_id ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);
CREATE INDEX idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX idx_employee_documents_expiry ON employee_documents(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_attendance_logs_employee_id ON attendance_logs(employee_id);
CREATE INDEX idx_attendance_logs_date ON attendance_logs(date);
CREATE INDEX idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX idx_payroll_records_period ON payroll_records(pay_period_start, pay_period_end);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at for HR tables
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_types_updated_at BEFORE UPDATE ON leave_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_documents_updated_at BEFORE UPDATE ON employee_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_logs_updated_at BEFORE UPDATE ON attendance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at BEFORE UPDATE ON payroll_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate days between dates (excluding weekends)
CREATE OR REPLACE FUNCTION calculate_working_days(start_date DATE, end_date DATE)
RETURNS DECIMAL(5, 2) AS $$
DECLARE
    days_count DECIMAL(5, 2) := 0;
    v_current_date DATE := start_date;
BEGIN
    WHILE v_current_date <= end_date LOOP
        -- Exclude weekends (Saturday = 6, Sunday = 0)
        IF EXTRACT(DOW FROM v_current_date) NOT IN (0, 6) THEN
            days_count := days_count + 1;
        END IF;
        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;
    RETURN days_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notification for document expiry (30 days before)
CREATE OR REPLACE FUNCTION notify_document_expiry()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id UUID;
    v_document_title VARCHAR;
BEGIN
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN
        v_employee_id := NEW.employee_id;
        v_document_title := NEW.title;
        
        -- Create notification for HR managers
        INSERT INTO notifications (user_id, type, title, message, payload)
        SELECT 
            au.id,
            'document_expiring',
            'Document Expiring Soon',
            'Document "' || v_document_title || '" for employee is expiring on ' || NEW.expiry_date::text,
            jsonb_build_object(
                'employee_id', v_employee_id,
                'document_id', NEW.id,
                'expiry_date', NEW.expiry_date
            )
        FROM app_users au
        JOIN user_roles ur ON au.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'hr_manager'
        AND au.organization_id = (SELECT organization_id FROM employees WHERE id = v_employee_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_document_expiry
    AFTER INSERT OR UPDATE OF expiry_date ON employee_documents
    FOR EACH ROW
    WHEN (NEW.expiry_date IS NOT NULL)
    EXECUTE FUNCTION notify_document_expiry();

