import { createClient } from "@/lib/supabase/server";
import { Database } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardCharts } from "./dashboard-charts";

type SupabaseClientType = SupabaseClient<Database>;

// Check user roles and redirect to appropriate dashboard
async function checkUserRoleAndRedirect() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null; // No redirect, show empty stats
  }

  // Get user's app_user profile
  const { data: appUser } = await supabase
    .from("app_users")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!appUser) {
    return null;
  }

  // Get user's roles
  const { data: userRoles } = await supabase
    .from("user_roles")
    .select("role:roles(name)")
    .eq("user_id", (appUser as any).id);

  const roles =
    userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || [];

  // Redirect based on primary role (in priority order)
  // Super admins see executive dashboard (no redirect)
  if (roles.includes("super_admin")) {
    return null; // Stay on executive dashboard
  }

  // Executives see executive dashboard (no redirect)
  if (roles.includes("executive")) {
    return null; // Stay on executive dashboard
  }

  // Role-specific redirects
  if (roles.includes("hr_manager")) {
    redirect("/hr");
  }

  if (roles.includes("project_manager")) {
    redirect("/projects");
  }

  if (roles.includes("marketing_officer")) {
    redirect("/marketing");
  }

  if (roles.includes("procurement_officer")) {
    redirect("/purchasing");
  }

  if (roles.includes("inventory_officer")) {
    redirect("/inventory");
  }

  if (roles.includes("facility_manager")) {
    redirect("/facilities");
  }

  if (roles.includes("agent_manager")) {
    redirect("/agents/manager");
  }

  if (roles.includes("agent")) {
    redirect("/agents/dashboard");
  }

  // Default: stay on executive dashboard
  return null;
}

// Fetch all dashboard stats for Super Admin
async function getSuperAdminStats() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return getEmptyStats();
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from("app_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .single();

  if (!(profile as any)?.organization_id) {
    return getEmptyStats();
  }

  const orgId = (profile as any).organization_id;

  // Fetch all stats in parallel
  const [
    projectStats,
    marketingStats,
    hrStats,
    inventoryStats,
    facilityStats,
    purchasingStats,
    systemStats,
  ] = await Promise.all([
    getProjectStats(supabase, orgId),
    getMarketingStats(supabase, orgId),
    getHRStats(supabase, orgId),
    getInventoryStats(supabase, orgId),
    getFacilityStats(supabase, orgId),
    getPurchasingStats(supabase, orgId),
    getSystemStats(supabase, orgId),
  ]);

  return {
    projects: projectStats,
    marketing: marketingStats,
    hr: hrStats,
    inventory: inventoryStats,
    facilities: facilityStats,
    purchasing: purchasingStats,
    system: systemStats,
  };
}

function getEmptyStats() {
  return {
    projects: {
      ongoing: 0,
      onHold: 0,
      completed: 0,
      budgetVsActual: "0",
      overdueTasks: 0,
      totalBudget: 0,
      totalActual: 0,
    },
    marketing: {
      totalLeads: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      activeCampaigns: 0,
      leadTrend: [] as { month: string; leads: number }[],
    },
    hr: {
      totalEmployees: 0,
      activeEmployees: 0,
      inactiveEmployees: 0,
      pendingLeave: 0,
      expiringDocuments: 0,
      departmentDistribution: [] as { name: string; count: number }[],
    },
    inventory: {
      totalItems: 0,
      lowStockItems: 0,
      inStockItems: 0,
      outOfStockItems: 0,
      categoryDistribution: [] as { name: string; count: number }[],
    },
    facilities: {
      openMaintenance: 0,
      overdueTickets: 0,
      pendingMaintenance: 0,
      inProgressMaintenance: 0,
      completedMaintenance: 0,
    },
    purchasing: {
      openPRs: 0,
      pendingApprovals: 0,
      recentPOs: 0,
      poTrend: [] as { month: string; orders: number; amount: number }[],
    },
    system: { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 },
  };
}

