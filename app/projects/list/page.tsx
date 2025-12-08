'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
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

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
    } else {
      setProjects(data || [])
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    const supabase = createClient()
    const { error } = await supabase.from('projects').delete().eq('id', id)

    if (error) {
      alert('Error deleting project: ' + error.message)
    } else {
      setProjects(projects.filter(p => p.id !== id))
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || project.status === statusFilter
    const matchesType = !typeFilter || project.project_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const projectTypes = [...new Set(projects.map(p => p.project_type).filter(Boolean))]

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
                <h1 className="text-2xl font-bold text-gray-900">All Projects</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage all construction and development projects
                </p>
              </div>
            </div>
            <Link href="/projects/new">
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                {projectTypes.map(type => (
                  <option key={type} value={type || ''}>{type}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Projects Table */}
          <Card>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading projects...</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Project Code</TableHeader>
                    <TableHeader>Name</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Progress</TableHeader>
                    <TableHeader>Budget</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        {searchTerm || statusFilter || typeFilter 
                          ? 'No projects match your filters' 
                          : 'No projects found. Create your first project.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => {
                      const progress = Number(project.progress_percentage) || 0
                      return (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.project_code}</TableCell>
                          <TableCell>{project.name}</TableCell>
                          <TableCell className="capitalize">{project.project_type || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}`}>
                              {project.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(project.budget)}</TableCell>
                          <TableCell>
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
                              <button
                                onClick={() => handleDelete(project.id)}
                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </RoleGuard>
  )
}

