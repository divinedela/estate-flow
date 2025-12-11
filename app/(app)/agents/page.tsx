import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { getAgents, getAgentStats } from '@/app/actions/agents'
import Link from 'next/link'
import {
  UserGroupIcon,
  PlusIcon,
  UserIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline'

export default async function AgentsPage() {
  const [agentsResult, statsResult] = await Promise.all([
    getAgents(),
    getAgentStats(),
  ])

  const agents = agentsResult.data || []
  const stats = statsResult.data

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800',
    terminated: 'bg-red-100 text-red-800',
  }

  const levelColors: Record<string, string> = {
    junior: 'bg-blue-100 text-blue-800',
    senior: 'bg-indigo-100 text-indigo-800',
    team_lead: 'bg-purple-100 text-purple-800',
    manager: 'bg-pink-100 text-pink-800',
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'agent_manager', 'executive']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage real estate agents and track performance
            </p>
          </div>
          <Link href="/agents/new">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Agent
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Agents</p>
                <p className="text-3xl font-bold mt-2">{stats.totalAgents}</p>
                <p className="text-blue-100 text-xs mt-1">
                  {stats.activeAgents} active
                </p>
              </div>
              <div className="p-3 bg-blue-400/30 rounded-lg">
                <UserGroupIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Agents</p>
                <p className="text-3xl font-bold mt-2">{stats.activeAgents}</p>
                <p className="text-green-100 text-xs mt-1">
                  {stats.onLeaveAgents} on leave
                </p>
              </div>
              <div className="p-3 bg-green-400/30 rounded-lg">
                <UserIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold mt-2">{stats.totalSales}</p>
                <p className="text-purple-100 text-xs mt-1">
                  All time
                </p>
              </div>
              <div className="p-3 bg-purple-400/30 rounded-lg">
                <ChartBarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Total Commission</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalCommission)}</p>
                <p className="text-indigo-100 text-xs mt-1">
                  Earned
                </p>
              </div>
              <div className="p-3 bg-indigo-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Agents Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Agent</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Level</TableHeader>
                  <TableHeader>License</TableHeader>
                  <TableHeader>Commission Rate</TableHeader>
                  <TableHeader>Sales</TableHeader>
                  <TableHeader>Commission Earned</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No agents</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by adding your first agent.</p>
                      <div className="mt-6">
                        <Link href="/agents/new">
                          <Button className="inline-flex items-center">
                            <PlusIcon className="h-5 w-5 mr-2" />
                            Add Agent
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent: any) => (
                    <TableRow key={agent.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-800">
                                {agent.first_name?.[0]}{agent.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {agent.first_name} {agent.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{agent.email}</div>
                            <div className="text-xs text-gray-400">{agent.agent_code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[agent.employment_status] || statusColors.inactive}`}>
                          {agent.employment_status?.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${levelColors[agent.agent_level] || levelColors.junior}`}>
                          {agent.agent_level?.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {agent.license_number || 'N/A'}
                        {agent.license_expiry_date && (
                          <div className="text-xs text-gray-400">
                            Exp: {new Date(agent.license_expiry_date).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {agent.commission_rate}%
                      </TableCell>
                      <TableCell className="text-sm text-gray-900">
                        {agent.total_sales_count || 0}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatCurrency(agent.total_commission_earned || 0)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <Link href={`/agents/${agent.id}`} className="text-indigo-600 hover:text-indigo-900">
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </RoleGuard>
  )
}
