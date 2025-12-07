'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'

export default function NewContactPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    phone_secondary: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    company: '',
    job_title: '',
    source: '',
    status: 'active',
    notes: '',
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

      const contactData: any = {
        organization_id: orgId,
        first_name: formData.first_name,
        last_name: formData.last_name || null,
        email: formData.email || null,
        phone: formData.phone || null,
        phone_secondary: formData.phone_secondary || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        postal_code: formData.postal_code || null,
        company: formData.company || null,
        job_title: formData.job_title || null,
        source: formData.source || null,
        status: formData.status,
        notes: formData.notes || null,
        created_by: appUserId,
      }

      const { error } = await supabase
        .from('contacts')
        .insert(contactData)

      if (error) throw error

      router.push('/marketing/contacts')
    } catch (error) {
      console.error('Error creating contact:', error)
      alert('Failed to create contact. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Contact</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enter contact information to manage customer and prospect details
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  label="Secondary Phone"
                  value={formData.phone_secondary}
                  onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
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
                <FormInput
                  label="Source"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="How they found us"
                />
                <FormSelect
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'do_not_contact', label: 'Do Not Contact' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormInput
                  label="Address"
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

              <FormTextarea
                label="Notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this contact..."
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
                  {loading ? 'Creating...' : 'Create Contact'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}

