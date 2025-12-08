'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline'

interface LeaveType {
  id: string
  name: string
  code: string
  max_days_per_year: number | null
  is_paid: boolean
}

interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  status: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  employee_number: string
}

interface LeaveBalance {
  leave_type_id: string
  allocated_days: number
  used_days: number
  pending_days: number
  available: number
}

export default function EditLeaveRequestPage() {
  const router = useRouter()
  const params = useParams()
  const requestId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null)
  const [daysRequested, setDaysRequested] = useState<number>(0)
  const [originalDays, setOriginalDays] = useState<number>(0)
  const [originalStatus, setOriginalStatus] = useState<string>('')
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    status: 'pending',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [requestId])

  useEffect(() => {
    // Calculate days when dates change
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      if (end >= start) {
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
        setDaysRequested(diffDays)
      } else {
        setDaysRequested(0)
      }
    } else {
      setDaysRequested(0)
    }
  }, [formData.start_date, formData.end_date])

  useEffect(() => {
    // Update selected balance when leave type changes
    if (employee && formData.leave_type_id) {
      fetchLeaveBalance(employee.id, formData.leave_type_id)
    } else {
      setSelectedBalance(null)
    }
  }, [employee, formData.leave_type_id])

  async function fetchData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Get user's organization
    const { data: profileData } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    const profile = profileData as { organization_id: string } | null
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    // Fetch the leave request
    const { data: requestData } = await (supabase
      .from('leave_requests') as any)
      .select(`
        *,
        employee:employees(id, first_name, last_name, employee_number)
      `)
      .eq('id', requestId)
      .single()

    if (!requestData) {
      alert('Leave request not found')
      router.push('/hr/leave')
      return
    }

    const request = requestData as LeaveRequest & { employee: Employee }
    setEmployee(request.employee)
    setOriginalDays(request.days_requested)
    setOriginalStatus(request.status)
    setFormData({
      leave_type_id: request.leave_type_id,
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason || '',
      status: request.status,
    })

    // Fetch leave types
    const { data: leaveTypesData } = await (supabase
      .from('leave_types') as any)
      .select('*')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .order('name')

    setLeaveTypes(leaveTypesData || [])
    setLoading(false)
  }

  async function fetchLeaveBalance(employeeId: string, leaveTypeId: string) {
    const currentYear = new Date().getFullYear()
    
    const { data: balanceData } = await (supabase
      .from('leave_balances') as any)
      .select('*')
      .eq('employee_id', employeeId)
      .eq('leave_type_id', leaveTypeId)
      .eq('year', currentYear)
      .single()

    interface BalanceRecord {
      leave_type_id: string
      allocated_days: number
      carried_forward_days: number
      used_days: number
      pending_days: number
    }
    const data = balanceData as BalanceRecord | null

    if (data) {
      // Calculate available days considering the original request
      let adjustedUsed = data.used_days || 0
      let adjustedPending = data.pending_days || 0
      
      // If original was approved, add back to available (subtract from used)
      if (originalStatus === 'approved') {
        adjustedUsed = Math.max(0, adjustedUsed - originalDays)
      }
      // If original was pending, add back to available (subtract from pending)
      else if (originalStatus === 'pending') {
        adjustedPending = Math.max(0, adjustedPending - originalDays)
      }
      
      const available = (data.allocated_days || 0) + (data.carried_forward_days || 0) - adjustedUsed - adjustedPending
      setSelectedBalance({
        leave_type_id: data.leave_type_id,
        allocated_days: data.allocated_days || 0,
        used_days: adjustedUsed,
        pending_days: adjustedPending,
        available: available,
      })
    } else {
      const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId)
      setSelectedBalance({
        leave_type_id: leaveTypeId,
        allocated_days: leaveType?.max_days_per_year || 0,
        used_days: 0,
        pending_days: 0,
        available: leaveType?.max_days_per_year || 0,
      })
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {}

    if (!formData.leave_type_id) {
      newErrors.leave_type_id = 'Please select a leave type'
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Please select a start date'
    }
    if (!formData.end_date) {
      newErrors.end_date = 'Please select an end date'
    }
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      if (end < start) {
        newErrors.end_date = 'End date cannot be before start date'
      }
    }
    // Only validate balance for pending/approved status
    if ((formData.status === 'pending' || formData.status === 'approved') && 
        selectedBalance && daysRequested > selectedBalance.available) {
      newErrors.days = `Insufficient leave balance. Available: ${selectedBalance.available} days`
    }
    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for the leave request'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm() || !employee) {
      return
    }

    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    
    // Get app_users.id for approved_by foreign key
    const { data: appUserData } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', user?.id || '')
      .single()
    
    const appUser = appUserData as { id: string } | null

    // Prepare update data
    const updateData: Record<string, any> = {
      leave_type_id: formData.leave_type_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      days_requested: daysRequested,
      reason: formData.reason,
      status: formData.status,
    }

    // If status changed, update approved_by and approved_at
    if (formData.status !== originalStatus) {
      if (formData.status === 'approved' || formData.status === 'rejected') {
        updateData.approved_by = appUser?.id
        updateData.approved_at = new Date().toISOString()
      } else if (formData.status === 'pending') {
        updateData.approved_by = null
        updateData.approved_at = null
        updateData.rejection_reason = null
      }
    }

    // Update the leave request
    const { error } = await (supabase
      .from('leave_requests') as any)
      .update(updateData)
      .eq('id', requestId)

    if (error) {
      setSubmitting(false)
      alert('Error updating leave request: ' + error.message)
      return
    }

    // Update leave balance based on status changes
    const currentYear = new Date().getFullYear()
    const { data: currentBalanceData } = await (supabase
      .from('leave_balances') as any)
      .select('*')
      .eq('employee_id', employee.id)
      .eq('leave_type_id', formData.leave_type_id)
      .eq('year', currentYear)
      .single()

    interface BalanceRecord {
      id: string
      allocated_days: number
      used_days: number
      pending_days: number
      carried_forward_days: number
    }
    const currentBalance = currentBalanceData as BalanceRecord | null

    if (currentBalance) {
      let newUsedDays = currentBalance.used_days || 0
      let newPendingDays = currentBalance.pending_days || 0

      // Remove old days from appropriate bucket
      if (originalStatus === 'approved') {
        newUsedDays = Math.max(0, newUsedDays - originalDays)
      } else if (originalStatus === 'pending') {
        newPendingDays = Math.max(0, newPendingDays - originalDays)
      }

      // Add new days to appropriate bucket
      if (formData.status === 'approved') {
        newUsedDays += daysRequested
      } else if (formData.status === 'pending') {
        newPendingDays += daysRequested
      }
      // If rejected or cancelled, don't add to any bucket

      await (supabase
        .from('leave_balances') as any)
        .update({
          used_days: newUsedDays,
          pending_days: newPendingDays,
        })
        .eq('id', currentBalance.id)
    }

    router.push('/hr/leave')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )
  }

  const selectedLeaveType = leaveTypes.find(lt => lt.id === formData.leave_type_id)

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ]

  return (
    <RoleGuard allowedRoles={['super_admin', 'hr_manager', 'employee']}>
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link href="/hr/leave" className="text-gray-500 hover:text-gray-700">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Leave Request</h1>
              <p className="text-sm text-gray-500">
                Update the leave request details
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Info (Read-only) */}
            <Card title="Employee Information">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium text-gray-900">
                  {employee?.first_name} {employee?.last_name}
                </p>
                <p className="text-sm text-gray-500">{employee?.employee_number}</p>
              </div>
            </Card>

            {/* Status */}
            <Card title="Request Status">
              <div className="space-y-4">
                <FormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </FormSelect>
                
                {formData.status !== originalStatus && (
                  <div className="flex items-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-700">
                      Status will change from{' '}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusOptions.find(s => s.value === originalStatus)?.color
                      }`}>
                        {originalStatus}
                      </span>
                      {' '}to{' '}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        statusOptions.find(s => s.value === formData.status)?.color
                      }`}>
                        {formData.status}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Leave Details */}
            <Card title="Leave Details">
              <div className="space-y-4">
                <FormSelect
                  label="Leave Type"
                  value={formData.leave_type_id}
                  onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                  error={errors.leave_type_id}
                  required
                >
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.is_paid ? '(Paid)' : '(Unpaid)'}
                    </option>
                  ))}
                </FormSelect>

                {/* Leave Balance Info */}
                {selectedBalance && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Leave Balance</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600">Allocated</p>
                        <p className="font-semibold text-blue-900">{selectedBalance.allocated_days} days</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Used</p>
                        <p className="font-semibold text-blue-900">{selectedBalance.used_days} days</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Available</p>
                        <p className="font-semibold text-blue-900">{selectedBalance.available} days</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Start Date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    error={errors.start_date}
                    required
                  />
                  <FormInput
                    label="End Date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    error={errors.end_date}
                    min={formData.start_date}
                    required
                  />
                </div>

                {/* Days Calculation */}
                {daysRequested > 0 && (
                  <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                    (formData.status === 'pending' || formData.status === 'approved') && 
                    selectedBalance && daysRequested > selectedBalance.available
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <ClockIcon className={`h-5 w-5 ${
                      (formData.status === 'pending' || formData.status === 'approved') && 
                      selectedBalance && daysRequested > selectedBalance.available
                        ? 'text-red-500'
                        : 'text-green-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      (formData.status === 'pending' || formData.status === 'approved') && 
                      selectedBalance && daysRequested > selectedBalance.available
                        ? 'text-red-700'
                        : 'text-green-700'
                    }`}>
                      {daysRequested} day(s) requested
                      {originalDays !== daysRequested && (
                        <span className="ml-2 text-xs">
                          (was {originalDays} day(s))
                        </span>
                      )}
                      {(formData.status === 'pending' || formData.status === 'approved') && 
                       selectedBalance && daysRequested > selectedBalance.available && (
                        <span className="block text-xs mt-1">
                          Exceeds available balance by {daysRequested - selectedBalance.available} day(s)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {errors.days && (
                  <p className="text-sm text-red-600">{errors.days}</p>
                )}
              </div>
            </Card>

            {/* Reason */}
            <Card title="Reason for Leave">
              <FormTextarea
                label="Reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                error={errors.reason}
                placeholder="Please provide a reason for your leave request..."
                rows={4}
                required
              />
            </Card>

            {/* Leave Type Info */}
            {selectedLeaveType && (
              <Card title="Leave Type Information">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Type</p>
                    <p className="font-medium">{selectedLeaveType.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Paid Leave</p>
                    <p className="font-medium">{selectedLeaveType.is_paid ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Max Days/Year</p>
                    <p className="font-medium">{selectedLeaveType.max_days_per_year || 'Unlimited'}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Link href="/hr/leave">
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={submitting || (
                  (formData.status === 'pending' || formData.status === 'approved') && 
                  selectedBalance !== null && 
                  daysRequested > selectedBalance.available
                )}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </RoleGuard>
  )
}
