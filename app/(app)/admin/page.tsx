import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['super_admin', 'hr_manager']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage system settings, users, roles, and organizations
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Organization">
              <div className="space-y-3">
                <Link href="/admin/organizations">
                  <Button className="w-full" variant="secondary">Manage Organizations</Button>
                </Link>
                <Link href="/admin/settings">
                  <Button className="w-full" variant="secondary">System Settings</Button>
                </Link>
              </div>
            </Card>

            <Card title="Users & Roles">
              <div className="space-y-3">
                <Link href="/admin/users">
                  <Button className="w-full" variant="secondary">Manage Users</Button>
                </Link>
                <Link href="/admin/roles">
                  <Button className="w-full" variant="secondary">Manage Roles</Button>
                </Link>
              </div>
            </Card>

            <Card title="Audit & Logs">
              <div className="space-y-3">
                <Link href="/admin/audit-logs">
                  <Button className="w-full" variant="secondary">View Audit Logs</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </RoleGuard>
  )
}



