'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Get current employee profile and related data
 */
export async function getMyEmployeeProfile() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get app_user profile
  const { data: appUser } = await supabase
    .from('app_users')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) {
    return { error: 'User profile not found' }
  }

  // Get employee record
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select(`
      *,
      manager:employees!employees_manager_id_fkey(
        id,
        first_name,
        last_name,
        email,
        position
      )
    `)
    .eq('app_user_id', appUser.id)
    .single()

  if (employeeError || !employee) {
    return { error: 'Employee record not found' }
  }

  return { success: true, data: employee }
}

/**
 * Get employee leave balances for current year
 */
export async function getMyLeaveBalances() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) {
    return { error: 'User profile not found' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('app_user_id', appUser.id)
    .single()

  if (!employee) {
    return { error: 'Employee record not found' }
  }

  const currentYear = new Date().getFullYear()

  const { data: balances, error } = await supabase
    .from('leave_balances')
    .select(`
      *,
      leave_type:leave_types(
        id,
        name,
        code,
        is_paid
      )
    `)
    .eq('employee_id', employee.id)
    .eq('year', currentYear)

  if (error) {
    console.error('Error fetching leave balances:', error)
    return { error: 'Failed to fetch leave balances' }
  }

  return { success: true, data: balances || [] }
}

/**
 * Get employee leave requests
 */
export async function getMyLeaveRequests(limit?: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) {
    return { error: 'User profile not found' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('app_user_id', appUser.id)
    .single()

  if (!employee) {
    return { error: 'Employee record not found' }
  }

  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      leave_type:leave_types(
        id,
        name,
        code
      ),
      approver:app_users!leave_requests_approved_by_fkey(
        full_name,
        email
      )
    `)
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data: requests, error } = await query

  if (error) {
    console.error('Error fetching leave requests:', error)
    return { error: 'Failed to fetch leave requests' }
  }

  return { success: true, data: requests || [] }
}

/**
 * Get employee attendance records
 */
export async function getMyAttendance(startDate?: string, endDate?: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) {
    return { error: 'User profile not found' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('app_user_id', appUser.id)
    .single()

  if (!employee) {
    return { error: 'Employee record not found' }
  }

  let query = supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', employee.id)
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate)
  }

  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data: attendance, error } = await query

  if (error) {
    console.error('Error fetching attendance:', error)
    return { error: 'Failed to fetch attendance' }
  }

  return { success: true, data: attendance || [] }
}

/**
 * Get today's attendance status
 */
export async function getTodayAttendance() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) {
    return { error: 'User profile not found' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('app_user_id', appUser.id)
    .single()

  if (!employee) {
    return { error: 'Employee record not found' }
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: attendance, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', today)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching today attendance:', error)
    return { error: 'Failed to fetch attendance' }
  }

  return { success: true, data: attendance || null }
}

/**
 * Get employee documents
 */
export async function getMyDocuments() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) {
    return { error: 'User profile not found' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('app_user_id', appUser.id)
    .single()

  if (!employee) {
    return { error: 'Employee record not found' }
  }

  const { data: documents, error } = await supabase
    .from('employee_documents')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching documents:', error)
    return { error: 'Failed to fetch documents' }
  }

  // Check for expiring documents (within 30 days)
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  const expiringDocs = documents?.filter(doc => {
    if (!doc.expiry_date) return false
    const expiryDate = new Date(doc.expiry_date)
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow
  }) || []

  return {
    success: true,
    data: {
      documents: documents || [],
      expiringCount: expiringDocs.length,
      expiringDocs
    }
  }
}

/**
 * Get employee dashboard stats
 */
export async function getEmployeeDashboardStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) {
    return { error: 'User profile not found' }
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('app_user_id', appUser.id)
    .single()

  if (!employee) {
    return { error: 'Employee record not found' }
  }

  // Get leave stats
  const currentYear = new Date().getFullYear()
  const { data: leaveBalances } = await supabase
    .from('leave_balances')
    .select('allocated_days, used_days')
    .eq('employee_id', employee.id)
    .eq('year', currentYear)

  const totalAllocated = leaveBalances?.reduce((sum, lb) => sum + (lb.allocated_days || 0), 0) || 0
  const totalUsed = leaveBalances?.reduce((sum, lb) => sum + (lb.used_days || 0), 0) || 0

  // Get pending leave requests
  const { count: pendingLeave } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employee.id)
    .eq('status', 'pending')

  // Get this month's attendance
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  const startOfMonth = firstDayOfMonth.toISOString().split('T')[0]

  const { data: monthAttendance } = await supabase
    .from('attendance_logs')
    .select('status')
    .eq('employee_id', employee.id)
    .gte('date', startOfMonth)

  const presentDays = monthAttendance?.filter(a => a.status === 'present').length || 0
  const absentDays = monthAttendance?.filter(a => a.status === 'absent').length || 0

  // Get expiring documents count
  const today = new Date()
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(today.getDate() + 30)

  const { data: documents } = await supabase
    .from('employee_documents')
    .select('expiry_date')
    .eq('employee_id', employee.id)
    .eq('is_active', true)

  const expiringDocs = documents?.filter(doc => {
    if (!doc.expiry_date) return false
    const expiryDate = new Date(doc.expiry_date)
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow
  }).length || 0

  return {
    success: true,
    data: {
      leave: {
        totalAllocated,
        totalUsed,
        remaining: totalAllocated - totalUsed,
        pendingRequests: pendingLeave || 0
      },
      attendance: {
        presentDays,
        absentDays,
        totalDays: (monthAttendance?.length || 0)
      },
      documents: {
        expiringCount: expiringDocs
      }
    }
  }
}
