import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FireIcon,
  PhoneIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

async function getTeamMemberStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalLeads: 0,
      activeLeads: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      recentLeads: [],
      manager: null,
    }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('id, organization_id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    return {
      totalLeads: 0,
      activeLeads: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      recentLeads: [],
      manager: null,
    }
  }

  // Get manager info
  const { data: teamData } = await supabase
    .from('marketing_teams')
    .select(`
      manager:app_users!marketing_teams_manager_id_fkey(
        full_name,
        email,
        phone
      )
    `)
    .eq('team_member_id', profile.id)
    .eq('is_active', true)
    .single()

  // Get leads assigned to this team member
  const { data: leads } = await supabase
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
    .eq('assigned_to', profile.id)
    .order('created_at', { ascending: false })

  const totalLeads = leads?.length || 0

  // Calculate stats
  const activeLeads = leads?.filter(l =>
    ['new', 'contacted', 'qualified', 'negotiating'].includes(l.status)
  ).length || 0

  const hotLeads = leads?.filter(l => l.temperature === 'hot').length || 0
  const warmLeads = leads?.filter(l => l.temperature === 'warm').length || 0
  const coldLeads = leads?.filter(l => l.temperature === 'cold').length || 0
  const convertedLeads = leads?.filter(l => l.status === 'converted').length || 0

  const conversionRate = totalLeads > 0
    ? Math.round((convertedLeads / totalLeads) * 100)
    : 0

  const recentLeads = leads?.slice(0, 10) || []

  return {
    totalLeads,
    activeLeads,
    hotLeads,
    warmLeads,
    coldLeads,
    convertedLeads,
    conversionRate,
    recentLeads,
    manager: teamData?.manager || null,
  }
}

export default async function MarketingTeamMemberPage() {
  const stats = await getTeamMemberStats()

  const statusColors: Record<string, string> = {
    hot: 'bg-red-500',
    warm: 'bg-orange-500',
    cold: 'bg-blue-500',
    new: 'bg-blue-500',
    contacted: 'bg-purple-500',
    qualified: 'bg-indigo-500',
    negotiating: 'bg-yellow-500',
    converted: 'bg-green-500',
    lost: 'bg-gray-500',
  }

  const quickLinks = [
    { name: 'My Leads', href: '/marketing/leads', icon: FireIcon, color: 'bg-red-500', description: 'View my assigned leads' },
    { name: 'Contacts', href: '/marketing/contacts', icon: PhoneIcon, color: 'bg-blue-500', description: 'Customer contacts' },
  ]

  return (
    <RoleGuard allowedRoles={['super_admin', 'marketing_team_member']}>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track and manage your assigned leads
              </p>
              {stats.manager && (
                <p className="mt-2 text-sm text-gray-600">
                  Manager: <span className="font-medium">{stats.manager.full_name}</span>
                  {stats.manager.email && <span className="text-gray-500"> ({stats.manager.email})</span>}
                </p>
              )}
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mt-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">My Total Leads</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalLeads}</p>
                  <p className="text-red-100 text-xs mt-2">
                    All assigned leads
                  </p>
                </div>
                <div className="p-3 bg-red-400/30 rounded-lg">
                  <FireIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Active Leads</p>
                  <p className="text-4xl font-bold mt-2">{stats.activeLeads}</p>
                  <p className="text-orange-100 text-xs mt-2">
                    In progress
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
                  <p className="text-purple-100 text-sm font-medium">Hot Leads</p>
                  <p className="text-4xl font-bold mt-2">{stats.hotLeads}</p>
                  <p className="text-purple-100 text-xs mt-2">
                    {stats.warmLeads} warm, {stats.coldLeads} cold
                  </p>
                </div>
                <div className="p-3 bg-purple-400/30 rounded-lg">
                  <ClipboardDocumentListIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">Conversion Rate</p>
                  <p className="text-4xl font-bold mt-2">{stats.conversionRate}%</p>
                  <p className="text-emerald-100 text-xs mt-2">
                    {stats.convertedLeads} converted
                  </p>
                </div>
                <div className="p-3 bg-emerald-400/30 rounded-lg">
                  <CheckCircleIcon className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-6">
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

          {/* Recent Leads */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mt-6">
            <Card className="lg:col-span-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">My Recent Leads</h3>
                <Link href="/marketing/leads">
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    View all →
                  </button>
                </Link>
              </div>
              {stats.recentLeads.length === 0 ? (
                <div className="text-center py-8">
                  <FireIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No leads assigned yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Contact your manager to get leads assigned
                  </p>
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
                      {stats.recentLeads.map((lead: any) => {
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
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
