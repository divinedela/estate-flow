import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getMarketingStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalLeads: 0,
      hotLeads: 0,
      activeCampaigns: 0,
      conversionRate: 0,
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
      totalLeads: 0,
      hotLeads: 0,
      activeCampaigns: 0,
      conversionRate: 0,
    }
  }

  const orgId = profile.organization_id

  // Fetch total leads count
  const { count: totalLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Fetch hot leads count
  const { count: hotLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'hot')

  // Fetch active campaigns count
  const { count: activeCampaigns } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active')

  // Calculate conversion rate (converted leads / total leads)
  const { count: convertedLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'converted')

  const conversionRate = totalLeads && totalLeads > 0
    ? Math.round((convertedLeads || 0) / totalLeads * 100)
    : 0

  return {
    totalLeads: totalLeads || 0,
    hotLeads: hotLeads || 0,
    activeCampaigns: activeCampaigns || 0,
    conversionRate,
  }
}

export default async function MarketingPage() {
  const stats = await getMarketingStats()

  return (
    <MainLayout>
      <RoleGuard allowedRoles={['super_admin', 'marketing_officer', 'executive']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketing / CRM Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage leads, campaigns, properties, and customer interactions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Total Leads</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalLeads}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Hot Leads</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">{stats.hotLeads}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">{stats.activeCampaigns}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <p className="mt-2 text-3xl font-semibold text-green-600">{stats.conversionRate}%</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card title="Quick Actions">
              <div className="space-y-3">
                <Link href="/marketing/leads">
                  <Button className="w-full">Manage Leads</Button>
                </Link>
                <Link href="/marketing/campaigns">
                  <Button className="w-full" variant="secondary">Campaigns</Button>
                </Link>
                <Link href="/marketing/properties">
                  <Button className="w-full" variant="secondary">Properties</Button>
                </Link>
                <Link href="/marketing/contacts">
                  <Button className="w-full" variant="secondary">Contacts</Button>
                </Link>
              </div>
            </Card>

            <Card title="Recent Activity">
              <p className="text-gray-500">No recent activity to display</p>
            </Card>
          </div>
        </div>
      </RoleGuard>
    </MainLayout>
  )
}



