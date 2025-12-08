import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getProjects() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) return []

  // Fetch projects in the same organization
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }

  return projects || []
}

async function getProjectStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      activeProjects: 0,
      onHoldProjects: 0,
      completedProjects: 0,
      overdueTasks: 0,
    }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      activeProjects: 0,
      onHoldProjects: 0,
      completedProjects: 0,
      overdueTasks: 0,
    }
  }

  const orgId = profile.organization_id

  // Fetch project counts by status
  const { count: activeProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  const { count: onHoldProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'on_hold')

  const { count: completedProjects } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'completed')

  // Fetch overdue tasks (tasks with due_date in the past and status not completed)
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('organization_id', orgId)

  const projectIds = projects?.map(p => p.id) || []
  
  const today = new Date().toISOString().split('T')[0]
  let overdueTasks = 0
  if (projectIds.length > 0) {
    const { data: tasks } = await supabase
      .from('project_tasks')
      .select('id, status')
      .in('project_id', projectIds)
      .lt('due_date', today)
    
    // Filter out completed tasks
    overdueTasks = tasks?.filter(t => t.status !== 'completed').length || 0
  }

  return {
    activeProjects: activeProjects || 0,
    onHoldProjects: onHoldProjects || 0,
    completedProjects: completedProjects || 0,
    overdueTasks: overdueTasks || 0,
  }
}

export default async function ProjectsPage() {
  const projects = await getProjects()
  const stats = await getProjectStats()

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'project_manager', 'site_engineer', 'executive']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage construction and development projects
              </p>
            </div>
            <Link href="/projects/new">
              <Button>New Project</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Active Projects</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.activeProjects}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">On Hold</p>
                <p className="mt-2 text-3xl font-semibold text-yellow-600">{stats.onHoldProjects}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="mt-2 text-3xl font-semibold text-green-600">{stats.completedProjects}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">{stats.overdueTasks}</p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search projects..."
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Project Code</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Progress</TableHeader>
                  <TableHeader>Budget vs Actual</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No projects found. <Link href="/projects/new" className="text-indigo-600 hover:text-indigo-500">Create your first project</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => {
                    const budget = project.budget != null ? Number(project.budget) : null
                    const actual = project.actual_cost != null ? Number(project.actual_cost) : null
                    const progress = project.progress_percentage != null ? Number(project.progress_percentage) : 0
                    
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.project_code}</TableCell>
                        <TableCell>{project.name}</TableCell>
                        <TableCell className="capitalize">{project.project_type || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status || 'planning'] || statusColors.planning}`}>
                            {project.status || 'planning'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-gray-600">Budget: {formatCurrency(budget)}</div>
                            {actual !== null && (
                              <div className="text-gray-500">Actual: {formatCurrency(actual)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-500 text-sm">
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}