// Project Stats
async function getProjectStats(supabase: SupabaseClientType, orgId: string) {
  const { count: ongoing } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "active");

  const { count: onHold } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "on_hold");

  const { count: completed } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "completed");

  // Calculate budget vs actual
  const { data: projects } = await supabase
    .from("projects")
    .select("budget, actual_cost")
    .eq("organization_id", orgId);

  let totalBudget = 0;
  let totalActual = 0;
  if (projects) {
    totalBudget = (projects as any[]).reduce(
      (sum, p) => sum + (parseFloat((p as any).budget?.toString() || "0") || 0),
      0
    );
    totalActual = (projects as any[]).reduce(
      (sum, p) =>
        sum + (parseFloat((p as any).actual_cost?.toString() || "0") || 0),
      0
    );
  }

  // Get overdue tasks
  const { data: projectList } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", orgId);

  const projectIds = (projectList as any[])?.map((p: any) => p.id) || [];
  const today = new Date().toISOString().split("T")[0];

  let overdueTasks = 0;
  if (projectIds.length > 0) {
    const { data: tasks } = await supabase
      .from("project_tasks")
      .select("id")
      .in("project_id", projectIds)
      .lt("due_date", today)
      .neq("status", "completed");

    overdueTasks = tasks?.length || 0;
  }

  return {
    ongoing: ongoing || 0,
    onHold: onHold || 0,
    completed: completed || 0,
    budgetVsActual:
      totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : "0",
    overdueTasks,
    totalBudget,
    totalActual,
  };
}

// Marketing Stats
async function getMarketingStats(supabase: SupabaseClientType, orgId: string) {
  const { count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const { count: hotLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "hot");

  const { count: warmLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "warm");

  const { count: coldLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "cold");

  const { count: convertedLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "converted");

  const { count: activeCampaigns } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "active");

  const conversionRate =
    totalLeads && totalLeads > 0
      ? Math.round(((convertedLeads || 0) / totalLeads) * 100)
      : 0;

  // Get lead trend for last 6 months
  const leadTrend: { month: string; leads: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = date.toLocaleString("default", { month: "short" });

    const { count } = await supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", date.toISOString())
      .lt("created_at", nextDate.toISOString());

    leadTrend.push({ month: monthName, leads: count || 0 });
  }

  return {
    totalLeads: totalLeads || 0,
    hotLeads: hotLeads || 0,
    warmLeads: warmLeads || 0,
    coldLeads: coldLeads || 0,
    convertedLeads: convertedLeads || 0,
    conversionRate,
    activeCampaigns: activeCampaigns || 0,
    leadTrend,
  };
}

// HR Stats
async function getHRStats(supabase: SupabaseClientType, orgId: string) {
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const { count: activeEmployees } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "active");

  const inactiveEmployees = (totalEmployees || 0) - (activeEmployees || 0);

  // Get employee IDs for leave and documents
  const { data: employees } = await supabase
    .from("employees")
    .select("id, department")
    .eq("organization_id", orgId);

  const employeeIds = (employees as any[])?.map((e: any) => e.id) || [];

  // Department distribution
  const departmentCounts: Record<string, number> = {};
  (employees as any[])?.forEach((e: any) => {
    const dept = e.department || "Unassigned";
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });
  const departmentDistribution = Object.entries(departmentCounts).map(
    ([name, count]) => ({ name, count })
  );

  // Pending leave requests
  const { count: pendingLeave } =
    employeeIds.length > 0
      ? await supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .in("employee_id", employeeIds)
      : { count: 0 };

  // Expiring documents (within next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { count: expiringDocuments } =
    employeeIds.length > 0
      ? await supabase
          .from("employee_documents")
          .select("*", { count: "exact", head: true })
          .in("employee_id", employeeIds)
          .not("expiry_date", "is", null)
          .lte("expiry_date", thirtyDaysFromNow.toISOString().split("T")[0])
          .gte("expiry_date", new Date().toISOString().split("T")[0])
      : { count: 0 };

  return {
    totalEmployees: totalEmployees || 0,
    activeEmployees: activeEmployees || 0,
    inactiveEmployees,
    pendingLeave: pendingLeave || 0,
    expiringDocuments: expiringDocuments || 0,
    departmentDistribution,
  };
}

