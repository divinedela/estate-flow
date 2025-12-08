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

type AppUser = Database['public']['Tables']['app_users']['Row']
type Campaign = Database['public']['Tables']['campaigns']['Row']
type Contact = Database['public']['Tables']['contacts']['Row']

export default function NewLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<AppUser[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [createNewContact, setCreateNewContact] = useState(true)
  
  const [formData, setFormData] = useState({
    // Contact information (if creating new)
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    job_title: '',
    
    // Lead information
    contact_id: '',
    campaign_id: '',
    assigned_to: '',
    lead_source: 'website',
    status: 'new',
    priority: 'medium',
    interest_type: 'buy',
    budget_min: '',
    budget_max: '',
    preferred_location: '',
    preferred_property_type: 'apartment',
    expected_timeline: '',
    notes: '',
    next_follow_up_date: '',
  })

  // Fetch users, campaigns, and contacts
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

      // Fetch users for assignment
      const { data: usersData } = await supabase
        .from('app_users')
        .select('id, full_name, email')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('full_name')

      if (usersData) {
        setUsers(usersData as AppUser[])
      }

      // Fetch campaigns
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name')

      if (campaignsData) {
        setCampaigns(campaignsData as Campaign[])
      }

      // Fetch contacts
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .eq('organization_id', orgId)
        .eq('status', 'active')
        .order('first_name')

      if (contactsData) {
        setContacts(contactsData as Contact[])
      }
    }

    fetchData()
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

      let contactId = formData.contact_id

      // Create new contact if needed
      if (createNewContact && formData.first_name) {
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            organization_id: orgId,
            first_name: formData.first_name,
            last_name: formData.last_name || null,
            email: formData.email || null,
            phone: formData.phone || null,
            company: formData.company || null,
            job_title: formData.job_title || null,
            created_by: appUserId,
          })
          .select('id')
          .single()

        if (contactError) throw contactError
        if (newContact) contactId = newContact.id
      }

      // Create lead
      const leadData: any = {
        organization_id: orgId,
        contact_id: contactId || null,
        campaign_id: formData.campaign_id || null,
        assigned_to: formData.assigned_to || null,
        lead_source: formData.lead_source,
        status: formData.status,
        priority: formData.priority,
        interest_type: formData.interest_type || null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        preferred_location: formData.preferred_location || null,
        preferred_property_type: formData.preferred_property_type || null,
        expected_timeline: formData.expected_timeline || null,
        notes: formData.notes || null,
        next_follow_up_date: formData.next_follow_up_date || null,
        created_by: appUserId,
      }

      const { error } = await supabase
        .from('leads')
        .insert(leadData)

      if (error) throw error

      router.push('/marketing/leads')
    } catch (error) {
      console.error('Error creating lead:', error)
      alert('Failed to create lead. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Lead</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter lead information to track potential customers
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Selection */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={createNewContact}
                      onChange={() => setCreateNewContact(true)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Create New Contact</span>
                  </label>
                  <label className="flex items-center mt-2">
                    <input
                      type="radio"
                      checked={!createNewContact}
                      onChange={() => setCreateNewContact(false)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Use Existing Contact</span>
                  </label>
                </div>

                {createNewContact ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormInput
                      label="First Name"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="John"
                    />
                    <FormInput
                      label="Last Name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="Doe"
                    />
                    <FormInput
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.doe@example.com"
                    />
                    <FormInput
                      label="Phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1234567890"
                    />
                    <FormInput
                      label="Company"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Company Name"
                    />
                    <FormInput
                      label="Job Title"
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      placeholder="Job Title"
                    />
                  </div>
                ) : (
                  <FormSelect
                    label="Select Contact"
                    value={formData.contact_id}
                    onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                    options={[
                      { value: '', label: 'Select a contact' },
                      ...contacts.map((contact) => ({
                        value: contact.id,
                        label: `${contact.first_name} ${contact.last_name || ''} ${contact.email ? `(${contact.email})` : ''}`.trim(),
                      })),
                    ]}
                  />
                )}
              </div>

              {/* Lead Information */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormSelect
                    label="Lead Source"
                    required
                    value={formData.lead_source}
                    onChange={(e) => setFormData({ ...formData, lead_source: e.target.value })}
                    options={[
                      { value: 'website', label: 'Website' },
                      { value: 'referral', label: 'Referral' },
                      { value: 'walk_in', label: 'Walk-in' },
                      { value: 'campaign', label: 'Campaign' },
                      { value: 'social_media', label: 'Social Media' },
                      { value: 'phone', label: 'Phone' },
                      { value: 'email', label: 'Email' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                  <FormSelect
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { value: 'new', label: 'New' },
                      { value: 'contacted', label: 'Contacted' },
                      { value: 'qualified', label: 'Qualified' },
                      { value: 'hot', label: 'Hot' },
                      { value: 'warm', label: 'Warm' },
                      { value: 'cold', label: 'Cold' },
                      { value: 'converted', label: 'Converted' },
                      { value: 'lost', label: 'Lost' },
                    ]}
                  />
                  <FormSelect
                    label="Priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                    ]}
                  />
                  <FormSelect
                    label="Interest Type"
                    value={formData.interest_type}
                    onChange={(e) => setFormData({ ...formData, interest_type: e.target.value })}
                    options={[
                      { value: 'buy', label: 'Buy' },
                      { value: 'rent', label: 'Rent' },
                      { value: 'invest', label: 'Invest' },
                    ]}
                  />
                  <FormSelect
                    label="Campaign"
                    value={formData.campaign_id}
                    onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                    options={[
                      { value: '', label: 'No Campaign' },
                      ...campaigns.map((campaign) => ({
                        value: campaign.id,
                        label: campaign.name,
                      })),
                    ]}
                  />
                  <FormSelect
                    label="Assigned To"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...users.map((user) => ({
                        value: user.id,
                        label: user.full_name || user.email || 'Unknown',
                      })),
                    ]}
                  />
                </div>
              </div>

              {/* Property Preferences */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Preferences</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormSelect
                    label="Preferred Property Type"
                    value={formData.preferred_property_type}
                    onChange={(e) => setFormData({ ...formData, preferred_property_type: e.target.value })}
                    options={[
                      { value: 'apartment', label: 'Apartment' },
                      { value: 'villa', label: 'Villa' },
                      { value: 'office', label: 'Office' },
                      { value: 'shop', label: 'Shop' },
                      { value: 'land', label: 'Land' },
                      { value: 'warehouse', label: 'Warehouse' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                  <FormInput
                    label="Preferred Location"
                    value={formData.preferred_location}
                    onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
                    placeholder="e.g., Downtown, Suburbs"
                  />
                  <FormInput
                    label="Budget Min"
                    type="number"
                    step="0.01"
                    value={formData.budget_min}
                    onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                    placeholder="0.00"
                  />
                  <FormInput
                    label="Budget Max"
                    type="number"
                    step="0.01"
                    value={formData.budget_max}
                    onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                    placeholder="0.00"
                  />
                  <FormInput
                    label="Expected Timeline"
                    value={formData.expected_timeline}
                    onChange={(e) => setFormData({ ...formData, expected_timeline: e.target.value })}
                    placeholder="e.g., 3 months, 6 months"
                  />
                  <FormInput
                    label="Next Follow-up Date"
                    type="datetime-local"
                    value={formData.next_follow_up_date}
                    onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <FormTextarea
                  label="Notes"
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about this lead..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Lead'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}

