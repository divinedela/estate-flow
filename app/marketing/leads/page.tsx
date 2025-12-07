import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'

export default function LeadsPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track your sales pipeline
              </p>
            </div>
            <Link href="/marketing/leads/new">
              <Button>Add Lead</Button>
            </Link>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button variant="secondary" className="whitespace-nowrap">All (0)</Button>
            <Button variant="secondary" className="whitespace-nowrap">New (0)</Button>
            <Button variant="secondary" className="whitespace-nowrap">Contacted (0)</Button>
            <Button variant="secondary" className="whitespace-nowrap">Hot (0)</Button>
            <Button variant="secondary" className="whitespace-nowrap">Warm (0)</Button>
            <Button variant="secondary" className="whitespace-nowrap">Cold (0)</Button>
            <Button variant="secondary" className="whitespace-nowrap">Converted (0)</Button>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search leads..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="converted">Converted</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Source</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Next Follow-up</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No leads found. <Link href="/marketing/leads/new" className="text-indigo-600 hover:text-indigo-500">Add your first lead</Link>
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



