import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { RoleGuard } from '@/components/auth/role-guard'

export default function DocumentsPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'hr_manager']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Documents</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage employee documents and track expiries
            </p>
          </div>

          <Card>
            <div className="mb-4">
              <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Employees</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Employee</TableHeader>
                  <TableHeader>Document Type</TableHeader>
                  <TableHeader>Title</TableHeader>
                  <TableHeader>Issued Date</TableHeader>
                  <TableHeader>Expiry Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No documents found
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

