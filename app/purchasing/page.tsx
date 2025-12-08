import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'

export default function PurchasingPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'procurement_officer', 'executive']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Purchasing / Procurement</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage purchase requisitions, orders, and suppliers
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/purchasing/pr/new">
                <Button variant="secondary">New PR</Button>
              </Link>
              <Link href="/purchasing/po/new">
                <Button>New PO</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Pending PRs</p>
                <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Open POs</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Pending GRNs</p>
                <p className="mt-2 text-3xl font-semibold text-orange-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Suppliers</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Purchase Requisitions">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>PR #</TableHeader>
                    <TableHeader>Requested By</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No purchase requisitions found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>

            <Card title="Purchase Orders">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>PO #</TableHeader>
                    <TableHeader>Supplier</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}



