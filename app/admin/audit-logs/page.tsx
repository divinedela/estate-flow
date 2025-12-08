import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

async function getAuditLogs() {
  // This would fetch audit logs from the database
  // For now, returning empty array
  return []
}

export default async function AuditLogsPage() {
  const logs = await getAuditLogs()

  return (
    <RoleGuard allowedRoles={['super_admin']}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin">
              <Button variant="secondary" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="mt-1 text-sm text-gray-500">
                View system activity and user actions
              </p>
            </div>
          </div>

          <Card>
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>User</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Entity</TableHeader>
                  <TableHeader>Details</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      <TableCell>{log.actor_user_id || 'System'}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.entity_type}</TableCell>
                      <TableCell>{JSON.stringify(log.metadata)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </RoleGuard>
  )
}



