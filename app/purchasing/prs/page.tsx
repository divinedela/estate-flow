'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { Modal } from '@/components/ui/modal'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  DocumentTextIcon, 
  PlusIcon, 
  EyeIcon, 
  CheckIcon, 
  XMarkIcon, 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

interface PurchaseRequisition {
  id: string
  pr_number: string
  title: string
  description: string | null
  requested_by: string | null
  requester_name?: string
  department: string | null
  project_id: string | null
  status: string
  priority: string
  total_amount: number | null
  required_date: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  notes: string | null
  created_at: string
}

interface Project {
  id: string
  name: string
}

export default function PurchaseRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [editingPR, setEditingPR] = useState<PurchaseRequisition | null>(null)
  const [viewingPR, setViewingPR] = useState<PurchaseRequisition | null>(null)
  const [rejectingPR, setRejectingPR] = useState<PurchaseRequisition | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    department: '',
    project_id: '',
    priority: 'medium',
    total_amount: '',
    required_date: '',
    notes: '',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single() as { data: { organization_id: string } | null }

    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    // Fetch PRs
    const { data: prsData } = await supabase
      .from('purchase_requisitions')
      .select(`
        *,
        requester:app_users!requested_by(full_name)
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    // Fetch projects for dropdown
    const { data: projectsData } = await supabase
      .from('projects')
      .select('id, name')
      .eq('organization_id', profile.organization_id)
      .order('name')

    setRequisitions((prsData as any[])?.map((pr: any) => ({
      ...pr,
      requester_name: pr.requester?.full_name
    })) || [])
    
    setProjects((projectsData as Project[]) || [])
    setLoading(false)
  }

  function openCreateModal() {
    setEditingPR(null)
    setFormData({
      title: '',
      description: '',
      department: '',
      project_id: '',
      priority: 'medium',
      total_amount: '',
      required_date: '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  function openEditModal(pr: PurchaseRequisition) {
    setEditingPR(pr)
    setFormData({
      title: pr.title,
      description: pr.description || '',
      department: pr.department || '',
      project_id: pr.project_id || '',
      priority: pr.priority,
      total_amount: pr.total_amount?.toString() || '',
      required_date: pr.required_date || '',
      notes: pr.notes || '',
    })
    setIsModalOpen(true)
  }

  function openViewModal(pr: PurchaseRequisition) {
    setViewingPR(pr)
    setIsViewModalOpen(true)
  }

  function openRejectModal(pr: PurchaseRequisition) {
    setRejectingPR(pr)
    setRejectionReason('')
    setIsRejectModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('app_users')
      .select('id, organization_id')
      .eq('user_id', user.id)
      .single() as { data: { id: string; organization_id: string } | null }

    if (!profile?.organization_id) return

    const prData = {
      title: formData.title,
      description: formData.description || null,
      department: formData.department || null,
      project_id: formData.project_id || null,
      priority: formData.priority,
      total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
      required_date: formData.required_date || null,
      notes: formData.notes || null,
      organization_id: profile.organization_id,
    }

    if (editingPR) {
      await supabase
        .from('purchase_requisitions')
        .update(prData as any)
        .eq('id', editingPR.id)
    } else {
      const prNumber = `PR-${Date.now().toString().slice(-8)}`
      await supabase
        .from('purchase_requisitions')
        .insert({
          ...prData,
          pr_number: prNumber,
          requested_by: profile.id,
          status: 'draft',
        } as any)
    }

    setIsModalOpen(false)
    fetchData()
  }

  async function updateStatus(id: string, status: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null }

    const updateData: Record<string, unknown> = { status }
    
    if (status === 'approved') {
      updateData.approved_by = profile?.id
      updateData.approved_at = new Date().toISOString()
    }
    
    await supabase
      .from('purchase_requisitions')
      .update(updateData as any)
      .eq('id', id)
    
    fetchData()
  }

  async function handleReject() {
    if (!rejectingPR) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', user.id)
      .single() as { data: { id: string } | null }

    await supabase
      .from('purchase_requisitions')
      .update({
        status: 'rejected',
        approved_by: profile?.id,
        approved_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null,
      } as any)
      .eq('id', rejectingPR.id)

    setIsRejectModalOpen(false)
    setRejectingPR(null)
    fetchData()
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this purchase requisition?')) {
      await supabase
        .from('purchase_requisitions')
        .delete()
        .eq('id', id)
      fetchData()
    }
  }

  async function convertToPO(pr: PurchaseRequisition) {
    if (confirm('Convert this PR to a Purchase Order?')) {
      await updateStatus(pr.id, 'converted_to_po')
      // In a real implementation, you would also create the PO here
      alert('PR marked as converted. Please create the PO in the Purchase Orders section.')
    }
  }

  const filteredRequisitions = requisitions.filter(pr => {
    const matchesSearch = pr.pr_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.requester_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || pr.status === statusFilter
    const matchesPriority = !priorityFilter || pr.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted_to_po: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  }

  const departmentOptions = [
    'Administration',
    'Finance',
    'Operations',
    'Maintenance',
    'Security',
    'IT',
    'Marketing',
    'HR',
    'Legal',
    'Other',
  ]

  const stats = {
    total: requisitions.length,
    draft: requisitions.filter(pr => pr.status === 'draft').length,
    pending: requisitions.filter(pr => pr.status === 'submitted').length,
    approved: requisitions.filter(pr => pr.status === 'approved').length,
    totalValue: requisitions.reduce((sum, pr) => sum + (pr.total_amount || 0), 0),
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'procurement_officer']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/purchasing" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <Link href="/purchasing" className="text-sm text-emerald-600 hover:text-emerald-500">Purchasing Dashboard</Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm text-gray-500">Purchase Requisitions</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Requisitions</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage purchase requests and approvals
                </p>
              </div>
            </div>
            <Button onClick={openCreateModal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              New PR
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <div className="text-center">
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-sm text-gray-500">Total PRs</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                <p className="text-sm text-gray-500">Draft</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending Approval</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">${stats.totalValue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search PRs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-1"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="converted_to_po">Converted to PO</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading requisitions...</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>PR Number</TableHeader>
                    <TableHeader>Title</TableHeader>
                    <TableHeader>Requested By</TableHeader>
                    <TableHeader>Priority</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Required Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRequisitions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No purchase requisitions found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRequisitions.map((pr) => (
                      <TableRow key={pr.id}>
                        <TableCell className="font-medium">{pr.pr_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{pr.title}</p>
                            {pr.department && (
                              <p className="text-sm text-gray-500">{pr.department}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{pr.requester_name || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[pr.priority]}`}>
                            {pr.priority}
                          </span>
                        </TableCell>
                        <TableCell>
                          {pr.total_amount ? `$${pr.total_amount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          {pr.required_date ? new Date(pr.required_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[pr.status]}`}>
                            {pr.status.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(pr)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {(pr.status === 'draft' || pr.status === 'rejected') && (
                              <>
                                <button
                                  onClick={() => openEditModal(pr)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => updateStatus(pr.id, 'submitted')}
                                  className="text-emerald-600 hover:text-emerald-900"
                                  title="Submit for Approval"
                                >
                                  <ArrowPathIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(pr.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            {pr.status === 'submitted' && (
                              <>
                                <button
                                  onClick={() => updateStatus(pr.id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve"
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => openRejectModal(pr)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject"
                                >
                                  <XMarkIcon className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            {pr.status === 'approved' && (
                              <button
                                onClick={() => convertToPO(pr)}
                                className="text-purple-600 hover:text-purple-900"
                                title="Convert to PO"
                              >
                                <ArrowPathIcon className="h-5 w-5" />
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

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPR ? 'Edit Purchase Requisition' : 'New Purchase Requisition'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of what you need"
              required
            />
            <FormTextarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the items/services needed"
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="">Select Department</option>
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Project (Optional)"
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              >
                <option value="">No Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </FormSelect>
              <FormInput
                label="Estimated Amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <FormInput
              label="Required Date"
              type="date"
              value={formData.required_date}
              onChange={(e) => setFormData({ ...formData, required_date: e.target.value })}
            />
            <FormTextarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or specifications"
              rows={2}
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                After creating the PR, you can submit it for approval. Once approved, it can be converted to a Purchase Order.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPR ? 'Update PR' : 'Create PR'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        {viewingPR && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title={`PR: ${viewingPR.pr_number}`}
            size="lg"
          >
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{viewingPR.title}</h3>
                  <p className="text-sm text-gray-500">
                    Requested by {viewingPR.requester_name || 'Unknown'} on {new Date(viewingPR.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${priorityColors[viewingPR.priority]}`}>
                    {viewingPR.priority}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[viewingPR.status]}`}>
                    {viewingPR.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {viewingPR.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewingPR.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Department:</span>
                      <span>{viewingPR.department || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estimated Amount:</span>
                      <span className="font-medium">
                        {viewingPR.total_amount ? `$${viewingPR.total_amount.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Required Date:</span>
                      <span>
                        {viewingPR.required_date ? new Date(viewingPR.required_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {viewingPR.status === 'approved' && viewingPR.approved_at && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Approval</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Approved On:</span>
                        <span>{new Date(viewingPR.approved_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {viewingPR.status === 'rejected' && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Rejection</h4>
                    <div className="bg-red-50 rounded-lg p-3">
                      <p className="text-sm text-red-700">
                        {viewingPR.rejection_reason || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {viewingPR.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewingPR.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                {(viewingPR.status === 'draft' || viewingPR.status === 'rejected') && (
                  <Button onClick={() => {
                    setIsViewModalOpen(false)
                    openEditModal(viewingPR)
                  }}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit PR
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Reject Modal */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Purchase Requisition"
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to reject PR <strong>{rejectingPR?.pr_number}</strong>?
            </p>
            <FormTextarea
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              rows={3}
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleReject}>
                Reject PR
              </Button>
            </div>
          </div>
        </Modal>
      </RoleGuard>
  )
}
