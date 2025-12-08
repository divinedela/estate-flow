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
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BuildingStorefrontIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'

interface Facility {
  id: string
  facility_code: string
  name: string
  facility_type: string | null
  address: string
  city: string | null
  state: string | null
  country: string | null
  postal_code: string | null
  total_units: number | null
  total_area: number | null
  year_built: number | null
  status: string
  created_at: string
}

interface AppUser {
  id: string
  organization_id: string
}

export default function FacilitiesListPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null)
  const [viewingFacility, setViewingFacility] = useState<Facility | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    facility_code: '',
    name: '',
    facility_type: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    total_units: '',
    total_area: '',
    year_built: '',
    status: 'active',
  })

  const supabase = createClient()

  useEffect(() => {
    fetchFacilities()
  }, [])

  async function fetchFacilities() {
    setLoading(true)
    
    const { data } = await supabase
      .from('facilities')
      .select('*')
      .order('created_at', { ascending: false })

    setFacilities((data as Facility[]) || [])
    setLoading(false)
  }

  function generateFacilityCode() {
    const prefix = 'FAC'
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${timestamp}`
  }

  function openCreateModal() {
    setEditingFacility(null)
    setFormData({
      facility_code: generateFacilityCode(),
      name: '',
      facility_type: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      total_units: '',
      total_area: '',
      year_built: '',
      status: 'active',
    })
    setIsModalOpen(true)
  }

  function openEditModal(facility: Facility) {
    setEditingFacility(facility)
    setFormData({
      facility_code: facility.facility_code,
      name: facility.name,
      facility_type: facility.facility_type || '',
      address: facility.address,
      city: facility.city || '',
      state: facility.state || '',
      country: facility.country || '',
      postal_code: facility.postal_code || '',
      total_units: facility.total_units?.toString() || '',
      total_area: facility.total_area?.toString() || '',
      year_built: facility.year_built?.toString() || '',
      status: facility.status,
    })
    setIsModalOpen(true)
  }

  function openViewModal(facility: Facility) {
    setViewingFacility(facility)
    setIsViewModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    // Get user's organization_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: appUser } = await supabase
      .from('app_users')
      .select('id, organization_id')
      .eq('auth_user_id', user.id)
      .single() as { data: AppUser | null; error: unknown }

    if (!appUser) return

    const facilityData = {
      facility_code: formData.facility_code,
      name: formData.name,
      facility_type: formData.facility_type || null,
      address: formData.address,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      postal_code: formData.postal_code || null,
      total_units: formData.total_units ? parseInt(formData.total_units) : null,
      total_area: formData.total_area ? parseFloat(formData.total_area) : null,
      year_built: formData.year_built ? parseInt(formData.year_built) : null,
      status: formData.status,
      organization_id: appUser.organization_id,
    }

    if (editingFacility) {
      await supabase
        .from('facilities')
        .update(facilityData)
        .eq('id', editingFacility.id)
    } else {
      await supabase
        .from('facilities')
        .insert({
          ...facilityData,
          created_by: appUser.id,
        })
    }

    setIsModalOpen(false)
    fetchFacilities()
  }

  async function handleDelete(id: string) {
    await supabase
      .from('facilities')
      .delete()
      .eq('id', id)
    
    setDeleteConfirmId(null)
    fetchFacilities()
  }

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.facility_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      facility.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (facility.city || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = !typeFilter || facility.facility_type === typeFilter
    const matchesStatus = !statusFilter || facility.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const facilityTypes = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'mixed_use', label: 'Mixed Use' },
    { value: 'office', label: 'Office' },
    { value: 'retail', label: 'Retail' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'warehouse', label: 'Warehouse' },
  ]

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'under_construction', label: 'Under Construction' },
    { value: 'renovation', label: 'Renovation' },
    { value: 'closed', label: 'Closed' },
  ]

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    under_construction: 'bg-yellow-100 text-yellow-800',
    renovation: 'bg-orange-100 text-orange-800',
    closed: 'bg-gray-100 text-gray-800',
  }

  const typeColors: Record<string, string> = {
    residential: 'bg-green-100 text-green-800',
    commercial: 'bg-blue-100 text-blue-800',
    mixed_use: 'bg-purple-100 text-purple-800',
    office: 'bg-indigo-100 text-indigo-800',
    retail: 'bg-pink-100 text-pink-800',
    industrial: 'bg-gray-100 text-gray-800',
    warehouse: 'bg-amber-100 text-amber-800',
  }

  const stats = {
    total: facilities.length,
    active: facilities.filter(f => f.status === 'active').length,
    underConstruction: facilities.filter(f => f.status === 'under_construction').length,
    totalUnits: facilities.reduce((sum, f) => sum + (f.total_units || 0), 0),
    totalArea: facilities.reduce((sum, f) => sum + (f.total_area || 0), 0),
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'facility_manager', 'executive']}>
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
                <h1 className="text-2xl font-bold text-gray-900">Facilities</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage all facilities and estates
                </p>
              </div>
            </div>
            <Button onClick={openCreateModal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Facility
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <div className="text-center p-4">
                <BuildingOfficeIcon className="h-8 w-8 text-blue-500 mx-auto" />
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Facilities</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-yellow-600">{stats.underConstruction}</p>
                <p className="text-sm text-gray-500">Under Construction</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-purple-600">{stats.totalUnits}</p>
                <p className="text-sm text-gray-500">Total Units</p>
              </div>
            </Card>
            <Card>
              <div className="text-center p-4">
                <p className="text-2xl font-bold text-indigo-600">{stats.totalArea.toLocaleString()}</p>
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
                  placeholder="Search facilities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {facilityTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading facilities...</p>
              </div>
            ) : filteredFacilities.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No facilities found</h3>
                <p className="mt-2 text-gray-500">Get started by adding your first facility.</p>
                <Button onClick={openCreateModal} className="mt-4">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Facility
                </Button>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Facility</TableHeader>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Location</TableHeader>
                    <TableHeader>Units</TableHeader>
                    <TableHeader>Area</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredFacilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                            <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{facility.name}</p>
                            <p className="text-sm text-gray-500">{facility.facility_code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {facility.facility_type ? (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[facility.facility_type] || 'bg-gray-100 text-gray-800'}`}>
                            {facility.facility_type.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {facility.city || facility.state || facility.address || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <BuildingStorefrontIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {facility.total_units || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        {facility.total_area ? `${facility.total_area.toLocaleString()} sqft` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[facility.status]}`}>
                          {facility.status.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openViewModal(facility)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => openEditModal(facility)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(facility.id)}
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
          title={editingFacility ? 'Edit Facility' : 'Add New Facility'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Facility Code"
                value={formData.facility_code}
                onChange={(e) => setFormData({ ...formData, facility_code: e.target.value })}
                placeholder="FAC-001"
                required
                disabled={!!editingFacility}
              />
              <FormInput
                label="Facility Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sunrise Towers"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Facility Type"
                value={formData.facility_type}
                onChange={(e) => setFormData({ ...formData, facility_type: e.target.value })}
              >
                <option value="">Select Type</option>
                {facilityTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </FormSelect>
              <FormSelect
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </FormSelect>
            </div>

            <FormTextarea
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full street address"
              rows={2}
              required
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormInput
                label="City"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="City"
              />
              <FormInput
                label="State/Province"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="State"
              />
              <FormInput
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Country"
              />
              <FormInput
                label="Postal Code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="Postal Code"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormInput
                label="Total Units"
                type="number"
                value={formData.total_units}
                onChange={(e) => setFormData({ ...formData, total_units: e.target.value })}
                placeholder="0"
              />
              <FormInput
                label="Total Area (sqft)"
                type="number"
                step="0.01"
                value={formData.total_area}
                onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                placeholder="0"
              />
              <FormInput
                label="Year Built"
                type="number"
                value={formData.year_built}
                onChange={(e) => setFormData({ ...formData, year_built: e.target.value })}
                placeholder="e.g., 2020"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingFacility ? 'Update Facility' : 'Create Facility'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Facility Details"
          size="lg"
        >
          {viewingFacility && (
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="h-16 w-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{viewingFacility.name}</h3>
                  <p className="text-gray-500">{viewingFacility.facility_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{viewingFacility.facility_type?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[viewingFacility.status]}`}>
                    {viewingFacility.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{viewingFacility.address}</p>
                <p className="text-gray-600">
                  {[viewingFacility.city, viewingFacility.state, viewingFacility.postal_code, viewingFacility.country]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-600">{viewingFacility.total_units || 0}</p>
                  <p className="text-sm text-gray-500">Units</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-600">{viewingFacility.total_area?.toLocaleString() || 0}</p>
                  <p className="text-sm text-gray-500">Total Area (sqft)</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-600">{viewingFacility.year_built || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Year Built</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewModalOpen(false)
                  openEditModal(viewingFacility)
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
          title="Delete Facility"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this facility? This action cannot be undone and will also remove all associated units and maintenance records.
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
                Delete Facility
              </Button>
            </div>
          </div>
        </Modal>
      </RoleGuard>
  )
}

