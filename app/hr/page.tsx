import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getHRStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      pendingLeaveRequests: 0,
      expiringDocuments: 0,
    }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      totalEmployees: 0,
      activeEmployees: 0,
      pendingLeaveRequests: 0,
      expiringDocuments: 0,
    }
  }

  const orgId = profile.organization_id

  // Fetch total employees count
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Fetch active employees count
  const { count: activeEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  // Fetch employee IDs first
  const { data: employees } = await supabase
    .from('employees')
    .select('id')
    .eq('organization_id', orgId)

  const employeeIds = employees?.map(e => e.id) || []
  
  // Fetch pending leave requests count
  const { count: pendingLeave } = employeeIds.length > 0
    ? await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('employee_id', employeeIds)
    : { count: 0 }

  // Fetch expiring documents (within next 30 days)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  const { count: expiringDocuments } = employeeIds.length > 0
    ? await supabase
        .from('employee_documents')
        .select('*', { count: 'exact', head: true })
        .in('employee_id', employeeIds)
        .not('expiry_date', 'is', null)
        .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0])
        .gte('expiry_date', new Date().toISOString().split('T')[0])
    : { count: 0 }

  return {
    totalEmployees: totalEmployees || 0,
    activeEmployees: activeEmployees || 0,
    pendingLeaveRequests: pendingLeave || 0,
    expiringDocuments: expiringDocuments || 0,
  }
}

export default async function HRPage() {
  const stats = await getHRStats()

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
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Active Employees</p>
                <p className="mt-2 text-3xl font-semibold text-green-600">{stats.activeEmployees}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Pending Leave Requests</p>
                <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.pendingLeaveRequests}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Expiring Documents</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">{stats.expiringDocuments}</p>
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



