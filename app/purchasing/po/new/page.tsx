'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'
import { TrashIcon, PlusIcon } from '@heroicons/react/24/outline'

type Project = Database['public']['Tables']['projects']['Row']
type Item = Database['public']['Tables']['items']['Row']
type Supplier = Database['public']['Tables']['suppliers']['Row']
type PR = Database['public']['Tables']['purchase_requisitions']['Row']

interface POItem {
  id: string
  item_id: string
  description: string
  quantity: string
  unit_of_measure: string
  unit_price: string
  total_price: string
  notes: string
}

export default function NewPOPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [prs, setPRs] = useState<PR[]>([])
  const [poItems, setPOItems] = useState<POItem[]>([
    {
      id: '1',
      item_id: '',
      description: '',
      quantity: '',
      unit_of_measure: 'pcs',
      unit_price: '',
      total_price: '',
      notes: '',
    },
  ])
  
  const [formData, setFormData] = useState({
    po_number: '',
    pr_id: '',
    supplier_id: '',
    project_id: '',
    issued_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    status: 'draft',
    payment_terms: '',
    delivery_address: '',
    currency: 'USD',
    notes: '',
  })

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('app_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!profile?.organization_id) return

      const orgId = profile.organization_id

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, project_code')
        .eq('organization_id', orgId)
        .order('name')

      if (projectsData) {
        setProjects(projectsData as Project[])
      }

      // Fetch items
      const { data: itemsData } = await supabase
        .from('items')
        .select('id, name, item_code, unit_of_measure')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('name')

      if (itemsData) {
        setItems(itemsData as Item[])
      }

      // Fetch suppliers
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('id, name, supplier_code')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .order('name')

      if (suppliersData) {
        setSuppliers(suppliersData as Supplier[])
      }

      // Fetch approved PRs
      const { data: prsData } = await supabase
        .from('purchase_requisitions')
        .select('id, pr_number, total_amount, status')
        .eq('organization_id', orgId)
        .in('status', ['approved', 'submitted'])
        .order('created_at', { ascending: false })

      if (prsData) {
        setPRs(prsData as PR[])
      }
    }

    fetchData()
  }, [])

  // Load PR items when PR is selected
  useEffect(() => {
    async function loadPRItems() {
      if (!formData.pr_id) return

      const supabase = createClient()
      const { data: prItems } = await supabase
        .from('purchase_requisition_items')
        .select('*')
        .eq('pr_id', formData.pr_id)

      if (prItems && prItems.length > 0) {
        setPOItems(
          prItems.map((item, index) => ({
            id: (index + 1).toString(),
            item_id: item.item_id || '',
            description: item.description,
            quantity: item.quantity.toString(),
            unit_of_measure: item.unit_of_measure || 'pcs',
            unit_price: item.estimated_unit_price ? item.estimated_unit_price.toString() : '',
            total_price: item.estimated_total_price ? item.estimated_total_price.toString() : '',
            notes: item.notes || '',
          }))
        )
      }
    }

    loadPRItems()
  }, [formData.pr_id])

  const addItem = () => {
    setPOItems([
      ...poItems,
      {
        id: Date.now().toString(),
        item_id: '',
        description: '',
        quantity: '',
        unit_of_measure: 'pcs',
        unit_price: '',
        total_price: '',
        notes: '',
      },
    ])
  }

  const removeItem = (id: string) => {
    if (poItems.length > 1) {
      setPOItems(poItems.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof POItem, value: string) => {
    setPOItems(
      poItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          
          // Auto-calculate total price
          if (field === 'quantity' || field === 'unit_price') {
            const qty = parseFloat(updated.quantity) || 0
            const price = parseFloat(updated.unit_price) || 0
            updated.total_price = (qty * price).toFixed(2)
          }
          
          // Auto-fill description and unit from item
          if (field === 'item_id' && value) {
            const selectedItem = items.find((i) => i.id === value)
            if (selectedItem) {
              updated.description = selectedItem.name
              updated.unit_of_measure = selectedItem.unit_of_measure || 'pcs'
            }
          }
          
          return updated
        }
        return item
      })
    )
  }

  const generatePONumber = () => {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `PO-${year}${month}${day}-${random}`
  }

  useEffect(() => {
    if (!formData.po_number) {
      setFormData({ ...formData, po_number: generatePONumber() })
    }
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
        .select('organization_id, id')
        .eq('user_id', user.id)
        .single()

      if (!profile || !('organization_id' in profile)) throw new Error('User profile not found')

      const orgId = (profile as { organization_id: string | null }).organization_id
      const appUserId = (profile as { id: string }).id
      if (!orgId) throw new Error('User organization not found')

      if (!formData.supplier_id) {
        alert('Please select a supplier')
        setLoading(false)
        return
      }

      // Validate items
      const validItems = poItems.filter(
        (item) => item.description && item.quantity && item.unit_price && 
        parseFloat(item.quantity) > 0 && parseFloat(item.unit_price) > 0
      )

      if (validItems.length === 0) {
        alert('Please add at least one item with description, quantity, and unit price')
        setLoading(false)
        return
      }

      // Create PO
      const poData: any = {
        organization_id: orgId,
        po_number: formData.po_number,
        pr_id: formData.pr_id || null,
        supplier_id: formData.supplier_id,
        project_id: formData.project_id || null,
        issued_by: appUserId,
        issued_date: formData.issued_date || new Date().toISOString().split('T')[0],
        expected_delivery_date: formData.expected_delivery_date || null,
        status: formData.status,
        payment_terms: formData.payment_terms || null,
        delivery_address: formData.delivery_address || null,
        currency: formData.currency,
        notes: formData.notes || null,
      }

      const { data: po, error: poError } = await supabase
        .from('purchase_orders')
        .insert(poData)
        .select('id')
        .single()

      if (poError) throw poError

      // Create PO items
      const itemsData = validItems.map((item) => ({
        po_id: po.id,
        item_id: item.item_id || null,
        description: item.description,
        quantity: parseFloat(item.quantity),
        unit_of_measure: item.unit_of_measure || null,
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.total_price) || parseFloat(item.quantity) * parseFloat(item.unit_price),
        notes: item.notes || null,
      }))

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(itemsData)

      if (itemsError) throw itemsError

      router.push('/purchasing')
    } catch (error) {
      console.error('Error creating PO:', error)
      alert('Failed to create purchase order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'procurement_officer']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a purchase order to suppliers
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* PO Header Information */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="PO Number"
                  required
                  value={formData.po_number}
                  onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                  placeholder="PO-2024-001"
                />
                <FormSelect
                  label="Supplier"
                  required
                  value={formData.supplier_id}
                  onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                  options={[
                    { value: '', label: 'Select Supplier' },
                    ...suppliers.map((supplier) => ({
                      value: supplier.id,
                      label: `${supplier.name} (${supplier.supplier_code})`,
                    })),
                  ]}
                />
                <FormSelect
                  label="Purchase Requisition (Optional)"
                  value={formData.pr_id}
                  onChange={(e) => setFormData({ ...formData, pr_id: e.target.value })}
                  options={[
                    { value: '', label: 'No PR' },
                    ...prs.map((pr) => ({
                      value: pr.id,
                      label: `${pr.pr_number} - ${pr.total_amount ? `$${pr.total_amount}` : 'N/A'}`,
                    })),
                  ]}
                />
                <FormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'sent', label: 'Sent' },
                    { value: 'acknowledged', label: 'Acknowledged' },
                    { value: 'partial', label: 'Partial' },
                    { value: 'received', label: 'Received' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
                <FormSelect
                  label="Project (Optional)"
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  options={[
                    { value: '', label: 'No Project' },
                    ...projects.map((project) => ({
                      value: project.id,
                      label: `${project.name} (${project.project_code})`,
                    })),
                  ]}
                />
                <FormInput
                  label="Issued Date"
                  type="date"
                  required
                  value={formData.issued_date}
                  onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                />
                <FormInput
                  label="Expected Delivery Date"
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => setFormData({ ...formData, expected_delivery_date: e.target.value })}
                />
                <FormInput
                  label="Payment Terms"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  placeholder="e.g., Net 30, COD"
                />
                <FormSelect
                  label="Currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  options={[
                    { value: 'USD', label: 'USD' },
                    { value: 'EUR', label: 'EUR' },
                    { value: 'GBP', label: 'GBP' },
                    { value: 'GHS', label: 'GHS' },
                  ]}
                />
              </div>

              <FormTextarea
                label="Delivery Address"
                rows={3}
                value={formData.delivery_address}
                onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
                placeholder="Delivery address for this order..."
              />

              {/* PO Items */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Items</h2>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={addItem}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-4">
                  {poItems.map((item, index) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Item {index + 1}</h3>
                        {poItems.length > 1 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="sm:col-span-2">
                          <FormSelect
                            label="Item (Optional)"
                            value={item.item_id}
                            onChange={(e) => updateItem(item.id, 'item_id', e.target.value)}
                            options={[
                              { value: '', label: 'Select Item' },
                              ...items.map((i) => ({
                                value: i.id,
                                label: `${i.name} (${i.item_code})`,
                              })),
                            ]}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FormInput
                            label="Description"
                            required
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        </div>
                        <FormInput
                          label="Quantity"
                          type="number"
                          step="0.001"
                          required
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                          placeholder="0"
                        />
                        <FormInput
                          label="Unit of Measure"
                          value={item.unit_of_measure}
                          onChange={(e) => updateItem(item.id, 'unit_of_measure', e.target.value)}
                          placeholder="pcs, kg, m, etc."
                        />
                        <FormInput
                          label="Unit Price"
                          type="number"
                          step="0.01"
                          required
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                          placeholder="0.00"
                        />
                        <FormInput
                          label="Total Price"
                          type="number"
                          step="0.01"
                          value={item.total_price}
                          readOnly
                          className="bg-gray-50"
                        />
                        <div className="sm:col-span-2">
                          <FormInput
                            label="Notes"
                            value={item.notes}
                            onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                            placeholder="Item-specific notes"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <FormTextarea
                label="Notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this PO..."
              />

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create PO'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}

