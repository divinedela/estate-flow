import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'

export default function LeavePage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'hr_manager']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage employee leave requests and balances
              </p>
            </div>
            <Link href="/hr/leave/request">
              <Button>Request Leave</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Approved This Month</p>
                <p className="mt-2 text-3xl font-semibold text-green-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">On Leave Today</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
              </div>
            </Card>
          </div>

          <Card title="Leave Requests">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Employee</TableHeader>
                  <TableHeader>Leave Type</TableHeader>
                  <TableHeader>Start Date</TableHeader>
                  <TableHeader>End Date</TableHeader>
                  <TableHeader>Days</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No leave requests found
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}

