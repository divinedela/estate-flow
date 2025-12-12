import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  ChartBarIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

async function getReportData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) return null;

  // Fetch projects for analytics
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("organization_id", (profile as any).organization_id);

  const totalProjects = projects?.length || 0;
  const activeProjects =
    (projects as any[])?.filter((p: any) => p.status === "active").length || 0;
  const completedProjects =
    (projects as any[])?.filter((p: any) => p.status === "completed").length ||
    0;
  const totalBudget =
    (projects as any[])?.reduce(
      (sum: number, p: any) => sum + (Number(p.budget) || 0),
      0
    ) || 0;
  const totalActualCost =
    (projects as any[])?.reduce(
      (sum: number, p: any) => sum + (Number(p.actual_cost) || 0),
      0
    ) || 0;
  const avgProgress = (projects as any[])?.length
    ? (projects as any[]).reduce(
        (sum: number, p: any) => sum + (Number(p.progress_percentage) || 0),
        0
      ) / (projects as any[]).length
    : 0;

  return {
    totalProjects,
    activeProjects,
    completedProjects,
    totalBudget,
    totalActualCost,
    avgProgress: Math.round(avgProgress),
    projects: projects || [],
  };
}

export default async function ReportsPage() {
  const data = await getReportData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const reportTypes = [
    {
      name: "Project Progress Report",
      description: "Detailed progress analysis for all projects",
      icon: PresentationChartLineIcon,
      color: "bg-blue-100 text-blue-600",
    },
    {
      name: "Budget & Cost Report",
      description: "Financial performance and budget analysis",
      icon: CurrencyDollarIcon,
      color: "bg-green-100 text-green-600",
    },
    {
      name: "Team Performance Report",
      description: "Team productivity and task completion rates",
      icon: ChartPieIcon,
      color: "bg-purple-100 text-purple-600",
    },
    {
      name: "Timeline Analysis",
      description: "Project schedules and deadline tracking",
      icon: CalendarIcon,
      color: "bg-orange-100 text-orange-600",
    },
    {
      name: "Task Completion Report",
      description: "Task status and completion metrics",
      icon: CheckCircleIcon,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      name: "Resource Utilization",
      description: "Resource allocation and usage analysis",
      icon: ChartBarIcon,
      color: "bg-pink-100 text-pink-600",
    },
  ];

  return (
    <RoleGuard allowedRoles={["super_admin", "project_manager", "executive"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate insights and export detailed reports
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">
                  Total Projects
                </p>
                <p className="text-4xl font-bold mt-2">
                  {data?.totalProjects || 0}
                </p>
                <p className="text-blue-100 text-xs mt-2">
                  {data?.activeProjects || 0} active
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
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-4xl font-bold mt-2">
                  {data?.completedProjects || 0}
                </p>
                <p className="text-green-100 text-xs mt-2">
                  {data?.totalProjects
                    ? Math.round(
                        (data.completedProjects / data.totalProjects) * 100
                      )
                    : 0}
                  % completion rate
                </p>
              </div>
              <div className="p-3 bg-green-400/30 rounded-lg">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  Avg Progress
                </p>
                <p className="text-4xl font-bold mt-2">
                  {data?.avgProgress || 0}%
                </p>
                <p className="text-purple-100 text-xs mt-2">
                  Across all projects
                </p>
              </div>
              <div className="p-3 bg-purple-400/30 rounded-lg">
                <ArrowTrendingUpIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">
                  Total Budget
                </p>
                <p className="text-4xl font-bold mt-2">
                  {formatCurrency(data?.totalBudget || 0).replace(".00", "")}
                </p>
                <p className="text-amber-100 text-xs mt-2">
                  {formatCurrency(data?.totalActualCost || 0).replace(
                    ".00",
                    ""
                  )}{" "}
                  spent
                </p>
              </div>
              <div className="p-3 bg-amber-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Available Reports
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report) => (
              <Card
                key={report.name}
                className="hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${report.color}`}>
                    <report.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">
                      {report.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {report.description}
                    </p>
                    <Button variant="secondary" className="mt-4 w-full">
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Custom Report Builder */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Custom Report Builder
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Create customized reports with specific metrics
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>This year</option>
                  <option>Custom range</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projects
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>All Projects</option>
                  <option>Active Projects</option>
                  <option>Completed Projects</option>
                  <option>Specific Project</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metrics to Include
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-700">Progress</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-700">Budget</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    defaultChecked
                  />
                  <span className="text-sm text-gray-700">Tasks</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Team</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Timeline</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Issues</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Documents</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Resources</span>
                </label>
              </div>
            </div>
            <div className="flex items-center space-x-3 pt-4">
              <Button>
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                Generate Custom Report
              </Button>
              <Button variant="secondary">Export to PDF</Button>
              <Button variant="secondary">Export to Excel</Button>
            </div>
          </div>
        </Card>
      </div>
    </RoleGuard>
  );
}
