import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'

export default function InventoryPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'inventory_officer', 'project_manager', 'executive']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage stock levels, items, and transactions
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/inventory/items/new">
                <Button variant="secondary">Add Item</Button>
              </Link>
              <Link href="/inventory/transactions/new">
                <Button>New Transaction</Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Items</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Locations</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Transactions Today</p>
                <p className="mt-2 text-3xl font-semibold text-green-600">0</p>
              </div>
            </Card>
          </div>

          <Card title="Low Stock Alerts">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Item</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Current Stock</TableHeader>
                  <TableHeader>Reorder Point</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    No low stock alerts
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Card title="Recent Transactions">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Item</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Quantity</TableHeader>
                  <TableHeader>User</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No transactions found
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



