'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

type AppUser = Database['public']['Tables']['app_users']['Row']

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projectManagers, setProjectManagers] = useState<AppUser[]>([])
  const [formData, setFormData] = useState({
    project_code: '',
    name: '',
    description: '',
    project_type: 'construction',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    budget: '',
    location: '',
    address: '',
    latitude: '',
    longitude: '',
    project_manager_id: '',
  })

  // Fetch project managers (users with project_manager role or super_admin)
  useEffect(() => {
    async function fetchProjectManagers() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('app_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Get all users in the organization who can be project managers
      const { data: users } = await supabase
        .from('app_users')
        .select('id, full_name, email')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('full_name')

      if (users) {
        setProjectManagers(users as AppUser[])
      }
    }

    fetchProjectManagers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('app_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!profile || !('organization_id' in profile)) throw new Error('User profile not found')

      const orgId = (profile as { organization_id: string | null }).organization_id
      if (!orgId) throw new Error('User organization not found')

      const insertData: any = {
        project_code: formData.project_code,
        name: formData.name,
        description: formData.description || null,
        project_type: formData.project_type || null,
        status: formData.status,
        priority: formData.priority,
        organization_id: orgId,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        location: formData.location || null,
        address: formData.address || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        project_manager_id: formData.project_manager_id || null,
      }

      const { error } = await supabase
        .from('projects')
        .insert(insertData)

      if (error) throw error

      router.push('/projects')
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'project_manager']}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/projects">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
              <p className="mt-1 text-sm text-gray-500">
                Enter project information to get started
              </p>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="Project Code"
                  required
                  value={formData.project_code}
                  onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                  placeholder="e.g., PROJ-2024-001"
                />
                <FormInput
                  label="Project Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Luxury Apartment Complex"
                />
                <FormSelect
                  label="Project Type"
                  value={formData.project_type}
                  onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                  options={[
                    { value: 'construction', label: 'Construction' },
                    { value: 'development', label: 'Development' },
                    { value: 'renovation', label: 'Renovation' },
                    { value: 'infrastructure', label: 'Infrastructure' },
                    { value: 'maintenance', label: 'Maintenance' },
                  ]}
                />
                <FormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'planning', label: 'Planning' },
                    { value: 'active', label: 'Active' },
                    { value: 'on_hold', label: 'On Hold' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
                <FormSelect
                  label="Priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'urgent', label: 'Urgent' },
                  ]}
                />
                <FormSelect
                  label="Project Manager"
                  value={formData.project_manager_id}
                  onChange={(e) => setFormData({ ...formData, project_manager_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Project Manager' },
                    ...projectManagers.map((user) => ({
                      value: user.id,
                      label: user.full_name || user.email || 'Unknown',
                    })),
                  ]}
                />
                <FormInput
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <FormInput
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
                <FormInput
                  label="Budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0.00"
                />
                <FormInput
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Downtown District"
                />
              </div>
              
              <FormTextarea
                label="Description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description and objectives..."
              />

              <FormTextarea
                label="Address"
                rows={3}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full project address..."
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="Latitude (Optional)"
                  type="number"
                  step="0.00000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 5.6037"
                />
                <FormInput
                  label="Longitude (Optional)"
                  type="number"
                  step="0.00000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., -0.1870"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </RoleGuard>
  )
}

