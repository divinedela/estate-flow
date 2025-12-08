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
  ShoppingCartIcon, 
  PlusIcon, 
  EyeIcon, 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
  PrinterIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'

interface PurchaseOrder {
  id: string
  po_number: string
  pr_id: string | null
  supplier_id: string
  supplier_name?: string
  project_id: string | null
  status: string
  issued_date: string | null
  expected_delivery_date: string | null
  delivery_address: string | null
  payment_terms: string | null
  total_amount: number | null
  currency: string
  notes: string | null
  created_at: string
}

interface Supplier {
  id: string
  name: string
  payment_terms: string | null
  currency: string
}

interface PurchaseRequisition {
  id: string
  pr_number: string
  title: string
  total_amount: number | null
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [approvedPRs, setApprovedPRs] = useState<PurchaseRequisition[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null)
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formData, setFormData] = useState({
    pr_id: '',
    supplier_id: '',
    issued_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    delivery_address: '',
    payment_terms: '',
    total_amount: '',
    currency: 'USD',
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

    // Fetch POs
    const { data: posData } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(name)
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    // Fetch suppliers
    const { data: suppliersData } = await supabase
      .from('suppliers')
      .select('id, name, payment_terms, currency')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'active')
      .order('name')

    // Fetch approved PRs that haven't been converted
    const { data: prsData } = await supabase
      .from('purchase_requisitions')
      .select('id, pr_number, title, total_amount')
      .eq('organization_id', profile.organization_id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    setOrders((posData as any[])?.map((po: any) => ({
      ...po,
      supplier_name: po.supplier?.name
    })) || [])
    
    setSuppliers((suppliersData as Supplier[]) || [])
    setApprovedPRs((prsData as PurchaseRequisition[]) || [])
    setLoading(false)
  }

  function openCreateModal() {
    setEditingPO(null)
    setFormData({
      pr_id: '',
      supplier_id: '',
      issued_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      delivery_address: '',
      payment_terms: '',
      total_amount: '',
      currency: 'USD',
      notes: '',
    })
    setIsModalOpen(true)
  }

  function openEditModal(po: PurchaseOrder) {
    setEditingPO(po)
    setFormData({
      pr_id: po.pr_id || '',
      supplier_id: po.supplier_id,
      issued_date: po.issued_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: po.expected_delivery_date || '',
      delivery_address: po.delivery_address || '',
      payment_terms: po.payment_terms || '',
      total_amount: po.total_amount?.toString() || '',
      currency: po.currency,
      notes: po.notes || '',
    })
    setIsModalOpen(true)
  }

  function openViewModal(po: PurchaseOrder) {
    setViewingPO(po)
    setIsViewModalOpen(true)
  }

  function handleSupplierChange(supplierId: string) {
    const supplier = suppliers.find(s => s.id === supplierId)
    setFormData({ 
      ...formData, 
      supplier_id: supplierId,
      payment_terms: supplier?.payment_terms || formData.payment_terms,
      currency: supplier?.currency || formData.currency,
    })
  }

  function handlePRChange(prId: string) {
    const pr = approvedPRs.find(p => p.id === prId)
    setFormData({ 
      ...formData, 
      pr_id: prId,
      total_amount: pr?.total_amount?.toString() || formData.total_amount,
    })
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

    const poData = {
      pr_id: formData.pr_id || null,
      supplier_id: formData.supplier_id,
      issued_date: formData.issued_date || null,
      expected_delivery_date: formData.expected_delivery_date || null,
      delivery_address: formData.delivery_address || null,
      payment_terms: formData.payment_terms || null,
      total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
      currency: formData.currency,
      notes: formData.notes || null,
      organization_id: profile.organization_id,
    }

    if (editingPO) {
      await supabase
        .from('purchase_orders')
        .update(poData as any)
        .eq('id', editingPO.id)
    } else {
      const poNumber = `PO-${Date.now().toString().slice(-8)}`
      await supabase
        .from('purchase_orders')
        .insert({
          ...poData,
          po_number: poNumber,
          issued_by: profile.id,
          status: 'draft',
        } as any)

      // If linked to a PR, update PR status
      if (formData.pr_id) {
        await supabase
          .from('purchase_requisitions')
          .update({ status: 'converted_to_po' } as any)
          .eq('id', formData.pr_id)
      }
    }

    setIsModalOpen(false)
    fetchData()
  }

  async function updateStatus(id: string, status: string) {
    await supabase
      .from('purchase_orders')
      .update({ status } as any)
      .eq('id', id)
    
    fetchData()
  }

  async function handleDelete(id: string) {
    if (confirm('Are you sure you want to delete this purchase order?')) {
      await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id)
      fetchData()
    }
  }

  async function duplicatePO(po: PurchaseOrder) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('app_users')
      .select('id, organization_id')
      .eq('user_id', user.id)
      .single() as { data: { id: string; organization_id: string } | null }

    if (!profile?.organization_id) return

    const poNumber = `PO-${Date.now().toString().slice(-8)}`
    await supabase
      .from('purchase_orders')
      .insert({
        po_number: poNumber,
        supplier_id: po.supplier_id,
        issued_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: null,
        delivery_address: po.delivery_address,
        payment_terms: po.payment_terms,
        total_amount: po.total_amount,
        currency: po.currency,
        notes: `Duplicated from ${po.po_number}`,
        organization_id: profile.organization_id,
        issued_by: profile.id,
        status: 'draft',
      } as any)

    fetchData()
  }

  const filteredOrders = orders.filter(po => {
    const matchesSearch = po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || po.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-indigo-100 text-indigo-800',
    partial: 'bg-yellow-100 text-yellow-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const paymentTermsOptions = [
    { value: 'COD', label: 'Cash on Delivery (COD)' },
    { value: 'Net 15', label: 'Net 15 Days' },
    { value: 'Net 30', label: 'Net 30 Days' },
    { value: 'Net 45', label: 'Net 45 Days' },
    { value: 'Net 60', label: 'Net 60 Days' },
    { value: 'Advance', label: 'Advance Payment' },
    { value: '50% Advance', label: '50% Advance' },
  ]

  const currencyOptions = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NGN', 'GHS', 'KES', 'ZAR', 'INR', 'CNY', 'JPY']

  const stats = {
    total: orders.length,
    draft: orders.filter(po => po.status === 'draft').length,
    open: orders.filter(po => ['sent', 'confirmed', 'partial'].includes(po.status)).length,
    received: orders.filter(po => po.status === 'received').length,
    totalValue: orders.reduce((sum, po) => sum + (po.total_amount || 0), 0),
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
                  <span className="text-sm text-gray-500">Purchase Orders</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage purchase orders and track deliveries
                </p>
              </div>
            </div>
            <Button onClick={openCreateModal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              New PO
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card>
              <div className="text-center">
                <ShoppingCartIcon className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-sm text-gray-500">Total POs</p>
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
                <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                <p className="text-sm text-gray-500">Open Orders</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.received}</p>
                <p className="text-sm text-gray-500">Received</p>
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
                placeholder="Search POs..."
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
                <option value="sent">Sent</option>
                <option value="confirmed">Confirmed</option>
                <option value="partial">Partial</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading orders...</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>PO Number</TableHeader>
                    <TableHeader>Supplier</TableHeader>
                    <TableHeader>Order Date</TableHeader>
                    <TableHeader>Expected Delivery</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No purchase orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.supplier_name || 'N/A'}</TableCell>
                        <TableCell>
                          {po.issued_date ? new Date(po.issued_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          {po.expected_delivery_date ? (
                            <span className={new Date(po.expected_delivery_date) < new Date() && po.status !== 'received' ? 'text-red-600 font-medium' : ''}>
                              {new Date(po.expected_delivery_date).toLocaleDateString()}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {po.total_amount ? `${po.currency} ${po.total_amount.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[po.status]}`}>
                            {po.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openViewModal(po)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            {po.status === 'draft' && (
                              <>
                                <button
                                  onClick={() => openEditModal(po)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => updateStatus(po.id, 'sent')}
                                  className="text-emerald-600 hover:text-emerald-900"
                                  title="Send to Supplier"
                                >
                                  <TruckIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(po.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </>
                            )}
                            {['sent', 'confirmed', 'partial'].includes(po.status) && (
                              <select
                                value={po.status}
                                onChange={(e) => updateStatus(po.id, e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="sent">Sent</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="partial">Partial</option>
                                <option value="received">Received</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            )}
                            <button
                              onClick={() => duplicatePO(po)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Duplicate"
                            >
                              <DocumentDuplicateIcon className="h-5 w-5" />
                            </button>
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
          title={editingPO ? 'Edit Purchase Order' : 'New Purchase Order'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingPO && approvedPRs.length > 0 && (
              <FormSelect
                label="Link to Purchase Requisition (Optional)"
                value={formData.pr_id}
                onChange={(e) => handlePRChange(e.target.value)}
              >
                <option value="">No PR - Create standalone PO</option>
                {approvedPRs.map(pr => (
                  <option key={pr.id} value={pr.id}>
                    {pr.pr_number} - {pr.title} {pr.total_amount ? `($${pr.total_amount.toLocaleString()})` : ''}
                  </option>
                ))}
              </FormSelect>
            )}
            
            <FormSelect
              label="Supplier"
              value={formData.supplier_id}
              onChange={(e) => handleSupplierChange(e.target.value)}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </FormSelect>

            {suppliers.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  No active suppliers found. <Link href="/purchasing/suppliers" className="text-yellow-700 underline">Add suppliers first</Link>.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Order Date"
                type="date"
                value={formData.issued_date}
                onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                required
              />
              <FormInput
                label="Expected Delivery Date"
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
              />
            </div>

            <FormTextarea
              label="Delivery Address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Where should the goods be delivered?"
              rows={2}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormSelect
                label="Payment Terms"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
              >
                <option value="">Select Terms</option>
                {paymentTermsOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </FormSelect>
              <FormInput
                label="Total Amount"
                type="number"
                step="0.01"
                value={formData.total_amount}
                onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                placeholder="0.00"
              />
              <FormSelect
                label="Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                {currencyOptions.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </FormSelect>
            </div>

            <FormTextarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or instructions for the supplier"
              rows={3}
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                After creating the PO, you can add line items, send it to the supplier, and track delivery status.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.supplier_id}>
                {editingPO ? 'Update PO' : 'Create PO'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        {viewingPO && (
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            title={`PO: ${viewingPO.po_number}`}
            size="lg"
          >
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{viewingPO.supplier_name}</h3>
                  <p className="text-sm text-gray-500">
                    Created on {new Date(viewingPO.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[viewingPO.status]}`}>
                  {viewingPO.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Order Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order Date:</span>
                      <span>{viewingPO.issued_date ? new Date(viewingPO.issued_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Delivery:</span>
                      <span>
                        {viewingPO.expected_delivery_date ? new Date(viewingPO.expected_delivery_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Payment Terms:</span>
                      <span>{viewingPO.payment_terms || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Financial</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Amount:</span>
                      <span className="font-medium text-lg">
                        {viewingPO.total_amount ? `${viewingPO.currency} ${viewingPO.total_amount.toLocaleString()}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Currency:</span>
                      <span>{viewingPO.currency}</span>
                    </div>
                  </div>
                </div>
              </div>

              {viewingPO.delivery_address && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Delivery Address</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewingPO.delivery_address}</p>
                </div>
              )}

              {viewingPO.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewingPO.notes}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print
                </Button>
                {viewingPO.status === 'draft' && (
                  <Button onClick={() => {
                    setIsViewModalOpen(false)
                    openEditModal(viewingPO)
                  }}>
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Edit PO
                  </Button>
                )}
              </div>
            </div>
          </Modal>
        )}
      </RoleGuard>
  )
}
