import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  FireIcon,
  UserPlusIcon,
  MegaphoneIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UsersIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline'

interface Contact {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
}

interface Lead {
  id: string
  contact_id: string | null
  contact: Contact | null
  status: string
  temperature: string | null
  lead_source: string | null
  priority: string | null
  interest_type: string | null
  budget_min: number | null
  budget_max: number | null
  preferred_location: string | null
  preferred_property_type: string | null
  notes: string | null
  created_at: string
}

interface Campaign {
  id: string
  name: string
  status: string
  start_date: string | null
  end_date: string | null
  budget: number | null
  leads_generated: number
}

interface Property {
  id: string
  name: string
  status: string
  price: number | null
  property_type: string | null
}

async function getMarketingStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalLeads: 0,
      newLeadsThisWeek: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      convertedLeads: 0,
      activeCampaigns: 0,
      totalCampaigns: 0,
      totalProperties: 0,
      availableProperties: 0,
      totalContacts: 0,
      conversionRate: 0,
      recentLeads: [] as Lead[],
      activeCampaignsList: [] as Campaign[],
      leadsBySource: [] as { source: string; count: number }[],
      leadsByStatus: [] as { status: string; count: number }[],
    }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      totalLeads: 0,
      newLeadsThisWeek: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      convertedLeads: 0,
      activeCampaigns: 0,
      totalCampaigns: 0,
      totalProperties: 0,
      availableProperties: 0,
      totalContacts: 0,
      conversionRate: 0,
      recentLeads: [] as Lead[],
      activeCampaignsList: [] as Campaign[],
      leadsBySource: [] as { source: string; count: number }[],
      leadsByStatus: [] as { status: string; count: number }[],
    }
  }

  const orgId = profile.organization_id
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  // Fetch all leads with contact information
  const { data: allLeads } = await supabase
    .from('leads')
    .select(`
      *,
      contact:contacts(
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const leads = (allLeads || []) as Lead[]
  const totalLeads = leads.length
  const newLeadsThisWeek = leads.filter(l => new Date(l.created_at) >= oneWeekAgo).length
  // Temperature-based counts (using temperature field, fallback to status for backwards compatibility)
  const hotLeads = leads.filter(l => l.temperature === 'hot' || (!l.temperature && l.status === 'hot')).length
  const warmLeads = leads.filter(l => l.temperature === 'warm' || (!l.temperature && l.status === 'warm')).length
  const coldLeads = leads.filter(l => l.temperature === 'cold' || (!l.temperature && l.status === 'cold')).length
  // Stage-based counts
  const convertedLeads = leads.filter(l => l.status === 'converted').length
  const recentLeads = leads.slice(0, 5)

  // Leads by source
  const sourceMap = new Map<string, number>()
  leads.forEach(l => {
    const source = l.lead_source || 'Direct'
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
  })
  const leadsBySource = Array.from(sourceMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Leads by status
  const statusMap = new Map<string, number>()
  leads.forEach(l => {
    statusMap.set(l.status, (statusMap.get(l.status) || 0) + 1)
  })
  const leadsByStatus = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count }))

  // Campaigns
  const { data: allCampaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const campaigns = (allCampaigns || []) as Campaign[]
  const totalCampaigns = campaigns.length
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const activeCampaignsList = campaigns.filter(c => c.status === 'active').slice(0, 3)

  // Properties
  const { count: totalProperties } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  const { count: availableProperties } = await supabase
    .from('properties')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'available')

  // Contacts
  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Conversion rate
  const conversionRate = totalLeads > 0
    ? Math.round((convertedLeads / totalLeads) * 100)
    : 0

  return {
    totalLeads,
    newLeadsThisWeek,
    hotLeads,
    warmLeads,
    coldLeads,
    convertedLeads,
    activeCampaigns,
    totalCampaigns,
    totalProperties: totalProperties || 0,
    availableProperties: availableProperties || 0,
    totalContacts: totalContacts || 0,
    conversionRate,
    recentLeads,
    activeCampaignsList,
    leadsBySource,
    leadsByStatus,
  }
}

export default async function MarketingPage() {
  const stats = await getMarketingStats()

  const quickLinks = [
    { name: 'Leads', href: '/marketing/leads', icon: FireIcon, color: 'bg-red-500', description: 'Manage sales leads' },
    { name: 'Contacts', href: '/marketing/contacts', icon: PhoneIcon, color: 'bg-blue-500', description: 'Customer contacts' },
    { name: 'Properties', href: '/marketing/properties', icon: BuildingStorefrontIcon, color: 'bg-green-500', description: 'Property listings' },
    { name: 'Campaigns', href: '/marketing/campaigns', icon: MegaphoneIcon, color: 'bg-purple-500', description: 'Marketing campaigns' },
  ]

  const statusColors: Record<string, string> = {
    hot: 'bg-red-500',
    warm: 'bg-orange-500',
    cold: 'bg-blue-500',
    new: 'bg-green-500',
    contacted: 'bg-yellow-500',
    qualified: 'bg-purple-500',
    converted: 'bg-emerald-500',
    lost: 'bg-gray-500',
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'marketing_officer', 'executive']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketing & CRM</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage leads, campaigns, properties, and customer relationships
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/marketing/leads/new">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Add Lead
                </button>
              </Link>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Leads</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalLeads}</p>
                  <div className="flex items-center mt-2 text-red-100 text-xs">
                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                    {stats.newLeadsThisWeek} new this week
                  </div>
                </div>
                <div className="p-3 bg-red-400/30 rounded-lg">
                  <FireIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Hot Leads</p>
                  <p className="text-4xl font-bold mt-2">{stats.hotLeads}</p>
                  <p className="text-orange-100 text-xs mt-2">
                    {stats.warmLeads} warm, {stats.coldLeads} cold
                  </p>
                </div>
                <div className="p-3 bg-orange-400/30 rounded-lg">
                  <SparklesIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Campaigns</p>
                  <p className="text-4xl font-bold mt-2">{stats.activeCampaigns}</p>
                  <p className="text-purple-100 text-xs mt-2">
                    {stats.totalCampaigns} total campaigns
                  </p>
                </div>
                <div className="p-3 bg-purple-400/30 rounded-lg">
                  <MegaphoneIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Conversion Rate</p>
                  <p className="text-4xl font-bold mt-2">{stats.conversionRate}%</p>
                  <p className="text-emerald-100 text-xs mt-2">
                    {stats.convertedLeads} converted leads
                  </p>
                </div>
                <div className="p-3 bg-emerald-400/30 rounded-lg">
                  <ChartBarIcon className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-lg ${link.color}`}>
                      <link.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {link.name}
                      </h3>
                      <p className="text-sm text-gray-500">{link.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 font-medium">{stats.availableProperties} available</p>
                  <BuildingStorefrontIcon className="h-8 w-8 text-gray-300 mt-1" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Customer database</p>
                  <UsersIcon className="h-8 w-8 text-gray-300 mt-1" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.newLeadsThisWeek}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">New leads</p>
                  <CalendarDaysIcon className="h-8 w-8 text-gray-300 mt-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Leads */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Leads</h3>
                <Link href="/marketing/leads" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              {stats.recentLeads.length === 0 ? (
                <div className="text-center py-8">
                  <FireIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No leads yet</p>
                  <Link href="/marketing/leads/new">
                    <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      Add First Lead
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Interest</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.recentLeads.map((lead) => {
                        const firstName = lead.contact?.first_name || 'Unknown'
                        const lastName = lead.contact?.last_name || ''
                        const email = lead.contact?.email || null
                        const phone = lead.contact?.phone || null
                        const initials = `${firstName[0] || 'U'}${lastName[0] || ''}`
                        
                        return (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <Link href={`/marketing/leads/${lead.id}`} className="flex items-center group">
                                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                  <span className="text-red-600 font-medium text-sm">
                                    {initials}
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">
                                    {firstName} {lastName}
                                  </p>
                                  {lead.priority && (
                                    <span className={`text-xs ${
                                      lead.priority === 'high' ? 'text-red-500' : 
                                      lead.priority === 'medium' ? 'text-yellow-500' : 'text-gray-400'
                                    }`}>
                                      {lead.priority} priority
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <p className="text-sm text-gray-900">{email || '-'}</p>
                              <p className="text-xs text-gray-500">{phone || '-'}</p>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                {lead.lead_source || 'Direct'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              <div>
                                <span className="capitalize">{lead.interest_type || '-'}</span>
                                {lead.preferred_property_type && (
                                  <p className="text-xs text-gray-400">{lead.preferred_property_type}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white capitalize ${statusColors[lead.status] || 'bg-gray-500'}`}>
                                {lead.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Lead Sources */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lead Sources</h3>
              </div>
              {stats.leadsBySource.length === 0 ? (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.leadsBySource.map((item, index) => {
                    const percentage = stats.totalLeads > 0 
                      ? Math.round((item.count / stats.totalLeads) * 100) 
                      : 0
                    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500']
                    // Format source names nicely
                    const sourceLabels: Record<string, string> = {
                      'website': 'Website',
                      'referral': 'Referral',
                      'walk_in': 'Walk-in',
                      'campaign': 'Campaign',
                      'social_media': 'Social Media',
                      'phone': 'Phone Inquiry',
                      'email': 'Email',
                      'agent': 'Agent',
                      'Direct': 'Direct',
                      'direct': 'Direct',
                    }
                    const displaySource = sourceLabels[item.source] || item.source.replace(/_/g, ' ')
                    
                    return (
                      <div key={item.source}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 capitalize">{displaySource}</span>
                          <span className="font-medium text-gray-900">{item.count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${colors[index % colors.length]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Active Campaigns & Lead Pipeline */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Active Campaigns */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Active Campaigns</h3>
                <Link href="/marketing/campaigns" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              {stats.activeCampaignsList.length === 0 ? (
                <div className="text-center py-8">
                  <MegaphoneIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No active campaigns</p>
                  <Link href="/marketing/campaigns/new">
                    <button className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                      Create Campaign
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.activeCampaignsList.map((campaign) => (
                    <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{campaign.name}</p>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <CalendarDaysIcon className="h-4 w-4 mr-1" />
                            {campaign.start_date 
                              ? new Date(campaign.start_date).toLocaleDateString()
                              : 'No start date'}
                            {campaign.end_date && ` - ${new Date(campaign.end_date).toLocaleDateString()}`}
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      {campaign.budget && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                          Budget: ${campaign.budget.toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Lead Pipeline */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Lead Pipeline</h3>
                <span className="text-sm text-gray-500">{stats.totalLeads} total</span>
              </div>
              <div className="space-y-3">
                {/* Hot Leads */}
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-full">
                      <FireIcon className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Hot</span>
                      <p className="text-xs text-gray-500">Ready to convert</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{stats.hotLeads}</span>
                </div>
                
                {/* Warm Leads */}
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-full">
                      <ClockIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Warm</span>
                      <p className="text-xs text-gray-500">Interested</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">{stats.warmLeads}</span>
                </div>
                
                {/* Cold Leads */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <UsersIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Cold</span>
                      <p className="text-xs text-gray-500">Needs nurturing</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{stats.coldLeads}</span>
                </div>
                
                {/* Converted Leads */}
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-full">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Converted</span>
                      <p className="text-xs text-gray-500">Won deals</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-emerald-600">{stats.convertedLeads}</span>
                </div>
              </div>
              
              {/* Progress bar showing pipeline distribution */}
              {stats.totalLeads > 0 && (
                <div className="mt-4">
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                    {stats.hotLeads > 0 && (
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(stats.hotLeads / stats.totalLeads) * 100}%` }}
                      />
                    )}
                    {stats.warmLeads > 0 && (
                      <div 
                        className="bg-orange-500" 
                        style={{ width: `${(stats.warmLeads / stats.totalLeads) * 100}%` }}
                      />
                    )}
                    {stats.coldLeads > 0 && (
                      <div 
                        className="bg-blue-500" 
                        style={{ width: `${(stats.coldLeads / stats.totalLeads) * 100}%` }}
                      />
                    )}
                    {stats.convertedLeads > 0 && (
                      <div 
                        className="bg-emerald-500" 
                        style={{ width: `${(stats.convertedLeads / stats.totalLeads) * 100}%` }}
                      />
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </RoleGuard>
  )
}
