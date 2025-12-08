import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'
import { SupabaseClient } from '@supabase/supabase-js'
import Link from 'next/link'

type SupabaseClientType = SupabaseClient<Database>

// Fetch all dashboard stats for Super Admin
async function getSuperAdminStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return getEmptyStats()
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return getEmptyStats()
  }

  const orgId = profile.organization_id

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
  ])

  return {
    projects: projectStats,
    marketing: marketingStats,
    hr: hrStats,
    inventory: inventoryStats,
    facilities: facilityStats,
    purchasing: purchasingStats,
    system: systemStats,
  }
}

function getEmptyStats() {
  return {
    projects: { ongoing: 0, onHold: 0, completed: 0, budgetVsActual: '0', overdueTasks: 0 },
    marketing: { totalLeads: 0, hotLeads: 0, conversionRate: 0, activeCampaigns: 0 },
    hr: { totalEmployees: 0, activeEmployees: 0, pendingLeave: 0, expiringDocuments: 0 },
    inventory: { totalItems: 0, lowStockItems: 0 },
    facilities: { openMaintenance: 0, overdueTickets: 0 },
    purchasing: { openPRs: 0, pendingApprovals: 0, recentPOs: 0 },
    system: { totalUsers: 0, activeUsers: 0 },
  }
}

// Project Stats
async function getProjectStats(supabase: SupabaseClientType, orgId: string) {
  const { count: ongoing } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  const { count: onHold } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'on_hold')

  const { count: completed } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'completed')

  // Calculate budget vs actual
  const { data: projects } = await supabase
    .from('projects')
    .select('budget, actual_cost')
    .eq('organization_id', orgId)

  let totalBudget = 0
  let totalActual = 0
  if (projects) {
    totalBudget = projects.reduce((sum, p) => sum + (parseFloat(p.budget?.toString() || '0') || 0), 0)
    totalActual = projects.reduce((sum, p) => sum + (parseFloat(p.actual_cost?.toString() || '0') || 0), 0)
  }

  // Get overdue tasks
  const { data: projectList } = await supabase
    .from('projects')
    .select('id')
    .eq('organization_id', orgId)

  const projectIds = projectList?.map(p => p.id) || []
  const today = new Date().toISOString().split('T')[0]
  
  let overdueTasks = 0
  if (projectIds.length > 0) {
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('id')
      .in('project_id', projectIds)
      .lt('due_date', today)
      .neq('status', 'completed')
    
    overdueTasks = tasks?.length || 0
  }

  return {
    ongoing: ongoing || 0,
    onHold: onHold || 0,
    completed: completed || 0,
    budgetVsActual: totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : '0',
    overdueTasks,
  }
}

// Marketing Stats
async function getMarketingStats(supabase: SupabaseClientType, orgId: string) {
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: hotLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'hot')

  const { count: convertedLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'converted')

  const { count: activeCampaigns } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  const conversionRate = totalLeads && totalLeads > 0
    ? Math.round((convertedLeads || 0) / totalLeads * 100)
    : 0

  return {
    totalLeads: totalLeads || 0,
    hotLeads: hotLeads || 0,
    conversionRate,
    activeCampaigns: activeCampaigns || 0,
  }
}

// HR Stats
async function getHRStats(supabase: SupabaseClientType, orgId: string) {
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: activeEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  // Get employee IDs for leave and documents
  const { data: employees } = await supabase
    .from('employees')
    .select('id')
    .eq('organization_id', orgId)

  const employeeIds = employees?.map(e => e.id) || []

  // Pending leave requests
  const { count: pendingLeave } = employeeIds.length > 0
    ? await supabase
        .from('leave_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .in('employee_id', employeeIds)
    : { count: 0 }

  // Expiring documents (within next 30 days)
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
    pendingLeave: pendingLeave || 0,
    expiringDocuments: expiringDocuments || 0,
  }
}

