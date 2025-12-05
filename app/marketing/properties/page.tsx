import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'

export default function PropertiesPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer', 'project_manager']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage property listings and units
              </p>
            </div>
            <Link href="/marketing/properties/new">
              <Button>Add Property</Button>
            </Link>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search properties..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="office">Office</option>
                <option value="shop">Shop</option>
                <option value="land">Land</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Property Code</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Price</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No properties found. <Link href="/marketing/properties/new" className="text-indigo-600 hover:text-indigo-500">Add your first property</Link>
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

