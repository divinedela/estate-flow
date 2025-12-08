import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getLeads() {
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

  // Fetch leads with contact information
  const { data: leads, error } = await supabase
    .from('leads')
    .select(`
      *,
      contact:contacts(
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      assigned_user:app_users!leads_assigned_to_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    return []
  }

  return leads || []
}

async function getLeadStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      all: 0,
      new: 0,
      contacted: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      converted: 0,
    }
  }

  // Get user's organization
  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      all: 0,
      new: 0,
      contacted: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      converted: 0,
    }
  }

  const orgId = profile.organization_id

  // Fetch counts by status
  const { count: all } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: newLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'new')

  const { count: contacted } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'contacted')

  const { count: hot } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'hot')

  const { count: warm } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'warm')

  const { count: cold } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'cold')

  const { count: converted } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'converted')

  return {
    all: all || 0,
    new: newLeads || 0,
    contacted: contacted || 0,
    hot: hot || 0,
    warm: warm || 0,
    cold: cold || 0,
    converted: converted || 0,
  }
}

export default async function LeadsPage() {
  const leads = await getLeads()
  const stats = await getLeadStats()

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    hot: 'bg-red-100 text-red-800',
    warm: 'bg-orange-100 text-orange-800',
    cold: 'bg-gray-100 text-gray-800',
    converted: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-red-100 text-red-800',
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track your sales pipeline
              </p>
            </div>
            <Link href="/marketing/leads/new">
              <Button>Add Lead</Button>
            </Link>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button variant="secondary" className="whitespace-nowrap">All ({stats.all})</Button>
            <Button variant="secondary" className="whitespace-nowrap">New ({stats.new})</Button>
            <Button variant="secondary" className="whitespace-nowrap">Contacted ({stats.contacted})</Button>
            <Button variant="secondary" className="whitespace-nowrap">Hot ({stats.hot})</Button>
            <Button variant="secondary" className="whitespace-nowrap">Warm ({stats.warm})</Button>
            <Button variant="secondary" className="whitespace-nowrap">Cold ({stats.cold})</Button>
            <Button variant="secondary" className="whitespace-nowrap">Converted ({stats.converted})</Button>
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <input
                type="text"
                placeholder="Search leads..."
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
                <option value="converted">Converted</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Source</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Next Follow-up</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      No leads found. <Link href="/marketing/leads/new" className="text-indigo-600 hover:text-indigo-500">Add your first lead</Link>
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead: any) => {
                    const contact = lead.contact as any
                    const assignedUser = lead.assigned_user as any
                    const contactName = contact 
                      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'N/A'
                      : 'No Contact'
                    const contactInfo = contact 
                      ? contact.email || contact.phone || ''
                      : ''

                    return (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{contactName}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {contactInfo && <div>{contactInfo}</div>}
                            {assignedUser && (
                              <div className="text-gray-500 text-xs mt-1">
                                Assigned: {assignedUser.full_name || assignedUser.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{lead.lead_source || 'N/A'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[lead.status || 'new'] || statusColors.new}`}>
                            {lead.status || 'new'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[lead.priority || 'medium'] || priorityColors.medium}`}>
                            {lead.priority || 'medium'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(lead.next_follow_up_date)}</TableCell>
                        <TableCell>
                          <Link href={`/marketing/leads/${lead.id}`} className="text-indigo-600 hover:text-indigo-500 text-sm">
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



