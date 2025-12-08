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
  BuildingStorefrontIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  UserIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'

interface Unit {
  id: string
  unit_number: string
  unit_type: string | null
  floor_number: number | null
  area: number | null
  bedrooms: number | null
  bathrooms: number | null
  status: string
  current_tenant_id: string | null
  rent_amount: number | null
  facility_id: string
  created_at: string
  facility?: { name: string; facility_code: string }
}

interface Facility {
  id: string
  name: string
  facility_code: string
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [viewingUnit, setViewingUnit] = useState<Unit | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [facilityFilter, setFacilityFilter] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    unit_number: '',
    unit_type: '',
    floor_number: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    status: 'available',
    rent_amount: '',
    facility_id: '',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    
    const [unitsRes, facilitiesRes] = await Promise.all([
      supabase
        .from('facility_units')
        .select('*, facility:facilities(name, facility_code)')
        .order('unit_number', { ascending: true }),
      supabase.from('facilities').select('id, name, facility_code').order('name'),
    ])

    setUnits((unitsRes.data as Unit[]) || [])
    setFacilities((facilitiesRes.data as Facility[]) || [])
    setLoading(false)
  }

  function openCreateModal() {
    setEditingUnit(null)
    setFormData({
      unit_number: '',
      unit_type: '',
      floor_number: '',
      area: '',
      bedrooms: '',
      bathrooms: '',
      status: 'available',
      rent_amount: '',
      facility_id: '',
    })
    setIsModalOpen(true)
  }

  function openEditModal(unit: Unit) {
    setEditingUnit(unit)
    setFormData({
      unit_number: unit.unit_number,
      unit_type: unit.unit_type || '',
      floor_number: unit.floor_number?.toString() || '',
      area: unit.area?.toString() || '',
      bedrooms: unit.bedrooms?.toString() || '',
      bathrooms: unit.bathrooms?.toString() || '',
      status: unit.status,
      rent_amount: unit.rent_amount?.toString() || '',
      facility_id: unit.facility_id,
    })
    setIsModalOpen(true)
  }

  function openViewModal(unit: Unit) {
    setViewingUnit(unit)
    setIsViewModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const unitData = {
      unit_number: formData.unit_number,
      unit_type: formData.unit_type || null,
      floor_number: formData.floor_number ? parseInt(formData.floor_number) : null,
      area: formData.area ? parseFloat(formData.area) : null,
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
      status: formData.status,
      rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null,
      facility_id: formData.facility_id,
    }

    if (editingUnit) {
      await supabase
        .from('facility_units')
        .update(unitData as never)
        .eq('id', editingUnit.id)
    } else {
      await supabase
        .from('facility_units')
        .insert(unitData as never)
    }

    setIsModalOpen(false)
    fetchData()
  }

  async function handleDelete(id: string) {
    await supabase
      .from('facility_units')
      .delete()
      .eq('id', id)
    
    setDeleteConfirmId(null)
    fetchData()
  }

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.unit_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.facility as { name: string } | undefined)?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || unit.status === statusFilter
    const matchesFacility = !facilityFilter || unit.facility_id === facilityFilter
    return matchesSearch && matchesStatus && matchesFacility
  })

  const unitTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'office', label: 'Office' },
    { value: 'shop', label: 'Shop' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'parking', label: 'Parking' },
    { value: 'storage', label: 'Storage' },
    { value: 'studio', label: 'Studio' },
    { value: 'penthouse', label: 'Penthouse' },
  ]

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    occupied: 'bg-blue-100 text-blue-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    reserved: 'bg-purple-100 text-purple-800',
  }

  const stats = {
    total: units.length,
    available: units.filter(u => u.status === 'available').length,
    occupied: units.filter(u => u.status === 'occupied').length,
    maintenance: units.filter(u => u.status === 'maintenance').length,
    totalRent: units.filter(u => u.status === 'occupied').reduce((sum, u) => sum + (u.rent_amount || 0), 0),
    totalArea: units.reduce((sum, u) => sum + (u.area || 0), 0),
    occupancyRate: units.length > 0 
      ? Math.round((units.filter(u => u.status === 'occupied').length / units.length) * 100) 
      : 0,
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'facility_manager']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/facilities">
                <Button variant="secondary" size="sm">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Units</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage facility units and occupancy
                </p>
              </div>
            </div>
            <Button onClick={openCreateModal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Unit
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            <Card>
              <div className="text-center p-4">
                <BuildingStorefrontIcon className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Units</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-blue-600">{stats.occupied}</p>
                <p className="text-sm text-gray-500">Occupied</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
                <p className="text-sm text-gray-500">Maintenance</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-indigo-600">{stats.occupancyRate}%</p>
                <p className="text-sm text-gray-500">Occupancy</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400 mx-auto" />
                <p className="text-2xl font-bold text-green-600">${stats.totalRent.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Monthly Rent</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-purple-600">{stats.totalArea.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Area (sqft)</p>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search units..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={facilityFilter}
                onChange={(e) => setFacilityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Facilities</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading units...</p>
              </div>
            ) : filteredUnits.length === 0 ? (
              <div className="text-center py-12">
                <BuildingStorefrontIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No units found</h3>
                <p className="mt-2 text-gray-500">Add your first unit to get started.</p>
                <Button onClick={openCreateModal} className="mt-4">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Unit
                </Button>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Unit #</TableHeader>
                    <TableHeader>Facility</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Floor</TableHeader>
                    <TableHeader>Area</TableHeader>
                    <TableHeader>Rent</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.unit_number}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {(unit.facility as { name: string } | undefined)?.name || '-'}
                      </TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          {unit.unit_type || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>{unit.floor_number || '-'}</TableCell>
                      <TableCell>
                        {unit.area ? `${unit.area.toLocaleString()} sqft` : '-'}
                      </TableCell>
                      <TableCell>
                        {unit.rent_amount ? `$${unit.rent_amount.toLocaleString()}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[unit.status]}`}>
                          {unit.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openViewModal(unit)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(unit)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(unit.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingUnit ? 'Edit Unit' : 'Add New Unit'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Unit Number"
                value={formData.unit_number}
                onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                placeholder="e.g., A101"
                required
              />
              <FormSelect
                label="Facility"
                value={formData.facility_id}
                onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
                required
              >
                <option value="">Select Facility</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </FormSelect>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Unit Type"
                value={formData.unit_type}
                onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
              >
                <option value="">Select Type</option>
                {unitTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="reserved">Reserved</option>
              </FormSelect>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormInput
                label="Floor Number"
                type="number"
                value={formData.floor_number}
                onChange={(e) => setFormData({ ...formData, floor_number: e.target.value })}
                placeholder="e.g., 2"
              />
              <FormInput
                label="Area (sqft)"
                type="number"
                step="0.01"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                placeholder="0"
              />
              <FormInput
                label="Monthly Rent"
                type="number"
                step="0.01"
                value={formData.rent_amount}
                onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                placeholder="0"
              />
              <FormInput
                label="Bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                placeholder="0"
              />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUnit ? 'Update Unit' : 'Add Unit'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Unit Details"
          size="lg"
        >
          {viewingUnit && (
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Unit {viewingUnit.unit_number}</h3>
                  <p className="text-gray-500">{(viewingUnit.facility as { name: string } | undefined)?.name || 'No facility'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{viewingUnit.unit_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[viewingUnit.status]}`}>
                    {viewingUnit.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Floor</p>
                  <p className="font-medium">{viewingUnit.floor_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Area</p>
                  <p className="font-medium">{viewingUnit.area ? `${viewingUnit.area.toLocaleString()} sqft` : 'N/A'}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Unit Details</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{viewingUnit.bedrooms || 0}</p>
                    <p className="text-sm text-gray-500">Bedrooms</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{viewingUnit.bathrooms || 0}</p>
                    <p className="text-sm text-gray-500">Bathrooms</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-indigo-600">
                      {viewingUnit.rent_amount ? `$${viewingUnit.rent_amount.toLocaleString()}` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">Monthly Rent</p>
                  </div>
                </div>
              </div>

              {viewingUnit.current_tenant_id && (
                <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                  <UserIcon className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Current Tenant</p>
                    <p className="font-medium text-gray-900">Tenant ID: {viewingUnit.current_tenant_id}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewModalOpen(false)
                  openEditModal(viewingUnit)
                }}>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Unit"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this unit? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                Delete Unit
              </Button>
            </div>
          </div>
        </Modal>
      </RoleGuard>
  )
}
