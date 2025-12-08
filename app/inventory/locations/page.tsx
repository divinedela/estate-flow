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
import { 
  BuildingLibraryIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowLeftIcon,
  GlobeAltIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface StockLocation {
  id: string
  name: string
  code: string | null
  location_type: string | null
  address: string | null
  country: string | null
  country_code: string | null
  region: string | null
  city: string | null
  postal_code: string | null
  currency: string | null
  timezone: string | null
  contact_person: string | null
  contact_email: string | null
  contact_phone: string | null
  is_active: boolean
  created_at: string
  item_count?: number
}

interface Country {
  id: string
  name: string
  code: string
  currency: string
  currency_symbol: string | null
  phone_code: string | null
  flag_emoji: string | null
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<StockLocation[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    location_type: '',
    address: '',
    country: '',
    country_code: '',
    region: '',
    city: '',
    postal_code: '',
    currency: 'USD',
    timezone: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    is_active: true,
  })

  const supabase = createClient()

  useEffect(() => {
    fetchLocations()
    fetchCountries()
  }, [])

  async function fetchCountries() {
    const { data } = await supabase
      .from('countries')
      .select('*')
      .eq('is_active', true)
      .order('name')

    setCountries((data || []) as Country[])
  }

  async function fetchLocations() {
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
      .single()

    if (!profile?.organization_id) {
      setLoading(false)
      return
    }
    
    const { data: locationsData } = await supabase
      .from('stock_locations')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('country', { ascending: true })
      .order('name', { ascending: true })

    // Get item count for each location
    const locationsWithCount = await Promise.all(
      (locationsData || []).map(async (loc) => {
        const { count } = await supabase
          .from('stock_levels')
          .select('*', { count: 'exact', head: true })
          .eq('location_id', loc.id)
        
        return { ...loc, item_count: count || 0 }
      })
    )

    setLocations(locationsWithCount as StockLocation[])
    setLoading(false)
  }

  function openCreateModal() {
    setEditingLocation(null)
    setFormData({
      name: '',
      code: '',
      location_type: '',
      address: '',
      country: '',
      country_code: '',
      region: '',
      city: '',
      postal_code: '',
      currency: 'USD',
      timezone: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      is_active: true,
    })
    setIsModalOpen(true)
  }

  function openEditModal(location: StockLocation) {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      code: location.code || '',
      location_type: location.location_type || '',
      address: location.address || '',
      country: location.country || '',
      country_code: location.country_code || '',
      region: location.region || '',
      city: location.city || '',
      postal_code: location.postal_code || '',
      currency: location.currency || 'USD',
      timezone: location.timezone || '',
      contact_person: location.contact_person || '',
      contact_email: location.contact_email || '',
      contact_phone: location.contact_phone || '',
      is_active: location.is_active,
    })
    setIsModalOpen(true)
  }

  function handleCountryChange(countryCode: string) {
    const country = countries.find(c => c.code === countryCode)
    if (country) {
      setFormData({
        ...formData,
        country: country.name,
        country_code: country.code,
        currency: country.currency,
      })
    } else {
      setFormData({
        ...formData,
        country: '',
        country_code: '',
      })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.organization_id) return
    
    const locationData = {
      name: formData.name,
      code: formData.code || null,
      location_type: formData.location_type || null,
      address: formData.address || null,
      country: formData.country || null,
      country_code: formData.country_code || null,
      region: formData.region || null,
      city: formData.city || null,
      postal_code: formData.postal_code || null,
      currency: formData.currency || 'USD',
      timezone: formData.timezone || null,
      contact_person: formData.contact_person || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      is_active: formData.is_active,
      organization_id: profile.organization_id,
    }

    if (editingLocation) {
      const { error } = await supabase
        .from('stock_locations')
        .update(locationData)
        .eq('id', editingLocation.id)

      if (error) {
        alert('Error updating location: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('stock_locations')
        .insert(locationData)

      if (error) {
        alert('Error creating location: ' + error.message)
        return
      }
    }

    setIsModalOpen(false)
    fetchLocations()
  }

  async function handleDelete(location: StockLocation) {
    if (location.item_count && location.item_count > 0) {
      alert('Cannot delete location with stock. Please transfer all items first.')
      return
    }
    
    if (confirm(`Are you sure you want to delete "${location.name}"?`)) {
      await supabase
        .from('stock_locations')
        .delete()
        .eq('id', location.id)
      
      fetchLocations()
    }
  }

  async function toggleStatus(location: StockLocation) {
    await supabase
      .from('stock_locations')
      .update({ is_active: !location.is_active })
      .eq('id', location.id)
    
    fetchLocations()
  }

  const filteredLocations = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.city?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCountry = !countryFilter || loc.country_code === countryFilter
    const matchesType = !typeFilter || loc.location_type === typeFilter
    return matchesSearch && matchesCountry && matchesType
  })

  const locationTypes = ['Warehouse', 'Store', 'Site', 'Office', 'Vehicle', 'Distribution Center', 'Factory', 'Other']
  
  // Get unique countries from locations
  const locationCountries = [...new Set(locations.map(l => l.country_code).filter(Boolean))]

  // Group locations by country for stats
  const locationsByCountry = locations.reduce((acc, loc) => {
    const country = loc.country || 'Unknown'
    acc[country] = (acc[country] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const stats = {
    total: locations.length,
    active: locations.filter(l => l.is_active).length,
    countries: Object.keys(locationsByCountry).length,
    warehouses: locations.filter(l => l.location_type === 'Warehouse').length,
  }

  const getCountryFlag = (countryCode: string | null) => {
    if (!countryCode) return '🌍'
    const country = countries.find(c => c.code === countryCode)
    return country?.flag_emoji || '🌍'
  }

  const getCurrencySymbol = (currency: string | null) => {
    if (!currency) return '$'
    const country = countries.find(c => c.currency === currency)
    return country?.currency_symbol || currency
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'inventory_officer']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/inventory">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stock Locations</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage warehouses, stores, and inventory locations across countries
                </p>
              </div>
            </div>
            <Button onClick={openCreateModal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Location
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <div className="text-center">
                <BuildingLibraryIcon className="h-8 w-8 text-gray-400 mx-auto" />
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Locations</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <GlobeAltIcon className="h-8 w-8 text-blue-500 mx-auto" />
                <p className="text-2xl font-bold text-blue-600 mt-2">{stats.countries}</p>
                <p className="text-sm text-gray-500">Countries</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{stats.warehouses}</p>
                <p className="text-sm text-gray-500">Warehouses</p>
              </div>
            </Card>
          </div>

          {/* Locations by Country */}
          {Object.keys(locationsByCountry).length > 1 && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Locations by Country</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(locationsByCountry).map(([country, count]) => {
                  const countryData = countries.find(c => c.name === country)
                  return (
                    <div key={country} className="flex items-center px-4 py-2 bg-gray-50 rounded-lg">
                      <span className="text-xl mr-2">{countryData?.flag_emoji || '🌍'}</span>
                      <div>
                        <p className="font-medium text-gray-900">{country}</p>
                        <p className="text-xs text-gray-500">{count} location{count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                />
              </div>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Countries</option>
                {locationCountries.map(code => {
                  const country = countries.find(c => c.code === code)
                  return (
                    <option key={code} value={code || ''}>
                      {country?.flag_emoji} {country?.name || code}
                    </option>
                  )
                })}
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                {locationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </Card>

          <Card>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading locations...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Location</TableHeader>
                      <TableHeader>Country / City</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Currency</TableHeader>
                      <TableHeader>Contact</TableHeader>
                      <TableHeader>Items</TableHeader>
                      <TableHeader>Status</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                          No locations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLocations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{location.name}</p>
                              {location.code && (
                                <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                                  {location.code}
                                </span>
                              )}
                              {location.address && (
                                <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">{location.address}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{getCountryFlag(location.country_code)}</span>
                              <div>
                                <p className="font-medium text-gray-900">{location.country || 'Not set'}</p>
                                {location.city && (
                                  <p className="text-xs text-gray-500">{location.city}{location.region ? `, ${location.region}` : ''}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {location.location_type || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{getCurrencySymbol(location.currency)}</span>
                            <span className="text-xs text-gray-500 ml-1">{location.currency}</span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {location.contact_person ? (
                                <>
                                  <p className="font-medium">{location.contact_person}</p>
                                  {location.contact_phone && (
                                    <p className="text-xs text-gray-500 flex items-center">
                                      <PhoneIcon className="h-3 w-3 mr-1" />
                                      {location.contact_phone}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                              {location.item_count} items
                            </span>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => toggleStatus(location)}
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                location.is_active 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }`}
                            >
                              {location.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => openEditModal(location)}
                                className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                title="Edit"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(location)}
                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingLocation ? 'Edit Location' : 'Add New Location'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info */}
            <div className="border-b pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="Location Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Warehouse"
                  required
                />
                <FormInput
                  label="Location Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., WH-001"
                />
              </div>
              <div className="mt-4">
                <FormSelect
                  label="Location Type"
                  value={formData.location_type}
                  onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                  options={[
                    { value: '', label: 'Select Type' },
                    ...locationTypes.map(type => ({ value: type, label: type }))
                  ]}
                />
              </div>
            </div>

            {/* Location/Country */}
            <div className="border-b pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                Country & Address
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Country"
                  value={formData.country_code}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  options={[
                    { value: '', label: 'Select Country' },
                    ...countries.map(c => ({ 
                      value: c.code, 
                      label: `${c.flag_emoji || ''} ${c.name}` 
                    }))
                  ]}
                />
                <FormInput
                  label="Region / State"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="e.g., California"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormInput
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g., Los Angeles"
                />
                <FormInput
                  label="Postal Code"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  placeholder="e.g., 90001"
                />
              </div>
              <div className="mt-4">
                <FormTextarea
                  label="Full Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address, building, etc."
                  rows={2}
                />
              </div>
            </div>

            {/* Currency & Timezone */}
            <div className="border-b pb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
                Currency & Timezone
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <FormSelect
                  label="Currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  options={[
                    { value: 'USD', label: '$ USD - US Dollar' },
                    { value: 'EUR', label: '€ EUR - Euro' },
                    { value: 'GBP', label: '£ GBP - British Pound' },
                    { value: 'CAD', label: 'C$ CAD - Canadian Dollar' },
                    { value: 'AUD', label: 'A$ AUD - Australian Dollar' },
                    { value: 'NGN', label: '₦ NGN - Nigerian Naira' },
                    { value: 'GHS', label: 'GH₵ GHS - Ghanaian Cedi' },
                    { value: 'ZAR', label: 'R ZAR - South African Rand' },
                    { value: 'KES', label: 'KSh KES - Kenyan Shilling' },
                    { value: 'INR', label: '₹ INR - Indian Rupee' },
                    { value: 'CNY', label: '¥ CNY - Chinese Yuan' },
                    { value: 'JPY', label: '¥ JPY - Japanese Yen' },
                    { value: 'AED', label: 'د.إ AED - UAE Dirham' },
                    { value: 'SAR', label: '﷼ SAR - Saudi Riyal' },
                    { value: 'BRL', label: 'R$ BRL - Brazilian Real' },
                    { value: 'MXN', label: '$ MXN - Mexican Peso' },
                    { value: 'SGD', label: 'S$ SGD - Singapore Dollar' },
                    { value: 'MYR', label: 'RM MYR - Malaysian Ringgit' },
                    { value: 'IDR', label: 'Rp IDR - Indonesian Rupiah' },
                    { value: 'PHP', label: '₱ PHP - Philippine Peso' },
                    { value: 'THB', label: '฿ THB - Thai Baht' },
                  ]}
                />
                <FormSelect
                  label="Timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  options={[
                    { value: '', label: 'Select Timezone' },
                    { value: 'America/New_York', label: 'Eastern Time (US)' },
                    { value: 'America/Chicago', label: 'Central Time (US)' },
                    { value: 'America/Denver', label: 'Mountain Time (US)' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
                    { value: 'Europe/London', label: 'London (GMT/BST)' },
                    { value: 'Europe/Paris', label: 'Paris (CET)' },
                    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
                    { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
                    { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
                    { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
                    { value: 'Africa/Accra', label: 'Accra (GMT)' },
                    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
                    { value: 'Asia/Kolkata', label: 'India (IST)' },
                    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
                    { value: 'Asia/Shanghai', label: 'China (CST)' },
                    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
                    { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
                  ]}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                <PhoneIcon className="h-4 w-4 inline mr-1" />
                Contact Information
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <FormInput
                  label="Contact Person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormInput
                  label="Email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="email@example.com"
                />
                <FormInput
                  label="Phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active Location
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingLocation ? 'Update Location' : 'Add Location'}
              </Button>
            </div>
          </form>
        </Modal>
      </RoleGuard>
  )
}
