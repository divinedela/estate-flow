import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { getCommissions, getCommissionStats } from "@/app/actions/commissions";
import { getAgents } from "@/app/actions/agents";
import { CommissionFilters } from "@/components/commissions/commission-filters";
import Link from "next/link";
import {
  CurrencyDollarIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: { agent?: string; status?: string };
}) {
  const filters = {
    agentId: searchParams.agent,
    status: searchParams.status,
  };

  const [commissionsResult, statsResult, agentsResult] = await Promise.all([
    getCommissions(filters),
    getCommissionStats(filters),
    getAgents(),
  ]);

  const commissions = commissionsResult.data || [];
  const stats = statsResult.data;
  const agents = agentsResult.data || [];

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

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    disputed: "bg-orange-100 text-orange-800",
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "agent_manager", "agent", "executive"]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Commissions</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage agent commissions
            </p>
          </div>
          <Link href="/agents/commissions/new">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Record Commission
            </Button>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Commissions
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.totalCommissions}
                </p>
                <p className="text-blue-100 text-xs mt-1">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <div className="p-3 bg-blue-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.pendingCommissions}
                </p>
                <p className="text-yellow-100 text-xs mt-1">
                  {formatCurrency(stats.pendingAmount)}
                </p>
              </div>
              <div className="p-3 bg-yellow-400/30 rounded-lg">
                <ClockIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Approved</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.approvedCommissions}
                </p>
                <p className="text-indigo-100 text-xs mt-1">
                  Ready for payment
                </p>
              </div>
              <div className="p-3 bg-indigo-400/30 rounded-lg">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Paid</p>
                <p className="text-3xl font-bold mt-2">
                  {stats.paidCommissions}
                </p>
                <p className="text-green-100 text-xs mt-1">
                  {formatCurrency(stats.paidAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-400/30 rounded-lg">
                <BanknotesIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <CommissionFilters
          agents={agents}
          currentAgent={searchParams.agent}
          currentStatus={searchParams.status}
        />

        {/* Commissions List */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            All Commissions
          </h3>

          {commissions.length === 0 ? (
            <div className="text-center py-12">
              <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No commissions
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by recording a commission.
              </p>
              <div className="mt-6">
                <Link href="/agents/commissions/new">
                  <Button>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Record Commission
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sale Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commissions.map((commission: any) => (
                    <tr key={commission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {commission.agent?.first_name}{" "}
                            {commission.agent?.last_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commission.agent?.agent_code}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {commission.transaction_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commission.deal_description ||
                              commission.property?.name ||
                              `${commission.lead?.first_name || ""} ${
                                commission.lead?.last_name || ""
                              }`.trim() ||
                              "N/A"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(commission.transaction_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(commission.sale_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(commission.final_commission)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {commission.commission_rate}% •{" "}
                            {commission.split_percentage}% split
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            statusColors[commission.status] ||
                            statusColors.pending
                          }`}
                        >
                          {commission.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link href={`/agents/commissions/${commission.id}`}>
                          <Button variant="secondary" size="sm">
                            View Details
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
      </div>
    </RoleGuard>
  );
}
