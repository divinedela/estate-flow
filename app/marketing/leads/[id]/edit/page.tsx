'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

export default function EditLeadPage() {
  const router = useRouter()
  const params = useParams()
  const leadId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [users, setUsers] = useState<AppUser[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  
  const [formData, setFormData] = useState({
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

  // Fetch lead data and related data
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

      // Fetch lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('organization_id', orgId)
        .single()

      if (leadError || !lead) {
        console.error('Error fetching lead:', leadError)
        router.push('/marketing/leads')
        return
      }

      // Populate form with lead data
      setFormData({
        contact_id: lead.contact_id || '',
        campaign_id: lead.campaign_id || '',
        assigned_to: lead.assigned_to || '',
        lead_source: lead.lead_source || 'website',
        status: lead.status || 'new',
        priority: lead.priority || 'medium',
        interest_type: lead.interest_type || 'buy',
        budget_min: lead.budget_min ? lead.budget_min.toString() : '',
        budget_max: lead.budget_max ? lead.budget_max.toString() : '',
        preferred_location: lead.preferred_location || '',
        preferred_property_type: lead.preferred_property_type || 'apartment',
        expected_timeline: lead.expected_timeline || '',
        notes: lead.notes || '',
        next_follow_up_date: lead.next_follow_up_date 
          ? new Date(lead.next_follow_up_date).toISOString().slice(0, 16)
          : '',
      })

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

      setLoading(false)
    }

    fetchData()
  }, [leadId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('app_users')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

      if (!profile || !('organization_id' in profile)) throw new Error('User profile not found')

      const updateData: any = {
        contact_id: formData.contact_id || null,
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
      }

      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', leadId)

      if (error) throw error

      router.push(`/marketing/leads/${leadId}`)
      router.refresh()
    } catch (error) {
      console.error('Error updating lead:', error)
      alert('Failed to update lead. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-500">Loading lead...</p>
            </div>
          </div>
        </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Lead</h1>
            <p className="mt-1 text-sm text-gray-500">
              Update lead information
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lead Information */}
              <div className="border-b border-gray-200 pb-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormSelect
                    label="Contact"
                    value={formData.contact_id}
                    onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                    options={[
                      { value: '', label: 'No Contact' },
                      ...contacts.map((contact) => ({
                        value: contact.id,
                        label: `${contact.first_name} ${contact.last_name || ''} ${contact.email ? `(${contact.email})` : ''}`.trim(),
                      })),
                    ]}
                  />
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
                  onClick={() => router.push(`/marketing/leads/${leadId}`)}
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
  )
}

