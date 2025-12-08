import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

async function getEmployees() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) return []

  // Fetch employees in the same organization
  const { data: employees, error } = await supabase
    .from('employees')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching employees:', error)
    return []
  }

  return employees || []
}

export default async function EmployeesPage() {
  const employees = await getEmployees()

  return (
    <RoleGuard allowedRoles={['super_admin', 'hr_manager']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/hr" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <Link href="/hr" className="text-sm text-indigo-600 hover:text-indigo-500">HR</Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm text-gray-500">Employees</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
              </div>
            </div>
            <Link href="/hr/employees/new">
              <Button>Add Employee</Button>
            </Link>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search employees..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Departments</option>
                <option value="construction">Construction</option>
                <option value="sales">Sales</option>
                <option value="admin">Administration</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Employee #</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Position</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No employees found. <Link href="/hr/employees/new" className="text-indigo-600 hover:text-indigo-500">Add your first employee</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => {
                    const statusColors: Record<string, string> = {
                      active: 'bg-green-100 text-green-800',
                      inactive: 'bg-gray-100 text-gray-800',
                      terminated: 'bg-red-100 text-red-800',
                      on_leave: 'bg-yellow-100 text-yellow-800',
                    }
                    
                    return (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.employee_number || 'N/A'}</TableCell>
                        <TableCell>{employee.first_name} {employee.last_name}</TableCell>
                        <TableCell>{employee.department || 'N/A'}</TableCell>
                        <TableCell>{employee.position || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[employee.status || 'active'] || statusColors.active}`}>
                            {employee.status || 'active'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Link href={`/hr/employees/${employee.id}`} className="text-indigo-600 hover:text-indigo-500 text-sm">
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </RoleGuard>
  )
}



