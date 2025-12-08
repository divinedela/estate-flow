'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'

export default function NewCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    campaign_type: 'digital',
    start_date: '',
    end_date: '',
    budget: '',
    status: 'planned',
  })

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

      const campaignData: any = {
        organization_id: orgId,
        name: formData.name,
        description: formData.description || null,
        campaign_type: formData.campaign_type || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
        created_by: appUserId,
      }

      const { error } = await supabase
        .from('campaigns')
        .insert(campaignData)

      if (error) throw error

      router.push('/marketing/campaigns')
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter campaign information to track marketing efforts
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="Campaign Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Summer Property Sale 2024"
                />
                <FormSelect
                  label="Campaign Type"
                  value={formData.campaign_type}
                  onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
                  options={[
                    { value: 'digital', label: 'Digital' },
                    { value: 'print', label: 'Print' },
                    { value: 'event', label: 'Event' },
                    { value: 'referral', label: 'Referral' },
                    { value: 'social_media', label: 'Social Media' },
                    { value: 'email', label: 'Email Marketing' },
                    { value: 'other', label: 'Other' },
                  ]}
                />
                <FormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'planned', label: 'Planned' },
                    { value: 'active', label: 'Active' },
                    { value: 'paused', label: 'Paused' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'cancelled', label: 'Cancelled' },
                  ]}
                />
                <FormInput
                  label="Budget"
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0.00"
                />
                <FormInput
                  label="Start Date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
                <FormInput
                  label="End Date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              <FormTextarea
                label="Description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Campaign description, objectives, and target audience..."
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
                  {loading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </RoleGuard>
  )
}

