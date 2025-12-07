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

type Project = Database['public']['Tables']['projects']['Row']

export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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

  // Fetch projects
  useEffect(() => {
    async function fetchProjects() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('app_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: projectsData } = await supabase
        .from('projects')
        .select('id, name, project_code')
        .eq('organization_id', profile.organization_id)
        .order('name')

      if (projectsData) {
        setProjects(projectsData as Project[])
      }
    }

    fetchProjects()
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

      const propertyData: any = {
        organization_id: orgId,
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
        created_by: appUserId,
      }

      const { error } = await supabase
        .from('properties')
        .insert(propertyData)

      if (error) throw error

      router.push('/marketing/properties')
    } catch (error) {
      console.error('Error creating property:', error)
      alert('Failed to create property. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer', 'project_manager']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter property information to create a new listing
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
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Property'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}

