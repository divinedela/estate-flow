import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FolderIcon,
  FolderPlusIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  PencilIcon,
  RectangleStackIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'

interface Project {
  id: string
  project_code: string
  name: string
  description: string | null
  project_type: string | null
  status: string
  progress_percentage: number | null
  budget: number | null
  actual_cost: number | null
  start_date: string | null
  end_date: string | null
  created_at: string
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  project_id: string
  project: {
    name: string
  } | null
}

async function getProjectStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalProjects: 0,
      activeProjects: 0,
      planningProjects: 0,
      onHoldProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      totalBudget: 0,
      totalActualCost: 0,
      recentProjects: [] as Project[],
      upcomingTasks: [] as Task[],
      projectsByType: [] as { type: string; count: number }[],
    }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      totalProjects: 0,
      activeProjects: 0,
      planningProjects: 0,
      onHoldProjects: 0,
      completedProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      overdueTasks: 0,
      totalBudget: 0,
      totalActualCost: 0,
      recentProjects: [] as Project[],
      upcomingTasks: [] as Task[],
      projectsByType: [] as { type: string; count: number }[],
    }
  }

  const orgId = profile.organization_id
  const today = new Date().toISOString().split('T')[0]

  // Fetch all projects
  const { data: allProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const projects = (allProjects || []) as Project[]
  const projectIds = projects.map(p => p.id)

  // Calculate project stats
  const totalProjects = projects.length
  const activeProjects = projects.filter(p => p.status === 'active').length
  const planningProjects = projects.filter(p => p.status === 'planning').length
  const onHoldProjects = projects.filter(p => p.status === 'on_hold').length
  const completedProjects = projects.filter(p => p.status === 'completed').length
  const recentProjects = projects.slice(0, 5)

  // Calculate budget totals
  const totalBudget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0)
  const totalActualCost = projects.reduce((sum, p) => sum + (Number(p.actual_cost) || 0), 0)

  // Projects by type
  const typeMap = new Map<string, number>()
  projects.forEach(p => {
    const type = p.project_type || 'Other'
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })
  const projectsByType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Task stats
  let totalTasks = 0
  let completedTasks = 0
  let overdueTasks = 0
  let upcomingTasks: Task[] = []

  if (projectIds.length > 0) {
    const { data: allTasks } = await supabase
      .from('project_tasks')
      .select(`
        id, title, status, priority, due_date, project_id,
        project:projects(name)
      `)
      .in('project_id', projectIds)
      .order('due_date', { ascending: true })

    const tasks = (allTasks || []) as Task[]
    totalTasks = tasks.length
    completedTasks = tasks.filter(t => t.status === 'completed').length
    overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      t.due_date && 
      t.due_date < today
    ).length

    // Get upcoming tasks (not completed, with due date)
    upcomingTasks = tasks
      .filter(t => t.status !== 'completed' && t.due_date)
      .slice(0, 5)
  }

  return {
    totalProjects,
    activeProjects,
    planningProjects,
    onHoldProjects,
    completedProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    totalBudget,
    totalActualCost,
    recentProjects,
    upcomingTasks,
    projectsByType,
  }
}

async function getUserRole() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) return null

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', appUser.id)

  const roles = userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || []

  if (roles.includes('super_admin')) return 'super_admin'
  if (roles.includes('executive')) return 'executive'
  if (roles.includes('project_manager')) return 'project_manager'
  if (roles.includes('site_engineer')) return 'site_engineer'
  return null
}