// Inventory Stats
async function getInventoryStats(supabase: SupabaseClientType, orgId: string) {
  const { count: totalItems } = await supabase
    .from("items")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  // Get items with categories
  const { data: items } = await supabase
    .from("items")
    .select("id, category")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  // Category distribution
  const categoryCounts: Record<string, number> = {};
  (items as any[])?.forEach((i: any) => {
    const cat = i.category || "Uncategorized";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });
  const categoryDistribution = Object.entries(categoryCounts).map(
    ([name, count]) => ({ name, count })
  );

  const itemIds = (items as any[])?.map((i: any) => i.id) || [];
  let lowStockItems = 0;
  let outOfStockItems = 0;
  let inStockItems = 0;

  if (itemIds.length > 0) {
    const { data: reorderRules } = await supabase
      .from("reorder_rules")
      .select("item_id, reorder_point")
      .in("item_id", itemIds);

    const itemsWithRules = new Set(
      (reorderRules as any[])?.map((r: any) => r.item_id) || []
    );

    if (reorderRules && reorderRules.length > 0) {
      for (const rule of reorderRules as any[]) {
        const { data: stockLevels } = await supabase
          .from("stock_levels")
          .select("quantity")
          .eq("item_id", (rule as any).item_id);

        const totalQuantity =
          stockLevels?.reduce(
            (sum, sl) =>
              sum + (parseFloat((sl as any).quantity?.toString() || "0") || 0),
            0
          ) || 0;

        const reorderPoint =
          parseFloat((rule as any).reorder_point?.toString() || "0") || 0;

        if (totalQuantity === 0) {
          outOfStockItems++;
        } else if (totalQuantity <= reorderPoint) {
          lowStockItems++;
        } else {
          inStockItems++;
        }
      }
    }

    inStockItems += itemIds.length - itemsWithRules.size;
  }

  return {
    totalItems: totalItems || 0,
    lowStockItems,
    inStockItems,
    outOfStockItems,
    categoryDistribution,
  };
}

// Facility Stats
async function getFacilityStats(supabase: SupabaseClientType, orgId: string) {
  const { count: pendingMaintenance } = await supabase
    .from("maintenance_requests")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "pending");

  const { count: inProgressMaintenance } = await supabase
    .from("maintenance_requests")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "in_progress");

  const { count: completedMaintenance } = await supabase
    .from("maintenance_requests")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "completed");

  const openMaintenance =
    (pendingMaintenance || 0) + (inProgressMaintenance || 0);

  const today = new Date().toISOString().split("T")[0];
  const { count: overdueTickets } = await supabase
    .from("maintenance_requests")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .in("status", ["pending", "in_progress"])
    .lt("due_date", today);

  return {
    openMaintenance,
    overdueTickets: overdueTickets || 0,
    pendingMaintenance: pendingMaintenance || 0,
    inProgressMaintenance: inProgressMaintenance || 0,
    completedMaintenance: completedMaintenance || 0,
  };
}

// Purchasing Stats
async function getPurchasingStats(supabase: SupabaseClientType, orgId: string) {
  const { count: openPRs } = await supabase
    .from("purchase_requisitions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .in("status", ["draft", "submitted", "approved"]);

  const { count: pendingApprovals } = await supabase
    .from("purchase_requisitions")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("status", "submitted");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: recentPOs } = await supabase
    .from("purchase_orders")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  const poTrend: { month: string; orders: number; amount: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = date.toLocaleString("default", { month: "short" });

    const { count, data } = await supabase
      .from("purchase_orders")
      .select("total_amount", { count: "exact" })
      .eq("organization_id", orgId)
      .gte("created_at", date.toISOString())
      .lt("created_at", nextDate.toISOString());

    const totalAmount =
      (data as any[])?.reduce(
        (sum, po: any) =>
          sum + (parseFloat(po.total_amount?.toString() || "0") || 0),
        0
      ) || 0;

    poTrend.push({ month: monthName, orders: count || 0, amount: totalAmount });
  }

  return {
    openPRs: openPRs || 0,
    pendingApprovals: pendingApprovals || 0,
    recentPOs: recentPOs || 0,
    poTrend,
  };
}

// System Stats
async function getSystemStats(supabase: SupabaseClientType, orgId: string) {
  const { count: totalUsers } = await supabase
    .from("app_users")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId);

  const { count: activeUsers } = await supabase
    .from("app_users")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", orgId)
    .eq("is_active", true);

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    inactiveUsers: (totalUsers || 0) - (activeUsers || 0),
  };
}

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  gradient,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 ${gradient} shadow-lg`}
    >
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
            {icon}
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                trendUp
                  ? "bg-green-400/20 text-green-100"
                  : "bg-red-400/20 text-red-100"
              }`}
            >
              {trendUp ? (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              ) : (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              {trend}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="mt-1 text-sm font-medium text-white/80">{title}</p>
        </div>
      </div>
    </div>
  );
}

