import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

async function getContact(id: string) {
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

  // Fetch contact
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (error || !contact) return null

  return contact
}

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const contact = await getContact(id)

  if (!contact) {
    notFound()
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    do_not_contact: 'bg-red-100 text-red-800',
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link href="/marketing/contacts">
                  <Button variant="secondary" size="sm">
                    ← Back to Contacts
                  </Button>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {contact.first_name} {contact.last_name || ''}
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Contact Details
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/marketing/contacts/${id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span className={`ml-2 px-3 py-1 text-sm font-medium rounded-full ${statusColors[contact.status || 'active'] || statusColors.active}`}>
                {contact.status || 'active'}
              </span>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">First Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{contact.first_name}</dd>
                    </div>
                    {contact.last_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contact.last_name}</dd>
                      </div>
                    )}
                    {contact.email && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contact.email}</dd>
                      </div>
                    )}
                    {contact.phone && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Phone</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contact.phone}</dd>
                      </div>
                    )}
                    {contact.phone_secondary && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Secondary Phone</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contact.phone_secondary}</dd>
                      </div>
                    )}
                    {contact.company && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Company</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contact.company}</dd>
                      </div>
                    )}
                    {contact.job_title && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contact.job_title}</dd>
                      </div>
                    )}
                    {contact.source && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Source</dt>
                        <dd className="mt-1 text-sm text-gray-900">{contact.source}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </Card>

              {/* Address Information */}
              {(contact.address || contact.city || contact.state || contact.country || contact.postal_code) && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {contact.address && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Street Address</dt>
                          <dd className="mt-1 text-sm text-gray-900">{contact.address}</dd>
                        </div>
                      )}
                      {contact.city && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">City</dt>
                          <dd className="mt-1 text-sm text-gray-900">{contact.city}</dd>
                        </div>
                      )}
                      {contact.state && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">State/Province</dt>
                          <dd className="mt-1 text-sm text-gray-900">{contact.state}</dd>
                        </div>
                      )}
                      {contact.country && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Country</dt>
                          <dd className="mt-1 text-sm text-gray-900">{contact.country}</dd>
                        </div>
                      )}
                      {contact.postal_code && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Postal Code</dt>
                          <dd className="mt-1 text-sm text-gray-900">{contact.postal_code}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </Card>
              )}

              {/* Notes */}
              {contact.notes && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {new Date(contact.created_at).toLocaleDateString('en-US', {
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
                        {new Date(contact.updated_at).toLocaleDateString('en-US', {
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
    </MainLayout>
  )
}