// Inventory Stats
async function getInventoryStats(supabase: SupabaseClientType, orgId: string) {
  const { count: totalItems } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('is_active', true)

  // Get items with reorder rules to check low stock
  const { data: items } = await supabase
    .from('items')
    .select('id')
    .eq('organization_id', orgId)
    .eq('is_active', true)

  const itemIds = items?.map(i => i.id) || []
  let lowStockItems = 0

  if (itemIds.length > 0) {
    // Check items that have stock levels below reorder point
    const { data: reorderRules } = await supabase
      .from('reorder_rules')
      .select('item_id, reorder_point')
      .in('item_id', itemIds)

    if (reorderRules && reorderRules.length > 0) {
      for (const rule of reorderRules) {
        const { data: stockLevels } = await supabase
          .from('stock_levels')
          .select('quantity')
          .eq('item_id', rule.item_id)

        const totalQuantity = stockLevels?.reduce((sum, sl) => 
          sum + (parseFloat(sl.quantity?.toString() || '0') || 0), 0) || 0

        if (totalQuantity <= (parseFloat(rule.reorder_point?.toString() || '0') || 0)) {
          lowStockItems++
        }
      }
    }
  }

  return {
    totalItems: totalItems || 0,
    lowStockItems,
  }
}

// Facility Stats
async function getFacilityStats(supabase: SupabaseClientType, orgId: string) {
  const { count: openMaintenance } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['pending', 'in_progress'])

  // Get overdue maintenance requests (past due date)
  const today = new Date().toISOString().split('T')[0]
  const { count: overdueTickets } = await supabase
    .from('maintenance_requests')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['pending', 'in_progress'])
    .lt('due_date', today)

  return {
    openMaintenance: openMaintenance || 0,
    overdueTickets: overdueTickets || 0,
  }
}

// Purchasing Stats
async function getPurchasingStats(supabase: SupabaseClientType, orgId: string) {
  const { count: openPRs } = await supabase
    .from('purchase_requisitions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .in('status', ['draft', 'submitted', 'approved'])

  const { count: pendingApprovals } = await supabase
    .from('purchase_requisitions')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'submitted')

  // Recent POs (created in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const { count: recentPOs } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', thirtyDaysAgo.toISOString())

  return {
    openPRs: openPRs || 0,
    pendingApprovals: pendingApprovals || 0,
    recentPOs: recentPOs || 0,
  }
}

// System Stats
async function getSystemStats(supabase: SupabaseClientType, orgId: string) {
  const { count: totalUsers } = await supabase
    .from('app_users')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: activeUsers } = await supabase
    .from('app_users')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('is_active', true)

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
  }
}

export default async function DashboardPage() {
  const stats = await getSuperAdminStats()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your real estate development operations
          </p>
        </div>

        {/* Projects Section */}
        <Card title="Projects">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Ongoing Projects</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.projects.ongoing}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">On Hold</p>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.projects.onHold}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.projects.completed}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Budget Usage</p>
              <p className="mt-2 text-3xl font-semibold text-purple-600">{stats.projects.budgetVsActual}%</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{stats.projects.overdueTasks}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/projects" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View all projects →
            </Link>
          </div>
        </Card>

        {/* Marketing/CRM Section */}
        <Card title="Marketing & Sales">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Active Leads</p>
              <p className="mt-2 text-3xl font-semibold text-purple-600">{stats.marketing.totalLeads}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Hot Leads</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{stats.marketing.hotLeads}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.marketing.conversionRate}%</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.marketing.activeCampaigns}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/marketing" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View CRM dashboard →
            </Link>
          </div>
        </Card>

        {/* HR Section */}
        <Card title="Human Resources">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.hr.totalEmployees}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Active Employees</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.hr.activeEmployees}</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Pending Leave</p>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.hr.pendingLeave}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Expiring Documents</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{stats.hr.expiringDocuments}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/hr" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View HR dashboard →
            </Link>
          </div>
        </Card>

        {/* Inventory Section */}
        <Card title="Inventory">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{stats.inventory.lowStockItems}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.inventory.totalItems}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/inventory" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View inventory dashboard →
            </Link>
          </div>
        </Card>

        {/* Facilities Section */}
        <Card title="Facilities">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Open Maintenance</p>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.facilities.openMaintenance}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Overdue Tickets</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{stats.facilities.overdueTickets}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/facilities" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View facilities dashboard →
            </Link>
          </div>
        </Card>

        {/* Purchasing Section */}
        <Card title="Purchasing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Open PRs</p>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.purchasing.openPRs}</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.purchasing.pendingApprovals}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Recent POs (30d)</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.purchasing.recentPOs}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/purchasing" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View procurement dashboard →
            </Link>
          </div>
        </Card>

        {/* System Administration Section */}
        <Card title="System Administration">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.system.totalUsers}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">{stats.system.activeUsers}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View admin panel →
            </Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
