import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import {
  getCurrentAgentProfile,
  getAgentDashboardStats,
  getAgentCommissions,
  getAgentClients,
  getAgentRecentActivities,
} from '@/app/actions/agents'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  UserIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  CalendarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

export default async function AgentDashboardPage() {
  // Get current agent profile
  const profileResult = await getCurrentAgentProfile()

  if (!profileResult.success || !profileResult.data) {
    return (
      <RoleGuard allowedRoles={['agent']}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500">No agent profile found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Please contact your administrator to set up your agent profile.
            </p>
          </div>
        </div>
      </RoleGuard>
    )
  }

  const agent = profileResult.data

  // Get dashboard data
  const [statsResult, commissionsResult, clientsResult, activitiesResult] = await Promise.all([
    getAgentDashboardStats(agent.id),
    getAgentCommissions(agent.id, 5),
    getAgentClients(agent.id),
    getAgentRecentActivities(agent.id, 10),
  ])

  const stats = statsResult.data
  const commissions = commissionsResult.data || []
  const clients = clientsResult.data || []
  const activities = activitiesResult.data || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
  }

  return (
    <RoleGuard allowedRoles={['agent']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {agent.first_name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of your performance and activities
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Total Commission */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Commission</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalCommission)}</p>
              </div>
              <div className="p-3 bg-green-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Monthly Commission */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">This Month</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.monthlyCommission)}</p>
              </div>
              <div className="p-3 bg-blue-400/30 rounded-lg">
                <CalendarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Total Sales */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold mt-2">{stats.totalSales}</p>
              </div>
              <div className="p-3 bg-purple-400/30 rounded-lg">
                <ChartBarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Average Deal Size */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Avg Deal Size</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.averageDealSize)}</p>
              </div>
              <div className="p-3 bg-indigo-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Active Clients */}
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium">Active Clients</p>
                <p className="text-3xl font-bold mt-2">{stats.totalClients}</p>
              </div>
              <div className="p-3 bg-pink-400/30 rounded-lg">
                <UserGroupIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Active Deals */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Active Deals</p>
                <p className="text-3xl font-bold mt-2">{stats.activeDeals}</p>
              </div>
              <div className="p-3 bg-orange-400/30 rounded-lg">
                <ClockIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Commissions */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Commissions</h3>
              <Link href={`/agents/${agent.id}/commissions`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {commissions.length === 0 ? (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No commissions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {commissions.map((commission: any) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {commission.deal_description || 'Commission'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(commission.created_at)}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(commission.commission_amount)}
                      </p>
                      <span
                        className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          statusColors[commission.status] || statusColors.pending
                        }`}
                      >
                        {commission.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Clients */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Active Clients</h3>
              <Link href={`/agents/${agent.id}/clients`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {clients.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No clients assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clients.slice(0, 5).map((client: any) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center flex-1">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {client.client_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {client.client_email || client.client_phone}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        statusColors[client.status] || statusColors.active
                      }`}
                    >
                      {client.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>

          {activities.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No recent activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <ClockIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.activity_type?.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(activity.activity_date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href={`/agents/${agent.id}`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <UserIcon className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </Link>
            <Link href={`/agents/${agent.id}/commissions`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                View Commissions
              </Button>
            </Link>
            <Link href={`/agents/${agent.id}/clients`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                View Clients
              </Button>
            </Link>
            <Link href={`/agents/${agent.id}/properties`} className="block">
              <Button variant="outline" className="w-full justify-start">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                View Properties
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </RoleGuard>
  )
}
