import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { getMyLeaveBalances, getMyLeaveRequests } from '@/app/actions/employee'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function MyLeavePage() {
  const [balancesResult, requestsResult] = await Promise.all([
    getMyLeaveBalances(),
    getMyLeaveRequests(),
  ])

  const balances = balancesResult.success ? balancesResult.data : []
  const requests = requestsResult.success ? requestsResult.data : []

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  const statusIcons: Record<string, any> = {
    pending: ClockIcon,
    approved: CheckCircleIcon,
    rejected: XCircleIcon,
    cancelled: XCircleIcon,
  }

  return (
    <RoleGuard allowedRoles={['employee']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/employee">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">My Leave</h1>
              <p className="text-muted-foreground">Manage your leave requests and view balances</p>
            </div>
          </div>
          <Link href="/employee/leave/request">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </Link>
        </div>

        {/* Leave Balances */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Leave Balances (Current Year)</h2>
          {balances.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No leave balances found. Please contact HR.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {balances.map((balance: any) => (
                <Card key={balance.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{balance.leave_type?.name || 'Leave'}</CardTitle>
                    <CardDescription className="text-xs">
                      {balance.leave_type?.code || ''} {balance.leave_type?.is_paid && '• Paid'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Allocated:</span>
                        <span className="font-semibold">{balance.allocated_days || 0} days</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Used:</span>
                        <span className="font-semibold text-red-600">
                          {balance.used_days || 0} days
                        </span>
                      </div>
                      {balance.pending_days > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pending:</span>
                          <span className="font-semibold text-yellow-600">
                            {balance.pending_days} days
                          </span>
                        </div>
                      )}
                      {balance.carried_forward_days > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Carried Forward:</span>
                          <span className="font-semibold text-blue-600">
                            {balance.carried_forward_days} days
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">Remaining:</span>
                          <span className="text-xl font-bold text-green-600">
                            {(balance.allocated_days || 0) +
                              (balance.carried_forward_days || 0) -
                              (balance.used_days || 0) -
                              (balance.pending_days || 0)}{' '}
                            days
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Leave Requests History */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Request History</CardTitle>
            <CardDescription>Your submitted leave requests and their statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-8">
                <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-gray-500">No leave requests yet</p>
                <Link href="/employee/leave/request">
                  <Button className="mt-4">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Submit Your First Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request: any) => {
                  const StatusIcon = statusIcons[request.status] || ClockIcon

                  return (
                    <div
                      key={request.id}
                      className="flex items-start justify-between p-4 rounded-lg border hover:bg-gray-50"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          <StatusIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {request.leave_type?.name || 'Leave'}
                            </h3>
                            <Badge
                              className={`${
                                statusColors[request.status] || 'bg-gray-100 text-gray-800'
                              } capitalize`}
                            >
                              {request.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              <strong>Duration:</strong>{' '}
                              {format(new Date(request.start_date), 'MMM d, yyyy')} -{' '}
                              {format(new Date(request.end_date), 'MMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>Days:</strong> {request.days_requested}
                            </p>
                            {request.reason && (
                              <p className="text-sm text-gray-600">
                                <strong>Reason:</strong> {request.reason}
                              </p>
                            )}
                            {request.status === 'approved' && request.approver && (
                              <p className="text-xs text-green-600">
                                Approved by {request.approver.full_name} on{' '}
                                {format(new Date(request.approved_at), 'MMM d, yyyy')}
                              </p>
                            )}
                            {request.status === 'rejected' && (
                              <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                <p className="text-xs text-red-800">
                                  <strong>Rejection Reason:</strong>{' '}
                                  {request.rejection_reason || 'No reason provided'}
                                </p>
                                {request.approver && (
                                  <p className="text-xs text-red-600 mt-1">
                                    Rejected by {request.approver.full_name} on{' '}
                                    {format(new Date(request.approved_at), 'MMM d, yyyy')}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xs text-gray-400">
                          Submitted {format(new Date(request.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
