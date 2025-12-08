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
import { ReceiptPercentIcon, PlusIcon, EyeIcon, CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface Invoice {
  id: string
  invoice_number: string
  supplier_invoice_number: string | null
  po_id: string | null
  po_number?: string
  supplier_id: string | null
  supplier_name?: string
  invoice_date: string
  due_date: string | null
  subtotal: number | null
  tax_amount: number | null
  total_amount: number
  amount_paid: number | null
  status: string
  payment_date: string | null
  notes: string | null
  created_at: string
}

interface Supplier {
  id: string
  name: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    subtotal: '',
    tax_amount: '',
    notes: '',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    // Fetch invoices
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select(`
        *,
        supplier:suppliers(name),
        po:purchase_orders(po_number)
      `)
      .order('created_at', { ascending: false })

    // Fetch suppliers
    const { data: suppliersData } = await supabase
      .from('suppliers')
      .select('id, name')
      .eq('is_active', true)
      .order('name')

    setInvoices(invoicesData?.map(inv => ({
      ...inv,
      supplier_name: inv.supplier?.name,
      po_number: inv.po?.po_number
    })) || [])
    
    setSuppliers(suppliersData || [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`
    const subtotal = parseFloat(formData.subtotal)
    const taxAmount = formData.tax_amount ? parseFloat(formData.tax_amount) : 0
    const totalAmount = subtotal + taxAmount
    
    await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        supplier_id: formData.supplier_id,
        supplier_invoice_number: formData.supplier_invoice_number || null,
        invoice_date: formData.invoice_date,
        due_date: formData.due_date || null,
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        notes: formData.notes || null,
        status: 'pending',
      })

    setIsModalOpen(false)
    setFormData({
      supplier_id: '',
      supplier_invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      subtotal: '',
      tax_amount: '',
      notes: '',
    })
    fetchData()
  }

  async function updateStatus(id: string, status: string) {
    const updateData: Record<string, unknown> = { status }
    
    if (status === 'paid') {
      updateData.payment_date = new Date().toISOString()
      // Get invoice to update amount_paid
      const invoice = invoices.find(i => i.id === id)
      if (invoice) {
        updateData.amount_paid = invoice.total_amount
      }
    }
    
    await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
    
    fetchData()
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  const today = new Date()
  const stats = {
    total: invoices.length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => {
      if (i.status === 'paid') return false
      if (!i.due_date) return false
      return new Date(i.due_date) < today
    }).length,
    totalOutstanding: invoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + (i.total_amount - (i.amount_paid || 0)), 0),
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'procurement_officer']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/purchasing">
                <Button variant="secondary" size="sm">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage supplier invoices and payments
                </p>
              </div>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              New Invoice
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="text-center">
                <ReceiptPercentIcon className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Invoices</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending Payment</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                <p className="text-sm text-gray-500">Overdue</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">${stats.totalOutstanding.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Outstanding</p>
              </div>
            </Card>
          </div>

          {stats.overdue > 0 && (
            <Card className="border-red-200 bg-red-50">
              <div className="flex items-center">
                <ReceiptPercentIcon className="h-6 w-6 text-red-600 mr-3" />
                <div>
                  <p className="font-medium text-red-800">Overdue Invoices</p>
                  <p className="text-sm text-red-600">
                    {stats.overdue} invoice(s) are past their due date
                  </p>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <div className="mb-4 flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Search invoices..."
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
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading invoices...</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Invoice #</TableHeader>
                    <TableHeader>Supplier</TableHeader>
                    <TableHeader>Invoice Date</TableHeader>
                    <TableHeader>Due Date</TableHeader>
                    <TableHeader>Amount</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No invoices found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => {
                      const isOverdue = invoice.status !== 'paid' && invoice.due_date && new Date(invoice.due_date) < today
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{invoice.invoice_number}</p>
                              {invoice.supplier_invoice_number && (
                                <p className="text-sm text-gray-500">Ref: {invoice.supplier_invoice_number}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{invoice.supplier_name || 'N/A'}</TableCell>
                          <TableCell>
                            {new Date(invoice.invoice_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {invoice.due_date ? (
                              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                {new Date(invoice.due_date).toLocaleDateString()}
                                {isOverdue && ' (Overdue)'}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">${invoice.total_amount.toLocaleString()}</p>
                              {invoice.amount_paid && invoice.amount_paid > 0 && (
                                <p className="text-sm text-green-600">
                                  Paid: ${invoice.amount_paid.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isOverdue ? statusColors.overdue : statusColors[invoice.status]
                            }`}>
                              {isOverdue ? 'overdue' : invoice.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-900">
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              {invoice.status !== 'paid' && (
                                <button
                                  onClick={() => updateStatus(invoice.id, 'paid')}
                                  className="text-green-600 hover:text-green-900"
                                  title="Mark as Paid"
                                >
                                  <CheckIcon className="h-5 w-5" />
                                </button>
                              )}
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

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="New Invoice"
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormSelect
              label="Supplier"
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              required
            >
              <option value="">Select Supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </FormSelect>
            <FormInput
              label="Supplier Invoice Number"
              value={formData.supplier_invoice_number}
              onChange={(e) => setFormData({ ...formData, supplier_invoice_number: e.target.value })}
              placeholder="Supplier's invoice reference"
            />
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Invoice Date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                required
              />
              <FormInput
                label="Due Date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Subtotal"
                type="number"
                step="0.01"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                placeholder="0.00"
                required
              />
              <FormInput
                label="Tax Amount"
                type="number"
                step="0.01"
                value={formData.tax_amount}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            {formData.subtotal && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${parseFloat(formData.subtotal || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${parseFloat(formData.tax_amount || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>${(parseFloat(formData.subtotal || '0') + parseFloat(formData.tax_amount || '0')).toFixed(2)}</span>
                </div>
              </div>
            )}
            <FormTextarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Invoice</Button>
            </div>
          </form>
        </Modal>
      </RoleGuard>
  )
}

