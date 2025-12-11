import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  UserGroupIcon, 
  UserPlusIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  XCircleIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

interface Employee {
  id: string
  first_name: string
  last_name: string
  employee_number: string
  department: string | null
  position: string | null
  status: string
  hire_date: string
}

interface LeaveRequest {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  days_requested: number
  status: string
  created_at: string
  employee: {
    first_name: string
    last_name: string
  } | null
  leave_type: {
    name: string
  } | null
}

interface AttendanceToday {
  present: number
  absent: number
  late: number
  onLeave: number
}

interface DocumentExpiry {
  expiring30Days: number
  expiring60Days: number
  overdue: number
  valid: number
  expiringSoon: number
}

interface LeaveBalance {
  leave_type: string
  allocated: number
  used: number
  remaining: number
}

interface ApprovedLeave {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  days_requested: number
  employee: {
    first_name: string
    last_name: string
  } | null
  leave_type: {
    name: string
  } | null
}

interface AbsentEmployee {
  id: string
  first_name: string
  last_name: string
  employee_number: string
  department: string | null
}

async function getHRStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return getEmptyHRStats()
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return getEmptyHRStats()
  }

  const orgId = profile.organization_id
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  const sixtyDaysFromNow = new Date()
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)

  // Fetch all employees
  const { data: allEmployees } = await supabase
    .from('employees')
    .select('id, first_name, last_name, employee_number, department, position, status, hire_date')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const employees = (allEmployees || []) as Employee[]
  const employeeIds = employees.map(e => e.id)

  // Calculate employee stats
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const onLeaveEmployees = employees.filter(e => e.status === 'on_leave').length
  const newHiresThisMonth = employees.filter(e => e.hire_date >= firstDayOfMonth).length
  const recentEmployees = employees.slice(0, 5)

  // Department stats
  const deptMap = new Map<string, number>()
  employees.forEach(e => {
    const dept = e.department || 'Unassigned'
    deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
  })
  const departmentStats = Array.from(deptMap.entries())
    .map(([department, count]) => ({ department, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Leave requests
  let pendingLeaveRequests = 0
  let approvedLeaveThisMonth = 0
  let pendingLeaveList: LeaveRequest[] = []

  if (employeeIds.length > 0) {
    const { count: pendingCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .in('employee_id', employeeIds)

    pendingLeaveRequests = pendingCount || 0

    const { count: approvedCount } = await supabase
      .from('leave_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'approved')
      .gte('created_at', firstDayOfMonth)
      .in('employee_id', employeeIds)

    approvedLeaveThisMonth = approvedCount || 0

    const { data: pendingLeaves } = await supabase
      .from('leave_requests')
      .select(`
        id, employee_id, start_date, end_date, days_requested, status, created_at,
        employee:employees(first_name, last_name),
        leave_type:leave_types(name)
      `)
      .eq('status', 'pending')
      .in('employee_id', employeeIds)
      .order('created_at', { ascending: false })
      .limit(5)

    pendingLeaveList = (pendingLeaves || []) as LeaveRequest[]
  }

  // Documents - detailed breakdown
  let documentExpiry: DocumentExpiry = {
    expiring30Days: 0,
    expiring60Days: 0,
    overdue: 0,
    valid: 0,
    expiringSoon: 0,
  }

  if (employeeIds.length > 0) {
    // Documents expiring in next 30 days
    const { count: expiring30Count } = await supabase
      .from('employee_documents')
      .select('*', { count: 'exact', head: true })
      .in('employee_id', employeeIds)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .gte('expiry_date', today)

    documentExpiry.expiring30Days = expiring30Count || 0

    // Documents expiring in next 60 days (excluding 30 days)
    const { count: expiring60Count } = await supabase
      .from('employee_documents')
      .select('*', { count: 'exact', head: true })
      .in('employee_id', employeeIds)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', sixtyDaysFromNow.toISOString().split('T')[0])
      .gt('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])

    documentExpiry.expiring60Days = expiring60Count || 0

    // Overdue documents
    const { count: overdueCount } = await supabase
      .from('employee_documents')
      .select('*', { count: 'exact', head: true })
      .in('employee_id', employeeIds)
      .not('expiry_date', 'is', null)
      .lt('expiry_date', today)

    documentExpiry.overdue = overdueCount || 0

    // Valid documents (not expiring soon)
    const { count: validCount } = await supabase
      .from('employee_documents')
      .select('*', { count: 'exact', head: true })
      .in('employee_id', employeeIds)
      .or(`expiry_date.is.null,expiry_date.gt.${sixtyDaysFromNow.toISOString().split('T')[0]}`)

    documentExpiry.valid = validCount || 0
    documentExpiry.expiringSoon = documentExpiry.expiring30Days + documentExpiry.expiring60Days
  }

  // Today's attendance
  let attendanceToday: AttendanceToday = { present: 0, absent: 0, late: 0, onLeave: 0 }
  let absentEmployees: AbsentEmployee[] = []
  let attendanceRate = 0

  if (employeeIds.length > 0) {
    const { data: todayAttendance } = await supabase
      .from('attendance_logs')
      .select('status, employee_id')
      .eq('date', today)
      .in('employee_id', employeeIds)

    if (todayAttendance) {
      attendanceToday = {
        present: todayAttendance.filter(a => a.status === 'present').length,
        absent: todayAttendance.filter(a => a.status === 'absent').length,
        late: todayAttendance.filter(a => a.status === 'late').length,
        onLeave: todayAttendance.filter(a => a.status === 'on_leave').length,
      }

      // Get absent employees
      const absentEmployeeIds = todayAttendance
        .filter(a => a.status === 'absent')
        .map(a => a.employee_id)

      if (absentEmployeeIds.length > 0) {
        const { data: absentEmps } = await supabase
          .from('employees')
          .select('id, first_name, last_name, employee_number, department')
          .in('id', absentEmployeeIds)
          .limit(10)

        absentEmployees = (absentEmps || []) as AbsentEmployee[]
      }

      // Calculate attendance rate
      const totalExpected = activeEmployees
      const presentCount = attendanceToday.present + attendanceToday.late
      attendanceRate = totalExpected > 0 
        ? Math.round((presentCount / totalExpected) * 100) 
        : 0
    } else {
      // No attendance logs, assume all active employees are absent
      attendanceRate = 0
      const { data: allActiveEmps } = await supabase
        .from('employees')
        .select('id, first_name, last_name, employee_number, department')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .limit(10)
      
      absentEmployees = (allActiveEmps || []) as AbsentEmployee[]
    }
  }

  // Approved leave requests (upcoming)
  let approvedLeaveList: ApprovedLeave[] = []
  if (employeeIds.length > 0) {
    const { data: approvedLeaves } = await supabase
      .from('leave_requests')
      .select(`
        id, employee_id, start_date, end_date, days_requested,
        employee:employees(first_name, last_name),
        leave_type:leave_types(name)
      `)
      .eq('status', 'approved')
      .gte('start_date', today)
      .in('employee_id', employeeIds)
      .order('start_date', { ascending: true })
      .limit(10)

    approvedLeaveList = (approvedLeaves || []) as ApprovedLeave[]
  }

  // Leave balance summary (by department)
  let leaveBalanceSummary: LeaveBalance[] = []
  if (employeeIds.length > 0) {
    const { data: leaveBalances } = await supabase
      .from('leave_balances')
      .select(`
        allocated_days, used_days, pending_days,
        leave_type:leave_types(name),
        employee:employees(department)
      `)
      .in('employee_id', employeeIds)
      .eq('year', new Date().getFullYear())

    if (leaveBalances) {
      const balanceMap = new Map<string, { allocated: number; used: number; remaining: number }>()
      leaveBalances.forEach((lb: any) => {
        const typeName = lb.leave_type?.name || 'Unknown'
        const allocated = parseFloat(lb.allocated_days?.toString() || '0')
        const used = parseFloat(lb.used_days?.toString() || '0')
        const remaining = allocated - used

        if (balanceMap.has(typeName)) {
          const existing = balanceMap.get(typeName)!
          balanceMap.set(typeName, {
            allocated: existing.allocated + allocated,
            used: existing.used + used,
            remaining: existing.remaining + remaining,
          })
        } else {
          balanceMap.set(typeName, { allocated, used, remaining })
        }
      })

      leaveBalanceSummary = Array.from(balanceMap.entries()).map(([leave_type, data]) => ({
        leave_type,
        allocated: data.allocated,
        used: data.used,
        remaining: data.remaining,
      }))
    }
  }

  // Recent hires (this month)
  const recentHires = employees
    .filter(e => e.hire_date >= firstDayOfMonth)
    .sort((a, b) => new Date(b.hire_date).getTime() - new Date(a.hire_date).getTime())
    .slice(0, 5)

  return {
    totalEmployees,
    activeEmployees,
    onLeaveEmployees,
    pendingLeaveRequests,
    approvedLeaveThisMonth,
    documentExpiry,
    newHiresThisMonth,
    attendanceToday,
    attendanceRate,
    absentEmployees,
    recentEmployees,
    recentHires,
    pendingLeaveList,
    approvedLeaveList,
    leaveBalanceSummary,
    departmentStats,
  }
}

function getEmptyHRStats() {
  return {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveEmployees: 0,
    pendingLeaveRequests: 0,
    approvedLeaveThisMonth: 0,
    documentExpiry: {
      expiring30Days: 0,
      expiring60Days: 0,
      overdue: 0,
      valid: 0,
      expiringSoon: 0,
    },
    newHiresThisMonth: 0,
    attendanceToday: { present: 0, absent: 0, late: 0, onLeave: 0 },
    attendanceRate: 0,
    absentEmployees: [] as AbsentEmployee[],
    recentEmployees: [] as Employee[],
    recentHires: [] as Employee[],
    pendingLeaveList: [] as LeaveRequest[],
    approvedLeaveList: [] as ApprovedLeave[],
    leaveBalanceSummary: [] as LeaveBalance[],
    departmentStats: [] as { department: string; count: number }[],
  }
}

export default async function HRPage() {
  const stats = await getHRStats()

  const quickLinks = [
    { name: 'Employees', href: '/hr/employees', icon: UserGroupIcon, color: 'bg-blue-500', description: 'Manage employee records' },
    { name: 'Leave Management', href: '/hr/leave', icon: CalendarDaysIcon, color: 'bg-green-500', description: 'Handle leave requests' },
    { name: 'Attendance', href: '/hr/attendance', icon: ClockIcon, color: 'bg-purple-500', description: 'Track attendance' },
    { name: 'Documents', href: '/hr/documents', icon: DocumentTextIcon, color: 'bg-orange-500', description: 'Employee documents' },
  ]

  return (
    <RoleGuard allowedRoles={['super_admin', 'hr_manager', 'executive']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Overview of your workforce and HR activities
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/hr/employees/new">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Add Employee
                </button>
              </Link>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Employees</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalEmployees}</p>
                  <p className="text-blue-100 text-xs mt-2">
                    {stats.newHiresThisMonth} new this month
                  </p>
                </div>
                <div className="p-3 bg-blue-400/30 rounded-lg">
                  <UserGroupIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Employees</p>
                  <p className="text-4xl font-bold mt-2">{stats.activeEmployees}</p>
                  <p className="text-green-100 text-xs mt-2">
                    {stats.onLeaveEmployees} on leave
                  </p>
                </div>
                <div className="p-3 bg-green-400/30 rounded-lg">
                  <CheckCircleIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Pending Leave</p>
                  <p className="text-4xl font-bold mt-2">{stats.pendingLeaveRequests}</p>
                  <p className="text-amber-100 text-xs mt-2">
                    {stats.approvedLeaveThisMonth} approved this month
                  </p>
                </div>
                <div className="p-3 bg-amber-400/30 rounded-lg">
                  <CalendarDaysIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Document Alerts</p>
                  <p className="text-4xl font-bold mt-2">{stats.documentExpiry.overdue + stats.documentExpiry.expiringSoon}</p>
                  <p className="text-red-100 text-xs mt-2">
                    {stats.documentExpiry.overdue} overdue, {stats.documentExpiry.expiring30Days} expiring soon
                  </p>
                </div>
                <div className="p-3 bg-red-400/30 rounded-lg">
                  <ExclamationTriangleIcon className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Employee Overview Section */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Employee Overview</h2>
              <Link href="/hr/employees" className="text-sm text-indigo-600 hover:text-indigo-500">
                View all employees →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Department Breakdown</h3>
                {stats.departmentStats.length === 0 ? (
                  <p className="text-gray-400 text-sm">No department data available</p>
                ) : (
                  <div className="space-y-3">
                    {stats.departmentStats.map((dept, index) => {
                      const percentage = Math.round((dept.count / stats.totalEmployees) * 100)
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
                      return (
                        <div key={dept.department}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-700 font-medium">{dept.department}</span>
                            <span className="font-bold text-gray-900">{dept.count} employees</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${colors[index % colors.length]}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Hires</h3>
                {stats.recentHires.length === 0 ? (
                  <p className="text-gray-400 text-sm">No new hires this month</p>
                ) : (
                  <div className="space-y-2">
                    {stats.recentHires.map((employee) => (
                      <div key={employee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-xs">
                              {employee.first_name[0]}{employee.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {employee.first_name} {employee.last_name}
                            </p>
                            <p className="text-xs text-gray-500">{employee.department || 'Unassigned'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(employee.hire_date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Leave Management Section */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Leave Management</h2>
              <Link href="/hr/leave" className="text-sm text-indigo-600 hover:text-indigo-500">
                Manage leaves →
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Pending Requests</h3>
                {stats.pendingLeaveList.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <CheckCircleIcon className="h-8 w-8 text-green-400 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No pending leave requests</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.pendingLeaveList.map((leave) => (
                      <Link key={leave.id} href={`/hr/leave/${leave.id}/edit`}>
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {leave.employee?.first_name} {leave.employee?.last_name}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {leave.leave_type?.name || 'Leave'} • {leave.days_requested} day(s)
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-200 text-amber-800">
                              Pending
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Approved (Upcoming)</h3>
                {stats.approvedLeaveList.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <CalendarIcon className="h-8 w-8 text-gray-400 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">No upcoming approved leaves</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.approvedLeaveList.map((leave) => (
                      <div key={leave.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {leave.employee?.first_name} {leave.employee?.last_name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {leave.leave_type?.name || 'Leave'} • {leave.days_requested} day(s)
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-200 text-green-800">
                            Approved
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {stats.leaveBalanceSummary.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Leave Balance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.leaveBalanceSummary.map((balance) => (
                    <div key={balance.leave_type} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{balance.leave_type}</span>
                        <span className="text-sm text-gray-600">
                          {balance.remaining.toFixed(1)} / {balance.allocated.toFixed(1)} days
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${balance.allocated > 0 ? (balance.remaining / balance.allocated) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {balance.used.toFixed(1)} days used
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Document Management Section */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Document Management</h2>
              <Link href="/hr/documents" className="text-sm text-indigo-600 hover:text-indigo-500">
                Manage documents →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <span className="text-2xl font-bold text-red-600">{stats.documentExpiry.overdue}</span>
                </div>
                <p className="text-xs font-medium text-red-700">Overdue</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <ClockIcon className="h-5 w-5 text-amber-600" />
                  <span className="text-2xl font-bold text-amber-600">{stats.documentExpiry.expiring30Days}</span>
                </div>
                <p className="text-xs font-medium text-amber-700">Expiring in 30 days</p>
              </div>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <CalendarDaysIcon className="h-5 w-5 text-yellow-600" />
                  <span className="text-2xl font-bold text-yellow-600">{stats.documentExpiry.expiring60Days}</span>
                </div>
                <p className="text-xs font-medium text-yellow-700">Expiring in 60 days</p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">{stats.documentExpiry.valid}</span>
                </div>
                <p className="text-xs font-medium text-green-700">Valid</p>
              </div>
            </div>
            {(stats.documentExpiry.overdue > 0 || stats.documentExpiry.expiring30Days > 0) && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  <p className="text-sm font-medium text-red-700">
                    {stats.documentExpiry.overdue} document(s) need immediate renewal, {stats.documentExpiry.expiring30Days} expiring within 30 days
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Attendance Section */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Attendance</h2>
              <Link href="/hr/attendance" className="text-sm text-indigo-600 hover:text-indigo-500">
                View all logs →
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Today&apos;s Status</h3>
                  <div className="px-3 py-1 bg-indigo-100 rounded-full">
                    <span className="text-sm font-bold text-indigo-700">{stats.attendanceRate}%</span>
                    <span className="text-xs text-indigo-600 ml-1">Attendance Rate</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{stats.attendanceToday.present}</span>
                    </div>
                    <p className="text-xs font-medium text-green-700">Present</p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">{stats.attendanceToday.absent}</span>
                    </div>
                    <p className="text-xs font-medium text-red-700">Absent</p>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ClockIcon className="h-5 w-5 text-yellow-600" />
                      <span className="text-2xl font-bold text-yellow-600">{stats.attendanceToday.late}</span>
                    </div>
                    <p className="text-xs font-medium text-yellow-700">Late</p>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-600">{stats.attendanceToday.onLeave}</span>
                    </div>
                    <p className="text-xs font-medium text-blue-700">On Leave</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Absent Employees</h3>
                {stats.absentEmployees.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <CheckCircleIcon className="h-8 w-8 text-green-400 mx-auto" />
                    <p className="mt-2 text-sm text-gray-500">All employees are present today</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stats.absentEmployees.map((employee) => (
                      <div key={employee.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 font-medium text-xs">
                                {employee.first_name[0]}{employee.last_name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </p>
                              <p className="text-xs text-gray-500">{employee.department || 'Unassigned'}</p>
                            </div>
                          </div>
                          <XCircleIcon className="h-5 w-5 text-red-500" />
                        </div>
                      </div>
                    ))}
                    {stats.absentEmployees.length >= 10 && (
                      <Link href="/hr/attendance">
                        <p className="text-sm text-indigo-600 hover:text-indigo-500 text-center mt-2">
                          View all absent employees →
                        </p>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Recruitment Section */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recruitment</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BriefcaseIcon className="h-5 w-5 text-indigo-600" />
                  <span className="text-lg font-bold text-indigo-600">0</span>
                </div>
                <p className="text-sm font-medium text-indigo-700">Open Positions</p>
                <p className="text-xs text-indigo-600 mt-1">Note: Recruitment module coming soon</p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-purple-600" />
                  <span className="text-lg font-bold text-purple-600">0</span>
                </div>
                <p className="text-sm font-medium text-purple-700">Pending Applications</p>
                <p className="text-xs text-purple-600 mt-1">Note: Recruitment module coming soon</p>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <UserPlusIcon className="h-5 w-5 text-green-600" />
                  <span className="text-lg font-bold text-green-600">{stats.recentHires.length}</span>
                </div>
                <p className="text-sm font-medium text-green-700">Recent Hires (This Month)</p>
                <p className="text-xs text-green-600 mt-1">New employees added this month</p>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Link href="/hr/employees/new">
                <div className="p-4 bg-white border-2 border-indigo-200 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-indigo-100 rounded-lg mb-3 group-hover:bg-indigo-200 transition-colors">
                      <UserPlusIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600">Create Employee</p>
                  </div>
                </div>
              </Link>
              <Link href="/hr/leave">
                <div className="p-4 bg-white border-2 border-green-200 rounded-lg hover:border-green-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-green-100 rounded-lg mb-3 group-hover:bg-green-200 transition-colors">
                      <CalendarDaysIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-green-600">Approve Leave</p>
                  </div>
                </div>
              </Link>
              <Link href="/hr/employees">
                <div className="p-4 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-blue-100 rounded-lg mb-3 group-hover:bg-blue-200 transition-colors">
                      <UserGroupIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">View Employees</p>
                  </div>
                </div>
              </Link>
              <Link href="/hr/documents">
                <div className="p-4 bg-white border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-orange-100 rounded-lg mb-3 group-hover:bg-orange-200 transition-colors">
                      <DocumentTextIcon className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-600">Manage Documents</p>
                  </div>
                </div>
              </Link>
              <Link href="/hr/attendance">
                <div className="p-4 bg-white border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 bg-purple-100 rounded-lg mb-3 group-hover:bg-purple-200 transition-colors">
                      <ClockIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-600">View Attendance</p>
                  </div>
                </div>
              </Link>
            </div>
          </Card>


          {/* Recent Employees */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Employees</h3>
              <Link href="/hr/employees" className="text-sm text-indigo-600 hover:text-indigo-500">
                View all →
              </Link>
            </div>
            {stats.recentEmployees.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-gray-500">No employees yet</p>
                <Link href="/hr/employees/new">
                  <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Add First Employee
                  </button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentEmployees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {employee.first_name[0]}{employee.last_name[0]}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {employee.first_name} {employee.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{employee.employee_number}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.department || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.position || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(employee.hire_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            employee.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : employee.status === 'on_leave'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {employee.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </RoleGuard>
  )
}
