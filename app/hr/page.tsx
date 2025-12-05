import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HRPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'hr_manager', 'executive']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HR Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage employees, leave, attendance, and documents
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Active Employees</p>
                <p className="mt-2 text-3xl font-semibold text-green-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Pending Leave Requests</p>
                <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Expiring Documents</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">0</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Quick Actions">
              <div className="space-y-3">
                <Link href="/hr/employees">
                  <Button className="w-full">Manage Employees</Button>
                </Link>
                <Link href="/hr/leave">
                  <Button className="w-full" variant="secondary">Leave Management</Button>
                </Link>
                <Link href="/hr/attendance">
                  <Button className="w-full" variant="secondary">Attendance</Button>
                </Link>
                <Link href="/hr/documents">
                  <Button className="w-full" variant="secondary">Documents</Button>
                </Link>
              </div>
            </Card>

            <Card title="Recent Activity">
              <p className="text-gray-500">No recent activity to display</p>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}

