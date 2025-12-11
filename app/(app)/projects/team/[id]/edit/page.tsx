'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import {
  PencilIcon,
  XMarkIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'

interface FormData {
  full_name: string
  email: string
  phone: string
  role: string
}

interface FormErrors {
  full_name?: string
  email?: string
  phone?: string
  role?: string
  submit?: string
}

export default function EditTeamMemberPage() {
  const router = useRouter()
  const params = useParams()
  const memberId = params.id as string

  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [errors, setErrors] = useState<FormErrors>({})
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    phone: '',
    role: 'team_member',
  })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadMemberData()
  }, [memberId])

  const loadMemberData = async () => {
    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('app_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Fetch team member details
      const { data: member } = await supabase
        .from('app_users')
        .select(`
          id,
          full_name,
          email,
          phone,
          user_roles!inner(
            role:roles(name)
          )
        `)
        .eq('id', memberId)
        .eq('organization_id', profile.organization_id)
        .single()

      if (member) {
        const roles = member.user_roles?.map((ur: any) => ur.role?.name).filter(Boolean) || []
        const projectRole = roles.find((r: string) =>
          ['project_manager', 'site_engineer'].includes(r)
        ) || 'team_member'

        setFormData({
          full_name: member.full_name || '',
          email: member.email || '',
          phone: member.phone || '',
          role: projectRole,
        })
      }
    } catch (error) {
      console.error('Error loading member data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const supabase = createClient()

      // Update app user details
      const { error: userError } = await supabase
        .from('app_users')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
        })
        .eq('id', memberId)

      if (userError) throw userError

      // Update role if changed
      // First, get current role assignment
      const { data: currentRoles } = await supabase
        .from('user_roles')
        .select('id, role:roles(id, name)')
        .eq('user_id', memberId)

      if (currentRoles && currentRoles.length > 0) {
        const currentRole = currentRoles[0].role
        if (currentRole.name !== formData.role) {
          // Get new role ID
          const { data: newRole } = await supabase
            .from('roles')
            .select('id')
            .eq('name', formData.role)
            .single()

          if (newRole) {
            // Update role assignment
            const { error: roleError } = await supabase
              .from('user_roles')
              .update({ role_id: newRole.id })
              .eq('user_id', memberId)

            if (roleError) throw roleError
          }
        }
      }

      // Redirect back to member details page
      router.push(`/projects/team/${memberId}`)
      router.refresh()
    } catch (error: any) {
      console.error('Error updating team member:', error)
      setErrors({ submit: error.message || 'Failed to update team member' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Delete user roles first (foreign key constraint)
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberId)

      // Delete project assignments
      await supabase
        .from('project_team_members')
        .delete()
        .eq('user_id', memberId)

      // Delete the user
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      router.push('/projects/team')
      router.refresh()
    } catch (error: any) {
      console.error('Error deleting team member:', error)
      setErrors({ submit: error.message || 'Failed to delete team member' })
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Team Member</h1>
          <p className="mt-1 text-sm text-gray-500">
            Update team member information and role
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => router.push(`/projects/team/${memberId}`)}
        >
          <XMarkIcon className="h-5 w-5 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{errors.submit}</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.full_name
                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
                placeholder="John Doe"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.email
                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.phone
                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm ${
                  errors.role
                    ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              >
                <option value="team_member">Team Member</option>
                <option value="site_engineer">Site Engineer</option>
                <option value="project_manager">Project Manager</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-50 text-red-700 hover:bg-red-100"
              disabled={loading}
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              Delete Member
            </Button>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push(`/projects/team/${memberId}`)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Team Member</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this team member? This action cannot be undone.
              All project assignments will be removed.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
