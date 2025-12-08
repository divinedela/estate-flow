import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { RoleGuard } from '@/components/auth/role-guard'

export default function TasksPage() {
  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'project_manager', 'site_engineer']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Tasks</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track project tasks
            </p>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Projects</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Task</TableHeader>
                  <TableHeader>Project</TableHeader>
                  <TableHeader>Assigned To</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Due Date</TableHeader>
                  <TableHeader>Progress</TableHeader>
                  <TableHeader>Status</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No tasks found
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