export default async function ProjectsPage() {
  const stats = await getProjectStats()
  const userRole = await getUserRole()

  const quickLinks = [
    { name: 'All Projects', href: '/projects/list', icon: FolderIcon, color: 'bg-blue-500', description: 'View all projects' },
    { name: 'Tasks & Issues', href: '/projects/tasks', icon: ClipboardDocumentListIcon, color: 'bg-purple-500', description: 'Manage tasks & issues' },
    { name: 'Phases', href: '/projects/phases', icon: RectangleStackIcon, color: 'bg-indigo-500', description: 'Manage phases' },
    { name: 'New Project', href: '/projects/new', icon: FolderPlusIcon, color: 'bg-emerald-500', description: 'Create project' },
  ]

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const taskCompletionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0

  return (
    <RoleGuard allowedRoles={['super_admin', 'project_manager', 'site_engineer', 'executive']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Projects Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage construction and development projects
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/projects/new">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <FolderPlusIcon className="h-5 w-5 mr-2" />
                  New Project
                </button>
              </Link>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Projects</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalProjects}</p>
                  <p className="text-blue-100 text-xs mt-2">
                    {stats.activeProjects} active
                  </p>
                </div>
                <div className="p-3 bg-blue-400/30 rounded-lg">
                  <FolderIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed</p>
                  <p className="text-4xl font-bold mt-2">{stats.completedProjects}</p>
                  <p className="text-green-100 text-xs mt-2">
                    {stats.planningProjects} in planning
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
                  <p className="text-purple-100 text-sm font-medium">Total Tasks</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalTasks}</p>
                  <p className="text-purple-100 text-xs mt-2">
                    {taskCompletionRate}% completed
                  </p>
                </div>
                <div className="p-3 bg-purple-400/30 rounded-lg">
                  <ClipboardDocumentListIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Overdue Tasks</p>
                  <p className="text-4xl font-bold mt-2">{stats.overdueTasks}</p>
                  <p className="text-red-100 text-xs mt-2">
                    {stats.onHoldProjects} projects on hold
                  </p>
                </div>
                <div className="p-3 bg-red-400/30 rounded-lg">
                  <ExclamationTriangleIcon className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${link.color}`}>
                      <link.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {link.name}
                      </h3>
                      <p className="text-sm text-gray-500">{link.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Budget Overview */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Budget</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBudget)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Actual Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalActualCost)}</p>
                  {stats.totalBudget > 0 && (
                    <p className={`text-xs mt-1 ${stats.totalActualCost > stats.totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.totalActualCost > stats.totalBudget ? 'Over budget' : 'Under budget'} by {formatCurrency(Math.abs(stats.totalBudget - stats.totalActualCost))}
                    </p>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Projects */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Projects</h3>
                <Link href="/projects/list" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              {stats.recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No projects yet</p>
                  <Link href="/projects/new">
                    <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                      <FolderPlusIcon className="h-4 w-4 mr-2" />
                      Create First Project
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.recentProjects.map((project) => {
                        const progress = Number(project.progress_percentage) || 0
                        return (
                          <tr key={project.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                <p className="text-xs text-gray-500">{project.project_code}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                                {project.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className="bg-indigo-600 h-2 rounded-full"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600">{progress}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <Link
                                  href={`/projects/${project.id}`}
                                  className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                  title="View"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                </Link>
                                <Link
                                  href={`/projects/${project.id}/edit`}
                                  className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Project Types */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">By Type</h3>
              </div>
              {stats.projectsByType.length === 0 ? (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.projectsByType.map((item, index) => {
                    const percentage = stats.totalProjects > 0 
                      ? Math.round((item.count / stats.totalProjects) * 100) 
                      : 0
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
                    return (
                      <div key={item.type}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 capitalize">{item.type}</span>
                          <span className="font-medium text-gray-900">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Upcoming Tasks & Project Status */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Upcoming Tasks */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
                <Link href="/projects/tasks" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              {stats.upcomingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No upcoming tasks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.upcomingTasks.map((task) => {
                    const isOverdue = task.due_date && task.due_date < new Date().toISOString().split('T')[0]
                    return (
                      <div key={task.id} className={`p-3 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{task.title}</p>
                            <p className="text-sm text-gray-500">{task.project?.name || 'Unknown Project'}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[task.priority] || 'bg-gray-100 text-gray-800'}`}>
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex items-center mt-2 text-xs text-gray-500">
                          <CalendarDaysIcon className="h-4 w-4 mr-1" />
                          {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                          {isOverdue && <span className="ml-2 text-red-600 font-medium">Overdue</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Project Status Overview */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Project Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-200 rounded-full">
                      <ClockIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="text-gray-700">Planning</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-600">{stats.planningProjects}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <PlayCircleIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="text-gray-700">Active</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.activeProjects}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-full">
                      <PauseCircleIcon className="h-5 w-5 text-yellow-600" />
                    </div>
                    <span className="text-gray-700">On Hold</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">{stats.onHoldProjects}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-gray-700">Completed</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{stats.completedProjects}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </RoleGuard>
  )
}
