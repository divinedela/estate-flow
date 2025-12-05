import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function MarketingPage() {
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
                <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Hot Leads</p>
                <p className="mt-2 text-3xl font-semibold text-red-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <p className="mt-2 text-3xl font-semibold text-green-600">0%</p>
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

