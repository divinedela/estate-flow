import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getProperties() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) return []

  // Fetch properties
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching properties:', error)
    return []
  }

  return properties || []
}

export default async function PropertiesPage() {
  const properties = await getProperties()

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

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer', 'project_manager']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage property listings and units
              </p>
            </div>
            <Link href="/marketing/properties/new">
              <Button>Add Property</Button>
            </Link>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search properties..."
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Types</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="office">Office</option>
                <option value="shop">Shop</option>
                <option value="land">Land</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Property Code</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Price</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {properties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No properties found. <Link href="/marketing/properties/new" className="text-indigo-600 hover:text-indigo-500">Add your first property</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  properties.map((property) => {
                    const price = property.listing_price 
                      ? formatCurrency(Number(property.listing_price), property.currency || 'USD')
                      : property.rent_price
                      ? formatCurrency(Number(property.rent_price), property.currency || 'USD')
                      : 'N/A'
                    
                    return (
                      <TableRow key={property.id}>
                        <TableCell className="font-medium">{property.property_code || 'N/A'}</TableCell>
                        <TableCell>{property.name}</TableCell>
                        <TableCell className="capitalize">{property.property_type}</TableCell>
                        <TableCell>{property.city || property.address || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[property.status || 'available'] || statusColors.available}`}>
                            {property.status || 'available'}
                          </span>
                        </TableCell>
                        <TableCell>{price}</TableCell>
                        <TableCell>
                          <Link href={`/marketing/properties/${property.id}`} className="text-indigo-600 hover:text-indigo-500 text-sm">
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}



