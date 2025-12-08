'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

interface Employee {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  department: string | null
  position: string | null
  employment_type: string | null
  hire_date: string | null
  status: string
  salary: number | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
}

export default function EditEmployeePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    employee_number: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    employment_type: '',
    hire_date: '',
    status: 'active',
    salary: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: '',
  })

  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchEmployee()
    }
  }, [params.id])

  async function fetchEmployee() {
    setLoading(true)
    
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      router.push('/hr/employees')
      return
    }

    setFormData({
      employee_number: data.employee_number || '',
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone: data.phone || '',
      department: data.department || '',
      position: data.position || '',
      employment_type: data.employment_type || '',
      hire_date: data.hire_date || '',
      status: data.status || 'active',
      salary: data.salary?.toString() || '',
      address: data.address || '',
      emergency_contact_name: data.emergency_contact_name || '',
      emergency_contact_phone: data.emergency_contact_phone || '',
      notes: data.notes || '',
    })
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase
      .from('employees')
      .update({
        employee_number: formData.employee_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phone: formData.phone || null,
        department: formData.department || null,
        position: formData.position || null,
        employment_type: formData.employment_type || null,
        hire_date: formData.hire_date || null,
        status: formData.status,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        address: formData.address || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        notes: formData.notes || null,
      })
      .eq('id', params.id)

    setSaving(false)

    if (error) {
      alert('Error updating employee: ' + error.message)
      return
    }

    router.push(`/hr/employees/${params.id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )
  }

  const departments = ['Administration', 'Construction', 'Sales', 'Marketing', 'Finance', 'HR', 'IT', 'Operations']
  const employmentTypes = ['full_time', 'part_time', 'contract', 'intern']

  return (
    <RoleGuard allowedRoles={['super_admin', 'hr_manager']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href={`/hr/employees/${params.id}`} className="text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
              <p className="text-sm text-gray-500">
                Update employee information
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card title="Basic Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Employee Number"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  required
                />
                <FormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_leave">On Leave</option>
                  <option value="terminated">Terminated</option>
                </FormSelect>
                <FormInput
                  label="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
                <FormInput
                  label="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
                <FormInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <FormInput
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </Card>

            {/* Employment Details */}
            <Card title="Employment Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormSelect
                  label="Department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </FormSelect>
                <FormInput
                  label="Position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="e.g., Senior Engineer"
                />
                <FormSelect
                  label="Employment Type"
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                >
                  <option value="">Select Type</option>
                  {employmentTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </FormSelect>
                <FormInput
                  label="Hire Date"
                  type="date"
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                />
                <FormInput
                  label="Salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </Card>

            {/* Address */}
            <Card title="Address">
              <FormTextarea
                label="Full Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address, city, state, zip code"
                rows={2}
              />
            </Card>

            {/* Emergency Contact */}
            <Card title="Emergency Contact">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                  label="Contact Name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Full name"
                />
                <FormInput
                  label="Contact Phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
            </Card>

            {/* Notes */}
            <Card title="Notes">
              <FormTextarea
                label="Additional Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information about this employee..."
                rows={4}
              />
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Link href={`/hr/employees/${params.id}`}>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </RoleGuard>
  )
}

