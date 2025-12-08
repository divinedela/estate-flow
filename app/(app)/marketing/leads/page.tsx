import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

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
      qualified: 0,
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
      qualified: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      converted: 0,
    }
  }

  const orgId = profile.organization_id

  // Fetch all leads to calculate stats
  const { data: allLeads } = await supabase
    .from('leads')
    .select('status, temperature')
    .eq('organization_id', orgId)

  const leads = allLeads || []
  
  // Stage counts
  const newLeads = leads.filter(l => l.status === 'new').length
  const contacted = leads.filter(l => l.status === 'contacted').length
  const qualified = leads.filter(l => l.status === 'qualified').length
  const converted = leads.filter(l => l.status === 'converted').length
  
  // Temperature counts (using temperature field, fallback to status for backwards compatibility)
  const hot = leads.filter(l => l.temperature === 'hot' || (!l.temperature && l.status === 'hot')).length
  const warm = leads.filter(l => l.temperature === 'warm' || (!l.temperature && l.status === 'warm')).length
  const cold = leads.filter(l => l.temperature === 'cold' || (!l.temperature && l.status === 'cold')).length

  return {
    all: leads.length,
    new: newLeads,
    contacted,
    qualified,
    hot,
    warm,
    cold,
    converted,
  }
}

export default async function LeadsPage() {
  const leads = await getLeads()
  const stats = await getLeadStats()

  const stageColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    qualified: 'bg-purple-100 text-purple-800',
    negotiating: 'bg-indigo-100 text-indigo-800',
    converted: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
  }

  const temperatureConfig: Record<string, { bg: string; icon: string }> = {
    hot: { bg: 'bg-red-100 text-red-700', icon: '🔥' },
    warm: { bg: 'bg-orange-100 text-orange-700', icon: '☀️' },
    cold: { bg: 'bg-blue-100 text-blue-700', icon: '❄️' },
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
                  <span className="text-sm text-gray-500">Leads</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              </div>
            </div>
            <Link href="/marketing/leads/new">
              <Button>Add Lead</Button>
            </Link>
          </div>

          {/* Stage Filters */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">By Stage</p>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Button variant="secondary" className="whitespace-nowrap">All ({stats.all})</Button>
              <Button variant="secondary" className="whitespace-nowrap">🆕 New ({stats.new})</Button>
              <Button variant="secondary" className="whitespace-nowrap">📞 Contacted ({stats.contacted})</Button>
              <Button variant="secondary" className="whitespace-nowrap">✅ Qualified ({stats.qualified})</Button>
              <Button variant="secondary" className="whitespace-nowrap">🎉 Converted ({stats.converted})</Button>
            </div>
          </div>
          
          {/* Temperature Filters */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">By Temperature</p>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              <Button variant="secondary" className="whitespace-nowrap bg-red-50 hover:bg-red-100 border-red-200">🔥 Hot ({stats.hot})</Button>
              <Button variant="secondary" className="whitespace-nowrap bg-orange-50 hover:bg-orange-100 border-orange-200">☀️ Warm ({stats.warm})</Button>
              <Button variant="secondary" className="whitespace-nowrap bg-blue-50 hover:bg-blue-100 border-blue-200">❄️ Cold ({stats.cold})</Button>
            </div>
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search leads..."
                className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Stages</option>
                <option value="new">🆕 New</option>
                <option value="contacted">📞 Contacted</option>
                <option value="qualified">✅ Qualified</option>
                <option value="negotiating">🤝 Negotiating</option>
                <option value="converted">🎉 Converted</option>
                <option value="lost">❌ Lost</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All Temperatures</option>
                <option value="hot">🔥 Hot</option>
                <option value="warm">☀️ Warm</option>
                <option value="cold">❄️ Cold</option>
              </select>
            </div>

            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Source</TableHeader>
                  <TableHeader>Stage</TableHeader>
                  <TableHeader>Temperature</TableHeader>
                  <TableHeader>Priority</TableHeader>
                  <TableHeader>Next Follow-up</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
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
                    
                    // Get temperature (use temperature field, fallback to status for backwards compatibility)
                    const temp = lead.temperature || (['hot', 'warm', 'cold'].includes(lead.status) ? lead.status : 'warm')
                    const tempConfig = temperatureConfig[temp] || temperatureConfig.warm

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
                        <TableCell className="capitalize">{(lead.lead_source || 'direct').replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageColors[lead.status || 'new'] || stageColors.new}`}>
                            {lead.status || 'new'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${tempConfig.bg}`}>
                            {tempConfig.icon} {temp}
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
  )
}



