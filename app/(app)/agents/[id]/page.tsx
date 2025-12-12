import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { getAgent } from "@/app/actions/agents";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeftIcon,
  PencilIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  UserIcon,
  DocumentTextIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";

export default async function AgentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const result = (await getAgent(params.id)) as any;

  if (!result.success || !result.data) {
    notFound();
  }

  const agent = result.data;

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    on_leave: "bg-yellow-100 text-yellow-800",
    inactive: "bg-gray-100 text-gray-800",
    terminated: "bg-red-100 text-red-800",
  };

  const levelColors: Record<string, string> = {
    junior: "bg-blue-100 text-blue-800",
    senior: "bg-indigo-100 text-indigo-800",
    team_lead: "bg-purple-100 text-purple-800",
    manager: "bg-pink-100 text-pink-800",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <RoleGuard
      allowedRoles={["super_admin", "agent_manager", "agent", "executive"]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/agents">
              <Button variant="secondary" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {agent.first_name} {agent.last_name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Agent Code: {agent.agent_code}
              </p>
            </div>
          </div>
          <Link href={`/agents/${agent.id}/edit`}>
            <Button>
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Agent
            </Button>
          </Link>
        </div>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Sales</p>
                <p className="text-3xl font-bold mt-2">
                  {agent.total_sales_count || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-400/30 rounded-lg">
                <ChartBarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Sales Value
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(agent.total_sales_value || 0)}
                </p>
              </div>
              <div className="p-3 bg-green-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Commission Earned
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(agent.total_commission_earned || 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">
                  Avg Deal Size
                </p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(agent.average_deal_size || 0)}
                </p>
              </div>
              <div className="p-3 bg-indigo-400/30 rounded-lg">
                <ChartBarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {agent.first_name} {agent.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {agent.email}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {agent.phone || "N/A"}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Mobile</p>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {agent.mobile || "N/A"}
                  </div>
                </div>
                {agent.address && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <div className="mt-1 flex items-start text-sm text-gray-900">
                      <BuildingOfficeIcon className="h-4 w-4 mr-2 mt-0.5 text-gray-400" />
                      <div>
                        <p>{agent.address}</p>
                        {(agent.city || agent.state || agent.postal_code) && (
                          <p>
                            {agent.city}
                            {agent.city && agent.state && ", "}
                            {agent.state} {agent.postal_code}
                          </p>
                        )}
                        {agent.country && <p>{agent.country}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* License Information */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                License Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    License Number
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {agent.license_number || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">State</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {agent.license_state || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Expiry Date
                  </p>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatDate(agent.license_expiry_date)}
                  </p>
                  {agent.license_expiry_date &&
                    new Date(agent.license_expiry_date) < new Date() && (
                      <p className="text-xs text-red-600 mt-1">Expired</p>
                    )}
                </div>
              </div>
            </Card>

            {/* Employment Details */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Employment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Employment Status
                  </p>
                  <span
                    className={`inline-flex mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      statusColors[agent.employment_status] ||
                      statusColors.inactive
                    }`}
                  >
                    {agent.employment_status?.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Agent Level
                  </p>
                  <span
                    className={`inline-flex mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      levelColors[agent.agent_level] || levelColors.junior
                    }`}
                  >
                    {agent.agent_level?.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Employment Type
                  </p>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {agent.employment_type?.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Hire Date</p>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(agent.hire_date)}
                  </div>
                </div>
                {agent.manager && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500">
                      Reports To
                    </p>
                    <div className="mt-1 flex items-center text-sm text-gray-900">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      {agent.manager.first_name} {agent.manager.last_name}
                    </div>
                  </div>
                )}
                {agent.specializations && agent.specializations.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-500 mb-2">
                      Specializations
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {agent.specializations.map((spec: string) => (
                        <span
                          key={spec}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {agent.notes && (
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Notes
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {agent.notes}
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Commission Structure */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Commission Structure
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {agent.commission_type?.replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Rate</p>
                  <p className="mt-1 text-2xl font-bold text-indigo-600">
                    {agent.commission_rate}%
                  </p>
                </div>
                {agent.commission_split_enabled && (
                  <div className="pt-3 border-t border-gray-200">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800">
                      Commission Split Enabled
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Stats */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Performance
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Conversion Rate
                  </p>
                  <p className="mt-1 text-2xl font-bold text-green-600">
                    {agent.conversion_rate || 0}%
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-medium text-gray-500">
                      TOTAL SALES
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {agent.total_sales_count || 0}
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-medium text-gray-500">
                      COMMISSION EARNED
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(agent.total_commission_earned || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href={`/agents/${agent.id}/commissions`}
                  className="block"
                >
                  <Button variant="secondary" className="w-full justify-start">
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    View Commissions
                  </Button>
                </Link>
                <Link href={`/agents/${agent.id}/clients`} className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <UserIcon className="h-4 w-4 mr-2" />
                    View Clients
                  </Button>
                </Link>
                <Link href={`/agents/${agent.id}/properties`} className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                    View Properties
                  </Button>
                </Link>
                <Link href={`/agents/${agent.id}/documents`} className="block">
                  <Button variant="secondary" className="w-full justify-start">
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    View Documents
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
