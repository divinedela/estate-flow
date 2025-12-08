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

async function getHRStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      onLeaveEmployees: 0,
      pendingLeaveRequests: 0,
      approvedLeaveThisMonth: 0,
      expiringDocuments: 0,
      expiredDocuments: 0,
      newHiresThisMonth: 0,
      attendanceToday: { present: 0, absent: 0, late: 0, onLeave: 0 },
      recentEmployees: [] as Employee[],
      pendingLeaveList: [] as LeaveRequest[],
      departmentStats: [] as { department: string; count: number }[],
    }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      onLeaveEmployees: 0,
      pendingLeaveRequests: 0,
      approvedLeaveThisMonth: 0,
      expiringDocuments: 0,
      expiredDocuments: 0,
      newHiresThisMonth: 0,
      attendanceToday: { present: 0, absent: 0, late: 0, onLeave: 0 },
      recentEmployees: [] as Employee[],
      pendingLeaveList: [] as LeaveRequest[],
      departmentStats: [] as { department: string; count: number }[],
    }
  }

  const orgId = profile.organization_id
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

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

  // Documents
  let expiringDocuments = 0
  let expiredDocuments = 0

  if (employeeIds.length > 0) {
    const { count: expiringCount } = await supabase
      .from('employee_documents')
      .select('*', { count: 'exact', head: true })
      .in('employee_id', employeeIds)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .gte('expiry_date', today)

    expiringDocuments = expiringCount || 0

    const { count: expiredCount } = await supabase
      .from('employee_documents')
      .select('*', { count: 'exact', head: true })
      .in('employee_id', employeeIds)
      .not('expiry_date', 'is', null)
      .lt('expiry_date', today)

    expiredDocuments = expiredCount || 0
  }

  // Today's attendance
  let attendanceToday: AttendanceToday = { present: 0, absent: 0, late: 0, onLeave: 0 }

  if (employeeIds.length > 0) {
    const { data: todayAttendance } = await supabase
      .from('attendance_logs')
      .select('status')
      .eq('date', today)
      .in('employee_id', employeeIds)

    if (todayAttendance) {
      attendanceToday = {
        present: todayAttendance.filter(a => a.status === 'present').length,
        absent: todayAttendance.filter(a => a.status === 'absent').length,
        late: todayAttendance.filter(a => a.status === 'late').length,
        onLeave: todayAttendance.filter(a => a.status === 'on_leave').length,
      }
    }
  }

  return {
    totalEmployees,
    activeEmployees,
    onLeaveEmployees,
    pendingLeaveRequests,
    approvedLeaveThisMonth,
    expiringDocuments,
    expiredDocuments,
    newHiresThisMonth,
    attendanceToday,
    recentEmployees,
    pendingLeaveList,
    departmentStats,
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
                  <p className="text-4xl font-bold mt-2">{stats.expiringDocuments + stats.expiredDocuments}</p>
                  <p className="text-red-100 text-xs mt-2">
                    {stats.expiredDocuments} expired, {stats.expiringDocuments} expiring
                  </p>
                </div>
                <div className="p-3 bg-red-400/30 rounded-lg">
                  <ExclamationTriangleIcon className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${link.color}`}>
                      <link.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {link.name}
                      </h3>
                      <p className="text-sm text-gray-500">{link.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Today's Attendance */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Attendance</h3>
                <Link href="/hr/attendance" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-gray-700">Present</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{stats.attendanceToday.present}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="text-gray-700">Absent</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{stats.attendanceToday.absent}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <ClockIcon className="h-5 w-5 text-yellow-600" />
                    </div>
                    <span className="text-gray-700">Late</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{stats.attendanceToday.late}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <CalendarDaysIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-gray-700">On Leave</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.attendanceToday.onLeave}</span>
                </div>
              </div>
            </Card>

            {/* Pending Leave Requests */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending Leave Requests</h3>
                <Link href="/hr/leave" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              {stats.pendingLeaveList.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.pendingLeaveList.map((leave) => (
                    <div key={leave.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {leave.employee?.first_name} {leave.employee?.last_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {leave.leave_type?.name || 'Leave'} • {leave.days_requested} day(s)
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(leave.start_date).toLocaleDateString()} - {new Date(leave.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Department Distribution */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">By Department</h3>
                <Link href="/hr/employees" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              {stats.departmentStats.length === 0 ? (
                <div className="text-center py-8">
                  <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No department data</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.departmentStats.map((dept, index) => {
                    const percentage = Math.round((dept.count / stats.totalEmployees) * 100)
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
                    return (
                      <div key={dept.department}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700">{dept.department}</span>
                          <span className="font-medium text-gray-900">{dept.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

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
