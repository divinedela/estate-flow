import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  CurrencyDollarIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FolderIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'

interface ProjectBudget {
  id: string
  project_code: string
  name: string
  status: string
  budget: number | null
  actual_cost: number | null
  variance: number
  variance_percentage: number
  progress_percentage: number | null
}

async function getProjectBudgets() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      projects: [] as ProjectBudget[],
      totalBudget: 0,
      totalActualCost: 0,
      totalVariance: 0,
      onBudgetCount: 0,
      overBudgetCount: 0,
    }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      projects: [] as ProjectBudget[],
      totalBudget: 0,
      totalActualCost: 0,
      totalVariance: 0,
      onBudgetCount: 0,
      overBudgetCount: 0,
    }
  }

  // Fetch all projects with budget data
  const { data: allProjects } = await supabase
    .from('projects')
    .select('id, project_code, name, status, budget, actual_cost, progress_percentage')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  const projects = (allProjects || []).map((project: any) => {
    const budget = Number(project.budget) || 0
    const actualCost = Number(project.actual_cost) || 0
    const variance = budget - actualCost
    const variancePercentage = budget > 0 ? (variance / budget) * 100 : 0

    return {
      id: project.id,
      project_code: project.project_code,
      name: project.name,
      status: project.status,
      budget,
      actual_cost: actualCost,
      variance,
      variance_percentage: variancePercentage,
      progress_percentage: Number(project.progress_percentage) || 0,
    }
  }) as ProjectBudget[]

  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0)
  const totalActualCost = projects.reduce((sum, p) => sum + p.actual_cost, 0)
  const totalVariance = totalBudget - totalActualCost
  const onBudgetCount = projects.filter(p => p.variance >= 0).length
  const overBudgetCount = projects.filter(p => p.variance < 0).length

  return {
    projects,
    totalBudget,
    totalActualCost,
    totalVariance,
    onBudgetCount,
    overBudgetCount,
  }
}

export default async function BudgetCostsPage() {
  const stats = await getProjectBudgets()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'project_manager', 'executive']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Budget & Costs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track project budgets and actual costs
            </p>
          </div>
          <Link href="/projects/budget/expenses/new">
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Expense
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Budget</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalBudget)}</p>
              </div>
              <div className="p-3 bg-green-400/30 rounded-lg">
                <CurrencyDollarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Actual Cost</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(stats.totalActualCost)}</p>
              </div>
              <div className="p-3 bg-blue-400/30 rounded-lg">
                <ChartBarIcon className="h-8 w-8" />
              </div>
            </div>
          </div>

          <div className={`bg-gradient-to-br ${stats.totalVariance >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} rounded-xl shadow-lg p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`${stats.totalVariance >= 0 ? 'text-emerald-100' : 'text-red-100'} text-sm font-medium`}>Variance</p>
                <p className="text-3xl font-bold mt-2">{formatCurrency(Math.abs(stats.totalVariance))}</p>
                <p className={`${stats.totalVariance >= 0 ? 'text-emerald-100' : 'text-red-100'} text-xs mt-1`}>
                  {stats.totalVariance >= 0 ? 'Under budget' : 'Over budget'}
                </p>
              </div>
              <div className={`p-3 ${stats.totalVariance >= 0 ? 'bg-emerald-400/30' : 'bg-red-400/30'} rounded-lg`}>
                {stats.totalVariance >= 0 ? (
                  <ArrowTrendingDownIcon className="h-8 w-8" />
                ) : (
                  <ArrowTrendingUpIcon className="h-8 w-8" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Budget Status</p>
                <p className="text-3xl font-bold mt-2">{stats.onBudgetCount}</p>
                <p className="text-indigo-100 text-xs mt-1">
                  {stats.overBudgetCount} over budget
                </p>
              </div>
              <div className="p-3 bg-indigo-400/30 rounded-lg">
                <CheckCircleIcon className="h-8 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Budget Overview Chart */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Budget vs Actual by Project</h3>
            </div>
            <div className="space-y-4">
              {stats.projects.slice(0, 5).map((project) => {
                const budgetPercentage = stats.totalBudget > 0 ? (project.budget / stats.totalBudget) * 100 : 0
                const actualPercentage = stats.totalBudget > 0 ? (project.actual_cost / stats.totalBudget) * 100 : 0
                return (
                  <div key={project.id}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium text-gray-900">{project.name}</span>
                      <span className="text-gray-500">{project.project_code}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500">Budget</span>
                        <span className="font-medium text-gray-900">{formatCurrency(project.budget)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs mb-1 mt-2">
                        <span className="text-gray-500">Actual</span>
                        <span className="font-medium text-gray-900">{formatCurrency(project.actual_cost)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${project.variance >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(actualPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Budget Health</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gray-700">On Budget</span>
                </div>
                <span className="text-2xl font-bold text-green-600">{stats.onBudgetCount}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <span className="text-gray-700">Over Budget</span>
                </div>
                <span className="text-2xl font-bold text-red-600">{stats.overBudgetCount}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Projects Budget Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">All Projects</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Project</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Budget</TableHeader>
                  <TableHeader>Actual Cost</TableHeader>
                  <TableHeader>Variance</TableHeader>
                  <TableHeader>Progress</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating your first project.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.projects.map((project) => (
                    <TableRow key={project.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{project.name}</p>
                          <p className="text-xs text-gray-500">{project.project_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                          {project.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.budget)}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {formatCurrency(project.actual_cost)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {project.variance >= 0 ? (
                            <ArrowTrendingDownIcon className="h-4 w-4 mr-1 text-green-500" />
                          ) : (
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-1 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${project.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(Math.abs(project.variance))}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {project.variance_percentage >= 0 ? '+' : ''}{project.variance_percentage.toFixed(1)}%
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full"
                              style={{ width: `${project.progress_percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{project.progress_percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <Link href={`/projects/${project.id}`} className="text-indigo-600 hover:text-indigo-900">
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
