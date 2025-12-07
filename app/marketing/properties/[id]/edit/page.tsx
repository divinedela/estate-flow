'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']

export default function EditPropertyPage() {
  const router = useRouter()
  const params = useParams()
  const propertyId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState({
    property_code: '',
    name: '',
    property_type: 'apartment',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    total_area: '',
    built_up_area: '',
    bedrooms: '',
    bathrooms: '',
    parking_spaces: '',
    status: 'available',
    listing_price: '',
    rent_price: '',
    currency: 'USD',
    description: '',
    project_id: '',
  })

  // Fetch property data and projects
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

      // Fetch property
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .eq('organization_id', orgId)
        .single()

      if (propertyError || !property) {
        console.error('Error fetching property:', propertyError)
        router.push('/marketing/properties')
        return
      }

      // Populate form with property data
      setFormData({
        property_code: property.property_code || '',
        name: property.name || '',
        property_type: property.property_type || 'apartment',
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        country: property.country || '',
        postal_code: property.postal_code || '',
        latitude: property.latitude ? property.latitude.toString() : '',
        longitude: property.longitude ? property.longitude.toString() : '',
        total_area: property.total_area ? property.total_area.toString() : '',
        built_up_area: property.built_up_area ? property.built_up_area.toString() : '',
        bedrooms: property.bedrooms ? property.bedrooms.toString() : '',
        bathrooms: property.bathrooms ? property.bathrooms.toString() : '',
        parking_spaces: property.parking_spaces ? property.parking_spaces.toString() : '',
        status: property.status || 'available',
        listing_price: property.listing_price ? property.listing_price.toString() : '',
        rent_price: property.rent_price ? property.rent_price.toString() : '',
        currency: property.currency || 'USD',
        description: property.description || '',
        project_id: property.project_id || '',
      })

      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, project_code')
        .eq('organization_id', orgId)
        .order('name')

      if (projectsData) {
        setProjects(projectsData as Project[])
      }

      setLoading(false)
    }

    fetchData()
  }, [propertyId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const updateData: any = {
        property_code: formData.property_code || null,
        name: formData.name,
        property_type: formData.property_type,
        address: formData.address,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        total_area: formData.total_area ? parseFloat(formData.total_area) : null,
        built_up_area: formData.built_up_area ? parseFloat(formData.built_up_area) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        parking_spaces: formData.parking_spaces ? parseInt(formData.parking_spaces) : null,
        status: formData.status,
        listing_price: formData.listing_price ? parseFloat(formData.listing_price) : null,
        rent_price: formData.rent_price ? parseFloat(formData.rent_price) : null,
        currency: formData.currency,
        description: formData.description || null,
        project_id: formData.project_id || null,
      }

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)

      if (error) throw error

      router.push(`/marketing/properties/${propertyId}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating property:', error)
      alert('Failed to update property. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <RoleGuard allowedRoles={['super_admin', 'marketing_officer', 'project_manager']}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Loading property...</p>
            </div>
          </div>
        </RoleGuard>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer', 'project_manager']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update property information
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="Property Code"
                  value={formData.property_code}
                  onChange={(e) => setFormData({ ...formData, property_code: e.target.value })}
                  placeholder="e.g., PROP-2024-001"
                />
                <FormInput
                  label="Property Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Luxury Apartment Complex"
                />
                <FormSelect
                  label="Property Type"
                  required
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  options={[
                    { value: 'apartment', label: 'Apartment' },
                    { value: 'villa', label: 'Villa' },
                    { value: 'office', label: 'Office' },
                    { value: 'shop', label: 'Shop' },
                    { value: 'land', label: 'Land' },
                    { value: 'warehouse', label: 'Warehouse' },
                  ]}
                />
                <FormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'available', label: 'Available' },
                    { value: 'reserved', label: 'Reserved' },
                    { value: 'sold', label: 'Sold' },
                    { value: 'leased', label: 'Leased' },
                    { value: 'under_construction', label: 'Under Construction' },
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

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="Address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street Address"
                />
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
                  placeholder="12345"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="Latitude (Optional)"
                  type="number"
                  step="0.00000001"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 5.6037"
                />
                <FormInput
                  label="Longitude (Optional)"
                  type="number"
                  step="0.00000001"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., -0.1870"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <FormInput
                  label="Total Area (sq ft/m²)"
                  type="number"
                  step="0.01"
                  value={formData.total_area}
                  onChange={(e) => setFormData({ ...formData, total_area: e.target.value })}
                  placeholder="0.00"
                />
                <FormInput
                  label="Built-up Area (sq ft/m²)"
                  type="number"
                  step="0.01"
                  value={formData.built_up_area}
                  onChange={(e) => setFormData({ ...formData, built_up_area: e.target.value })}
                  placeholder="0.00"
                />
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
                <FormInput
                  label="Parking Spaces"
                  type="number"
                  value={formData.parking_spaces}
                  onChange={(e) => setFormData({ ...formData, parking_spaces: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="Listing Price (Sale)"
                  type="number"
                  step="0.01"
                  value={formData.listing_price}
                  onChange={(e) => setFormData({ ...formData, listing_price: e.target.value })}
                  placeholder="0.00"
                />
                <FormInput
                  label="Rent Price"
                  type="number"
                  step="0.01"
                  value={formData.rent_price}
                  onChange={(e) => setFormData({ ...formData, rent_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <FormTextarea
                label="Description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Property description, features, and details..."
              />

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push(`/marketing/properties/${propertyId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}

