'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { Modal } from '@/components/ui/modal'
import { FormTextarea } from '@/components/ui/form-textarea'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  CalendarIcon, 
  CheckIcon, 
  XMarkIcon, 
  EyeIcon,
  ClockIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  PencilIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

interface LeaveRequest {
  id: string
  employee_id: string
  employee_name: string
  employee_number: string
  leave_type_id: string
  leave_type_name: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  status: string
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
}

interface LeaveBalance {
  id: string
  employee_id: string
  leave_type_id: string
  year: number
  allocated_days: number
  used_days: number
  pending_days: number
  carried_forward_days: number
}

interface LeaveRequestRaw {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  days_requested: number
  reason: string | null
  status: string
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
  employee: {
    first_name: string
    last_name: string
    employee_number: string
    organization_id: string
  } | null
  leave_type: {
    name: string
  } | null
}

export default function LeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [userRole, setUserRole] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserRole()
    fetchLeaveRequests()
  }, [])

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: appUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!appUser) return

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', appUser.id)

    const roles = userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || []

    if (roles.includes('super_admin')) setUserRole('super_admin')
    else if (roles.includes('executive')) setUserRole('executive')
    else if (roles.includes('hr_manager')) setUserRole('hr_manager')
  }

  async function fetchLeaveRequests() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

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

    // Fetch leave requests with employee and leave type info
    const { data } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(first_name, last_name, employee_number, organization_id),
        leave_type:leave_types(name)
      `)
      .order('created_at', { ascending: false })

    // Filter by organization and map data
    const rawData = data as LeaveRequestRaw[] | null
    const filteredData = (rawData || [])
      .filter(req => req.employee?.organization_id === profile.organization_id)
      .map(req => ({
        id: req.id,
        employee_id: req.employee_id,
        leave_type_id: req.leave_type_id,
        start_date: req.start_date,
        end_date: req.end_date,
        days_requested: req.days_requested,
        reason: req.reason,
        status: req.status,
        approved_by: req.approved_by,
        approved_at: req.approved_at,
        rejection_reason: req.rejection_reason,
        created_at: req.created_at,
        employee_name: `${req.employee?.first_name} ${req.employee?.last_name}`,
        employee_number: req.employee?.employee_number || '',
        leave_type_name: req.leave_type?.name || '',
      }))

    setRequests(filteredData)
    setLoading(false)
  }

  async function handleApprove(request: LeaveRequest) {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get app_users.id for approved_by foreign key
    const { data: appUserData } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', user?.id || '')
      .single()
    
    const appUser = appUserData as { id: string } | null
    
    // Update request status
    const { error } = await (supabase
      .from('leave_requests') as any)
      .update({
        status: 'approved',
        approved_by: appUser?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', request.id)
    
    if (error) {
      console.error('Error approving leave request:', error)
      alert('Error approving leave request: ' + error.message)
      return
    }

    // Update leave balance - move from pending to used
    const currentYear = new Date().getFullYear()
    const { data: balanceData } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', request.employee_id)
      .eq('leave_type_id', request.leave_type_id)
      .eq('year', currentYear)
      .single()

    const balance = balanceData as LeaveBalance | null
    if (balance) {
      await (supabase
        .from('leave_balances') as any)
        .update({
          used_days: (balance.used_days || 0) + request.days_requested,
          pending_days: Math.max(0, (balance.pending_days || 0) - request.days_requested),
        })
        .eq('id', balance.id)
    }

    fetchLeaveRequests()
  }

  async function handleReject(request: LeaveRequest) {
    setSelectedRequest(request)
    setRejectionReason('')
    setIsRejectModalOpen(true)
  }

  async function confirmReject() {
    if (!selectedRequest) return

    const { data: { user } } = await supabase.auth.getUser()
    
    // Get app_users.id for approved_by foreign key
    const { data: appUserData } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', user?.id || '')
      .single()
    
    const appUser = appUserData as { id: string } | null
    
    // Update request status
    const { error } = await (supabase
      .from('leave_requests') as any)
      .update({
        status: 'rejected',
        approved_by: appUser?.id,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq('id', selectedRequest.id)
    
    if (error) {
      console.error('Error rejecting leave request:', error)
      alert('Error rejecting leave request: ' + error.message)
      return
    }

    // Update leave balance - remove from pending
    const currentYear = new Date().getFullYear()
    const { data: rejectBalanceData } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', selectedRequest.employee_id)
      .eq('leave_type_id', selectedRequest.leave_type_id)
      .eq('year', currentYear)
      .single()

    const rejectBalance = rejectBalanceData as LeaveBalance | null
    if (rejectBalance) {
      await (supabase
        .from('leave_balances') as any)
        .update({
          pending_days: Math.max(0, (rejectBalance.pending_days || 0) - selectedRequest.days_requested),
        })
        .eq('id', rejectBalance.id)
    }

    setIsRejectModalOpen(false)
    setSelectedRequest(null)
    fetchLeaveRequests()
  }

  function viewRequest(request: LeaveRequest) {
    setSelectedRequest(request)
    setIsViewModalOpen(true)
  }

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.employee_number?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  // Calculate stats
  const today = new Date()
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approvedThisMonth: requests.filter(r => {
      if (r.status !== 'approved') return false
      const approvedDate = r.approved_at ? new Date(r.approved_at) : null
      return approvedDate && 
        approvedDate.getMonth() === today.getMonth() && 
        approvedDate.getFullYear() === today.getFullYear()
    }).length,
    onLeaveToday: requests.filter(r => {
      if (r.status !== 'approved') return false
      const start = new Date(r.start_date)
      const end = new Date(r.end_date)
      return today >= start && today <= end
    }).length,
  }

  const showBackButton = userRole === 'super_admin' || userRole === 'executive'

  return (
    <RoleGuard allowedRoles={['super_admin', 'hr_manager', 'executive']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {showBackButton && (
                <Link href="/hr" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeftIcon className="h-5 w-5" />
                </Link>
              )}
              <div>
                {showBackButton && (
                  <div className="flex items-center space-x-2 mb-1">
                    <Link href="/hr" className="text-sm text-indigo-600 hover:text-indigo-500">HR</Link>
                    <span className="text-gray-400">/</span>
                    <span className="text-sm text-gray-500">Leave Management</span>
                  </div>
                )}
                <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage employee leave requests and approvals
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/hr/leave/types">
                <Button variant="secondary">
                  <Cog6ToothIcon className="h-5 w-5 mr-2" />
                  Leave Types
                </Button>
              </Link>
              <Link href="/hr/leave/request">
                <Button>
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Request Leave
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <Card>
              <div className="text-center">
                <ClockIcon className="h-8 w-8 text-yellow-500 mx-auto" />
                <p className="text-sm font-medium text-gray-500 mt-2">Pending Requests</p>
                <p className="mt-1 text-3xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <CheckIcon className="h-8 w-8 text-green-500 mx-auto" />
                <p className="text-sm font-medium text-gray-500 mt-2">Approved This Month</p>
                <p className="mt-1 text-3xl font-semibold text-green-600">{stats.approvedThisMonth}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <UserGroupIcon className="h-8 w-8 text-blue-500 mx-auto" />
                <p className="text-sm font-medium text-gray-500 mt-2">On Leave Today</p>
                <p className="mt-1 text-3xl font-semibold text-blue-600">{stats.onLeaveToday}</p>
              </div>
            </Card>
          </div>

          {/* Leave Requests Table */}
          <Card title="Leave Requests">
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by employee name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading leave requests...</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Employee</TableHeader>
                    <TableHeader>Leave Type</TableHeader>
                    <TableHeader>Start Date</TableHeader>
                    <TableHeader>End Date</TableHeader>
                    <TableHeader>Days</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No leave requests found.{' '}
                        <Link href="/hr/leave/request" className="text-indigo-600 hover:text-indigo-500">
                          Create a new request
                        </Link>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{request.employee_name}</p>
                            <p className="text-sm text-gray-500">{request.employee_number}</p>
                          </div>
                        </TableCell>
                        <TableCell>{request.leave_type_name}</TableCell>
                        <TableCell>{new Date(request.start_date).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(request.end_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <span className="font-medium">{request.days_requested}</span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
                            {request.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewRequest(request)}
                              className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <Link
                              href={`/hr/leave/${request.id}/edit`}
                              className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                              title="Edit Request"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </Link>
                            {request.status !== 'approved' && (
                              <button
                                onClick={() => handleApprove(request)}
                                className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                title="Approve"
                              >
                                <CheckIcon className="h-5 w-5" />
                              </button>
                            )}
                            {request.status !== 'rejected' && (
                              <button
                                onClick={() => handleReject(request)}
                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                title="Reject"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* View Request Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Leave Request Details"
          size="lg"
        >
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium">{selectedRequest.employee_name}</p>
                  <p className="text-sm text-gray-500">{selectedRequest.employee_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leave Type</p>
                  <p className="font-medium">{selectedRequest.leave_type_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{new Date(selectedRequest.start_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{new Date(selectedRequest.end_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Days Requested</p>
                  <p className="font-medium">{selectedRequest.days_requested} day(s)</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedRequest.status]}`}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Reason</p>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
                  {selectedRequest.reason || 'No reason provided'}
                </p>
              </div>

              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div>
                  <p className="text-sm text-gray-500">Rejection Reason</p>
                  <p className="mt-1 p-3 bg-red-50 rounded-lg text-red-700">
                    {selectedRequest.rejection_reason}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Submitted On</p>
                <p className="font-medium">{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>

              {selectedRequest.approved_at && (
                <div>
                  <p className="text-sm text-gray-500">
                    {selectedRequest.status === 'approved' ? 'Approved On' : 'Rejected On'}
                  </p>
                  <p className="font-medium">{new Date(selectedRequest.approved_at).toLocaleString()}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button 
                      variant="danger" 
                      onClick={() => {
                        setIsViewModalOpen(false)
                        handleReject(selectedRequest)
                      }}
                    >
                      Reject
                    </Button>
                    <Button 
                      onClick={() => {
                        handleApprove(selectedRequest)
                        setIsViewModalOpen(false)
                      }}
                    >
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* Reject Modal */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Leave Request"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to reject this leave request from{' '}
              <strong>{selectedRequest?.employee_name}</strong>?
            </p>
            <FormTextarea
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={3}
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmReject}>
                Reject Request
              </Button>
            </div>
          </div>
        </Modal>
      </RoleGuard>
  )
}
