import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

async function getContacts() {
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

  // Fetch contacts
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching contacts:', error)
    return []
  }

  return contacts || []
}

export default async function ContactsPage() {
  const contacts = await getContacts()

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    do_not_contact: 'bg-red-100 text-red-800',
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/marketing" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <Link href="/marketing" className="text-sm text-indigo-600 hover:text-indigo-500">Marketing</Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm text-gray-500">Contacts</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              </div>
            </div>
            <Link href="/marketing/contacts/new">
              <Button>Add Contact</Button>
            </Link>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search contacts..."
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Phone</TableHeader>
                  <TableHeader>Company</TableHeader>
                  <TableHeader>Source</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No contacts found. <Link href="/marketing/contacts/new" className="text-indigo-600 hover:text-indigo-500">Add your first contact</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        {contact.first_name} {contact.last_name || ''}
                      </TableCell>
                      <TableCell>{contact.email || 'N/A'}</TableCell>
                      <TableCell>{contact.phone || 'N/A'}</TableCell>
                      <TableCell>{contact.company || 'N/A'}</TableCell>
                      <TableCell>{contact.source || 'N/A'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[contact.status || 'active'] || statusColors.active}`}>
                          {contact.status || 'active'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/marketing/contacts/${contact.id}`} className="text-indigo-600 hover:text-indigo-500 text-sm">
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </RoleGuard>
  )
}



