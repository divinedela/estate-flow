import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'
import {
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  BellAlertIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'
import {
  getEmployeeDashboardStats,
  getMyEmployeeProfile,
  getMyLeaveRequests,
  getTodayAttendance,
  getMyDocuments,
} from '@/app/actions/employee'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function EmployeeDashboardPage() {
  const [statsResult, profileResult, leaveRequestsResult, todayAttendanceResult, documentsResult] =
    await Promise.all([
      getEmployeeDashboardStats(),
      getMyEmployeeProfile(),
      getMyLeaveRequests(5),
      getTodayAttendance(),
      getMyDocuments(),
    ])

  const stats = statsResult.success ? statsResult.data : null
  const profile = profileResult.success ? profileResult.data : null
  const leaveRequests = leaveRequestsResult.success ? leaveRequestsResult.data : []
  const todayAttendance = todayAttendanceResult.success ? todayAttendanceResult.data : null
  const documents = documentsResult.success ? documentsResult.data : null

  const quickActions = [
    {
      name: 'Request Leave',
      href: '/employee/leave/request',
      icon: CalendarDaysIcon,
      color: 'bg-blue-500',
      description: 'Submit new leave request',
    },
    {
      name: 'View Profile',
      href: '/employee/profile',
      icon: UserIcon,
      color: 'bg-green-500',
      description: 'View my details',
    },
    {
      name: 'My Documents',
      href: '/employee/documents',
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
      description: 'Access documents',
    },
    {
      name: 'Attendance',
      href: '/employee/attendance',
      icon: ClockIcon,
      color: 'bg-orange-500',
      description: 'View attendance',
    },
  ]

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
    cancelled: 'bg-gray-500',
  }

  const attendanceStatusColors: Record<string, string> = {
    present: 'text-green-600',
    absent: 'text-red-600',
    late: 'text-yellow-600',
    half_day: 'text-orange-600',
    on_leave: 'text-blue-600',
  }

  return (
    <RoleGuard allowedRoles={['employee']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.first_name || 'Employee'}!
          </h1>
          <p className="text-gray-600 mt-1">
            {profile?.position || 'Position'} • {profile?.department || 'Department'}
          </p>
        </div>

        {/* Alert Banners */}
        {documents && documents.expiringCount > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">Document Expiry Alert</p>
                  <p className="text-sm text-orange-700">
                    You have {documents.expiringCount} document(s) expiring within 30 days.{' '}
                    <Link
                      href="/employee/documents"
                      className="underline font-medium hover:text-orange-900"
                    >
                      View documents
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Leave Balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4" />
                Leave Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.leave.remaining || 0}
                <span className="text-base font-normal text-muted-foreground ml-2">days</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.leave.totalUsed || 0} used of {stats?.leave.totalAllocated || 0} allocated
              </p>
              {stats && stats.leave.pendingRequests > 0 && (
                <p className="text-xs text-yellow-600 mt-1">
                  {stats.leave.pendingRequests} pending request(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Attendance This Month */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ClockIcon className="h-4 w-4" />
                Attendance This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats?.attendance.presentDays || 0}
                <span className="text-base font-normal text-muted-foreground ml-2">days</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats?.attendance.absentDays || 0} absent • {stats?.attendance.totalDays || 0}{' '}
                total
              </p>
            </CardContent>
          </Card>

          {/* Today's Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Today's Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayAttendance ? (
                <>
                  <div
                    className={`text-2xl font-bold capitalize ${
                      attendanceStatusColors[todayAttendance.status] || 'text-gray-600'
                    }`}
                  >
                    {todayAttendance.status.replace('_', ' ')}
                  </div>
                  {todayAttendance.check_in_time && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Check-in: {new Date(todayAttendance.check_in_time).toLocaleTimeString()}
                    </p>
                  )}
                  {todayAttendance.hours_worked && (
                    <p className="text-xs text-muted-foreground">
                      Hours: {todayAttendance.hours_worked}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-2xl font-bold text-gray-400">Not Recorded</div>
              )}
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                My Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {documents?.documents.length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Total documents</p>
              {documents && documents.expiringCount > 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  {documents.expiringCount} expiring soon
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-indigo-300">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{action.name}</h3>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Leave Requests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Leave Requests</CardTitle>
                <CardDescription>Your latest leave applications</CardDescription>
              </div>
              <Link href="/employee/leave">
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View all
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-gray-500">No leave requests yet</p>
                <Link href="/employee/leave/request">
                  <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    Request Leave
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {leaveRequests.map((request: any) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {request.leave_type?.name || 'Leave'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(request.start_date).toLocaleDateString()} -{' '}
                          {new Date(request.end_date).toLocaleDateString()} ({request.days_requested}{' '}
                          days)
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${
                          statusColors[request.status] || 'bg-gray-500'
                        }`}
                      >
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Documents Alert */}
        {documents && documents.expiringDocs.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BellAlertIcon className="h-5 w-5 text-orange-600" />
                <CardTitle>Documents Expiring Soon</CardTitle>
              </div>
              <CardDescription>Please renew these documents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.expiringDocs.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50">
                    <div>
                      <p className="font-medium text-gray-900">{doc.title}</p>
                      <p className="text-sm text-gray-600 capitalize">{doc.document_type.replace('_', ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">
                        Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-orange-500">
                        {formatDistanceToNow(new Date(doc.expiry_date), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGuard>
  )
}
