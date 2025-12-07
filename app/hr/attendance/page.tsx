import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { RoleGuard } from '@/components/auth/role-guard'

export default function AttendancePage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'hr_manager', 'project_manager']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage employee attendance records
            </p>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="date"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Employee</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Check In</TableHeader>
                  <TableHeader>Check Out</TableHeader>
                  <TableHeader>Hours</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No attendance records found
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