// Section Card Component
function SectionCard({
  title,
  children,
  href,
  linkText = "View all →",
}: {
  title: string;
  children: React.ReactNode;
  href: string;
  linkText?: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <Link
          href={href}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
        >
          {linkText}
          <svg
            className="h-4 w-4 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
      {children}
    </div>
  );
}

// Mini Stat Component
function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    yellow: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100",
  };

  return (
    <div
      className={`rounded-xl p-4 border ${
        colorClasses[color] || colorClasses.gray
      }`}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  // Check user role and redirect if necessary
  await checkUserRoleAndRedirect();

  const stats = await getSuperAdminStats();

  const totalProjects =
    stats.projects.ongoing + stats.projects.onHold + stats.projects.completed;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-gray-500">
            Welcome back! Here's what's happening with your operations today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Projects"
          value={totalProjects}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          icon={
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
        />
        <StatCard
          title="Active Leads"
          value={stats.marketing.totalLeads}
          gradient="bg-gradient-to-br from-purple-500 to-purple-600"
          trend={`${stats.marketing.conversionRate}% conv.`}
          trendUp={stats.marketing.conversionRate > 0}
          icon={
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Team Members"
          value={stats.hr.totalEmployees}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          trend={`${stats.hr.activeEmployees} active`}
          trendUp={true}
          icon={
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Open Tickets"
          value={stats.facilities.openMaintenance}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          trend={
            stats.facilities.overdueTickets > 0
              ? `${stats.facilities.overdueTickets} overdue`
              : "All on track"
          }
          trendUp={stats.facilities.overdueTickets === 0}
          icon={
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
        />
      </div>

      {/* Projects & Marketing Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <SectionCard title="Projects Overview" href="/projects">
          <div className="grid grid-cols-3 gap-3 mb-6">
            <MiniStat
              label="Ongoing"
              value={stats.projects.ongoing}
              color="blue"
            />
            <MiniStat
              label="On Hold"
              value={stats.projects.onHold}
              color="yellow"
            />
            <MiniStat
              label="Completed"
              value={stats.projects.completed}
              color="green"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Status Distribution
              </h4>
              <DashboardCharts
                type="projectStatus"
                data={{
                  ongoing: stats.projects.ongoing,
                  onHold: stats.projects.onHold,
                  completed: stats.projects.completed,
                }}
              />
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Budget Analysis
              </h4>
              <DashboardCharts
                type="budget"
                data={{
                  budget: stats.projects.totalBudget,
                  actual: stats.projects.totalActual,
                }}
              />
            </div>
          </div>
          {stats.projects.overdueTasks > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm font-medium text-red-700">
                {stats.projects.overdueTasks} overdue tasks need attention
              </span>
            </div>
          )}
        </SectionCard>

        {/* Marketing */}
        <SectionCard title="Sales & Marketing" href="/marketing">
          <div className="grid grid-cols-4 gap-3 mb-6">
            <MiniStat
              label="Hot"
              value={stats.marketing.hotLeads}
              color="red"
            />
            <MiniStat
              label="Warm"
              value={stats.marketing.warmLeads}
              color="yellow"
            />
            <MiniStat
              label="Cold"
              value={stats.marketing.coldLeads}
              color="blue"
            />
            <MiniStat
              label="Won"
              value={stats.marketing.convertedLeads}
              color="green"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Lead Pipeline
              </h4>
              <DashboardCharts
                type="leadStatus"
                data={{
                  hot: stats.marketing.hotLeads,
                  warm: stats.marketing.warmLeads,
                  cold: stats.marketing.coldLeads,
                  converted: stats.marketing.convertedLeads,
                }}
              />
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                6-Month Trend
              </h4>
              <DashboardCharts
                type="leadTrend"
                data={stats.marketing.leadTrend}
              />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-indigo-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
              <span className="text-sm font-medium text-indigo-700">
                {stats.marketing.activeCampaigns} active campaigns
              </span>
            </div>
            <span className="text-sm font-bold text-indigo-600">
              {stats.marketing.conversionRate}% conversion
            </span>
          </div>
        </SectionCard>
      </div>

      {/* HR & Inventory Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HR */}
        <SectionCard title="Human Resources" href="/hr">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MiniStat
                  label="Active"
                  value={stats.hr.activeEmployees}
                  color="green"
                />
                <MiniStat
                  label="On Leave"
                  value={stats.hr.pendingLeave}
                  color="yellow"
                />
              </div>
              {stats.hr.expiringDocuments > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <svg
                    className="h-5 w-5 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-amber-700">
                    {stats.hr.expiringDocuments} documents expiring soon
                  </span>
                </div>
              )}
            </div>
            <div className="w-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
                Status
              </h4>
              <DashboardCharts
                type="employeeStatus"
                data={{
                  active: stats.hr.activeEmployees,
                  inactive: stats.hr.inactiveEmployees,
                }}
              />
            </div>
          </div>
        </SectionCard>

        {/* Inventory */}
        <SectionCard title="Inventory Status" href="/inventory">
          <div className="flex items-start gap-6">
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MiniStat
                  label="Total Items"
                  value={stats.inventory.totalItems}
                  color="indigo"
                />
                <MiniStat
                  label="Low Stock"
                  value={stats.inventory.lowStockItems}
                  color="red"
                />
              </div>
              {stats.inventory.outOfStockItems > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                  <svg
                    className="h-5 w-5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <span className="text-sm font-medium text-red-700">
                    {stats.inventory.outOfStockItems} items out of stock
                  </span>
                </div>
              )}
            </div>
            <div className="w-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 text-center">
                Levels
              </h4>
              <DashboardCharts
                type="inventory"
                data={{
                  inStock: stats.inventory.inStockItems,
                  lowStock: stats.inventory.lowStockItems,
                  outOfStock: stats.inventory.outOfStockItems,
                }}
              />
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Facilities & Purchasing Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facilities */}
        <SectionCard title="Facilities & Maintenance" href="/facilities">
          <div className="grid grid-cols-4 gap-3 mb-4">
            <MiniStat
              label="Pending"
              value={stats.facilities.pendingMaintenance}
              color="yellow"
            />
            <MiniStat
              label="In Progress"
              value={stats.facilities.inProgressMaintenance}
              color="blue"
            />
            <MiniStat
              label="Done"
              value={stats.facilities.completedMaintenance}
              color="green"
            />
            <MiniStat
              label="Overdue"
              value={stats.facilities.overdueTickets}
              color="red"
            />
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Maintenance Overview
            </h4>
            <DashboardCharts
              type="maintenance"
              data={{
                pending: stats.facilities.pendingMaintenance,
                inProgress: stats.facilities.inProgressMaintenance,
                completed: stats.facilities.completedMaintenance,
                overdue: stats.facilities.overdueTickets,
              }}
            />
          </div>
        </SectionCard>

        {/* Purchasing */}
        <SectionCard title="Procurement" href="/purchasing">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MiniStat
              label="Open PRs"
              value={stats.purchasing.openPRs}
              color="yellow"
            />
            <MiniStat
              label="Pending"
              value={stats.purchasing.pendingApprovals}
              color="blue"
            />
            <MiniStat
              label="Recent POs"
              value={stats.purchasing.recentPOs}
              color="green"
            />
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              PO Trend (6 Months)
            </h4>
            <DashboardCharts type="poTrend" data={stats.purchasing.poTrend} />
          </div>
        </SectionCard>
      </div>

      {/* System Admin Row */}
      <SectionCard title="System Administration" href="/admin">
        <div className="flex items-center gap-8">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
              <p className="text-3xl font-bold">{stats.system.totalUsers}</p>
              <p className="text-sm font-medium text-indigo-100 mt-1">
                Total Users
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <p className="text-3xl font-bold">{stats.system.activeUsers}</p>
              <p className="text-sm font-medium text-emerald-100 mt-1">
                Active
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 text-white">
              <p className="text-3xl font-bold">{stats.system.inactiveUsers}</p>
              <p className="text-sm font-medium text-gray-100 mt-1">Inactive</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <p className="text-3xl font-bold">
                {stats.system.totalUsers > 0
                  ? Math.round(
                      (stats.system.activeUsers / stats.system.totalUsers) * 100
                    )
                  : 0}
                %
              </p>
              <p className="text-sm font-medium text-purple-100 mt-1">
                Activity Rate
              </p>
            </div>
          </div>
          <div className="hidden lg:block w-32">
            <DashboardCharts
              type="users"
              data={{
                active: stats.system.activeUsers,
                inactive: stats.system.inactiveUsers,
              }}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
