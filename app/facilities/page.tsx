import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'

export default function FacilitiesPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'facility_manager', 'executive']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facility Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage facilities, units, assets, and maintenance
              </p>
            </div>
            <Link href="/facilities/maintenance/new">
              <Button>New Maintenance Request</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Facilities</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Open Requests</p>
                <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">In Progress</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">0</p>
              </div>
            </Card>
          </div>

          <Card title="Recent Maintenance Requests">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Request #</TableHeader>
                  <TableHeader>Title</TableHeader>
                  <TableHeader>Facility</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Requested Date</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No maintenance requests found
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



