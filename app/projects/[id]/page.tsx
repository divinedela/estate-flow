import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

async function getProject(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) return null

  // Fetch project with related data
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_manager:app_users!projects_project_manager_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error || !project) return null

  return project
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await getProject(id)

  if (!project) {
    notFound()
  }

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

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const budget = project.budget != null ? Number(project.budget) : null
  const actual = project.actual_cost != null ? Number(project.actual_cost) : null
  const progress = project.progress_percentage != null ? Number(project.progress_percentage) : 0
  const projectManager = project.project_manager as any

  return (
    <RoleGuard allowedRoles={['super_admin', 'project_manager', 'site_engineer', 'executive']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Project Code: {project.project_code}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
            </div>
          </div>

          {/* Status and Priority Badges */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${statusColors[project.status || 'planning'] || statusColors.planning}`}>
                {project.status || 'planning'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Priority:</span>
              <span className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${priorityColors[project.priority || 'medium'] || priorityColors.medium}`}>
                {project.priority || 'medium'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Progress:</span>
              <span className="ml-2 text-sm font-semibold text-gray-900">{progress}%</span>
            </div>
          </div>

          {/* Progress Bar */}
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Project Progress</span>
                <span className="text-sm font-semibold text-gray-900">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Project Information */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Project Type</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{project.project_type || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Project Manager</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {projectManager?.full_name || projectManager?.email || 'Not assigned'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(project.start_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">End Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(project.end_date)}</dd>
                    </div>
                    {project.actual_start_date && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Actual Start Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(project.actual_start_date)}</dd>
                      </div>
                    )}
                    {project.actual_end_date && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Actual End Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(project.actual_end_date)}</dd>
                      </div>
                    )}
                    {project.location && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Location</dt>
                        <dd className="mt-1 text-sm text-gray-900">{project.location}</dd>
                      </div>
                    )}
                    {project.address && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Address</dt>
                        <dd className="mt-1 text-sm text-gray-900">{project.address}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>

              {/* Description */}
              {project.description && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.description}</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Financial & Quick Stats */}
            <div className="space-y-6">
              {/* Budget Information */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget & Costs</h2>
                  <div className="space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Budget</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(budget)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Actual Cost</dt>
                      <dd className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(actual)}</dd>
                    </div>
                    {budget && actual && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Variance</dt>
                        <dd className={`mt-1 text-lg font-semibold ${actual > budget ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(actual - budget)}
                        </dd>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Quick Actions */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="space-y-2">
                    <Link href={`/projects/${project.id}/tasks`} className="block">
                      <Button variant="secondary" className="w-full justify-start">
                        View Tasks
                      </Button>
                    </Link>
                    <Link href={`/projects/${project.id}/phases`} className="block">
                      <Button variant="secondary" className="w-full justify-start">
                        View Phases
                      </Button>
                    </Link>
                    <Link href={`/projects/${project.id}/team`} className="block">
                      <Button variant="secondary" className="w-full justify-start">
                        View Team
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              {/* Project Metadata */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(project.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(project.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </RoleGuard>
  )
}

