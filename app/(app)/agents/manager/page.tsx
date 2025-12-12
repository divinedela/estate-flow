import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import {
  getTeamPerformanceStats,
  getTeamLeaderboard,
  getPendingCommissions,
  getAgents,
} from "@/app/actions/agents";
import Link from "next/link";
import {
  UserGroupIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  TrophyIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

export default async function AgentManagerDashboardPage() {
  // Get dashboard data
  const [statsResult, leaderboardResult, pendingResult, agentsResult] =
    await Promise.all([
      getTeamPerformanceStats(),
      getTeamLeaderboard(10),
      getPendingCommissions(10),
      getAgents(),
    ]);

  const stats = statsResult.data;
  const leaderboard = leaderboardResult.data || [];
  const pendingCommissions = pendingResult.data || [];
  const allAgents = agentsResult.data || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const levelColors: Record<string, string> = {
    junior: "bg-blue-100 text-blue-800",
    senior: "bg-indigo-100 text-indigo-800",
    team_lead: "bg-purple-100 text-purple-800",
    manager: "bg-pink-100 text-pink-800",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <RoleGuard allowedRoles={["agent_manager", "super_admin", "executive"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Team Management Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of your team's performance and activities
            </p>
          </div>
          <Link href="/agents/new">
            <Button>
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Add Agent
            </Button>
          </Link>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Team Members */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Team Members
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.totalTeamMembers}
                </p>
                <p className="text-blue-100 text-xs mt-1">
                  {stats.activeAgents} active
                </p>
              </div>
              <div className="p-3 bg-blue-400/30 rounded-lg">
                <UserGroupIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Total Team Commission */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Total Commission
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(stats.totalTeamCommission)}
                </p>
                <p className="text-green-100 text-xs mt-1">All time</p>
              </div>
              <div className="p-3 bg-green-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Monthly Commission */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  This Month
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(stats.monthlyTeamCommission)}
                </p>
                <p className="text-purple-100 text-xs mt-1">
                  {stats.monthlyTeamSales} sales
                </p>
              </div>
              <div className="p-3 bg-purple-400/30 rounded-lg">
                <CalendarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Total Team Sales */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  Total Sales
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.totalTeamSales}
                </p>
                <p className="text-indigo-100 text-xs mt-1">All agents</p>
              </div>
              <div className="p-3 bg-indigo-400/30 rounded-lg">
                <ChartBarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Team Leaderboard */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Leaderboard
                </h3>
              </div>
              <Link href="/agents">
                <Button variant="secondary" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">No agents yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((agent: any, index: number) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className="flex-shrink-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? "bg-yellow-100 text-yellow-700"
                              : index === 1
                              ? "bg-gray-200 text-gray-700"
                              : index === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </div>

                      {/* Agent Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {agent.first_name} {agent.last_name}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              levelColors[agent.agent_level] ||
                              levelColors.junior
                            }`}
                          >
                            {agent.agent_level?.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {agent.agent_code}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(agent.total_commission_earned || 0)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {agent.total_sales_count || 0} sales
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Commission Approvals */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Pending Approvals
                </h3>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingCommissions.length}
              </span>
            </div>

            {pendingCommissions.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-400" />
                <p className="mt-2 text-sm text-gray-500">All caught up!</p>
                <p className="text-xs text-gray-400 mt-1">
                  No pending commissions to review
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCommissions.map((commission: any) => (
                  <div
                    key={commission.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">
                            {commission.agent?.first_name}{" "}
                            {commission.agent?.last_name}
                          </p>
                          <span className="text-xs text-gray-500">
                            ({commission.agent?.agent_code})
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-1">
                          {commission.deal_description || "Commission"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(commission.created_at)}
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-semibold text-gray-900 mb-2">
                          {formatCurrency(commission.commission_amount)}
                        </p>
                        <div className="flex gap-1">
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <XCircleIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Team Overview */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Overview
          </h3>

          {allAgents.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No team members yet</p>
              <Link href="/agents/new" className="mt-3 inline-block">
                <Button size="sm">Add First Agent</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allAgents.slice(0, 10).map((agent: any) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {agent.first_name} {agent.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {agent.agent_code}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            levelColors[agent.agent_level] || levelColors.junior
                          }`}
                        >
                          {agent.agent_level?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            agent.employment_status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {agent.employment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {agent.total_sales_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(agent.total_commission_earned || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link href={`/agents/${agent.id}`}>
                          <Button variant="secondary" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/agents/new" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Add New Agent
              </Button>
            </Link>
            <Link href="/agents" className="block">
              <Button variant="secondary" className="w-full justify-start">
                <UsersIcon className="h-4 w-4 mr-2" />
                View All Agents
              </Button>
            </Link>
            <Button variant="secondary" className="w-full justify-start">
              <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
              Performance Reports
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Commission Reports
            </Button>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
