import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getProperty(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) return null

  // Fetch property with related data
  const { data: property, error } = await supabase
    .from('properties')
    .select(`
      *,
      project:projects(
        id,
        name,
        project_code
      )
    `)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error || !property) return null

  return property
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await getProperty(id)

  if (!property) {
    notFound()
  }

  const statusColors: Record<string, string> = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    sold: 'bg-blue-100 text-blue-800',
    leased: 'bg-purple-100 text-purple-800',
    under_construction: 'bg-orange-100 text-orange-800',
  }

  const formatCurrency = (amount: number | null, currency: string = 'USD') => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const project = property.project as any

  return (
    <RoleGuard allowedRoles={['super_admin', 'marketing_officer', 'project_manager', 'agent', 'agent_manager', 'executive']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link href="/marketing/properties">
                  <Button variant="secondary" size="sm">
                    ← Back to Properties
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    {property.property_code || 'No Code'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/marketing/properties/${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${statusColors[property.status || 'available'] || statusColors.available}`}>
                {property.status || 'available'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Type:</span>
              <span className="ml-2 text-sm font-semibold text-gray-900 capitalize">{property.property_type}</span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Information */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Information</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Property Type</dt>
                      <dd className="mt-1 text-sm text-gray-900 capitalize">{property.property_type}</dd>
                    </div>
                    {project && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Project</dt>
                        <dd className="mt-1 text-sm text-gray-900">{project.name} ({project.project_code})</dd>
                      </div>
                    )}
                    {property.total_area && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Area</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.total_area} sq ft/m²</dd>
                      </div>
                    )}
                    {property.built_up_area && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Built-up Area</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.built_up_area} sq ft/m²</dd>
                      </div>
                    )}
                    {property.bedrooms !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Bedrooms</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.bedrooms}</dd>
                      </div>
                    )}
                    {property.bathrooms !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Bathrooms</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.bathrooms}</dd>
                      </div>
                    )}
                    {property.parking_spaces !== null && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Parking Spaces</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.parking_spaces}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>

              {/* Address Information */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Street Address</dt>
                      <dd className="mt-1 text-sm text-gray-900">{property.address}</dd>
                    </div>
                    {property.city && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">City</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.city}</dd>
                      </div>
                    )}
                    {property.state && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">State/Province</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.state}</dd>
                      </div>
                    )}
                    {property.country && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Country</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.country}</dd>
                      </div>
                    )}
                    {property.postal_code && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
                        <dd className="mt-1 text-sm text-gray-900">{property.postal_code}</dd>
                      </div>
                    )}
                    {(property.latitude || property.longitude) && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          {property.latitude}, {property.longitude}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>

              {/* Description */}
              {property.description && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{property.description}</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Pricing & Metadata */}
            <div className="space-y-6">
              {/* Pricing Information */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                  <div className="space-y-4">
                    {property.listing_price && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Listing Price (Sale)</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(Number(property.listing_price), property.currency || 'USD')}
                        </dd>
                      </div>
                    )}
                    {property.rent_price && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Rent Price</dt>
                        <dd className="mt-1 text-lg font-semibold text-gray-900">
                          {formatCurrency(Number(property.rent_price), property.currency || 'USD')}
                        </dd>
                      </div>
                    )}
                    {!property.listing_price && !property.rent_price && (
                      <p className="text-sm text-gray-500">No pricing information available</p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Metadata */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(property.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(property.updated_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </RoleGuard>
  )
}

