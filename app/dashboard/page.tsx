import { MainLayout } from '@/components/layout/main-layout'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your real estate development operations
          </p>
        </div>

        {/* Projects Section */}
        <Card title="Projects">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Ongoing Projects</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">On Hold</p>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">0</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/projects" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View all projects →
            </Link>
          </div>
        </Card>

        {/* Marketing/CRM Section */}
        <Card title="Marketing & Sales">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Active Leads</p>
              <p className="mt-2 text-3xl font-semibold text-purple-600">0</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Conversions</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">0</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/marketing" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View CRM dashboard →
            </Link>
          </div>
        </Card>

        {/* HR Section */}
        <Card title="Human Resources">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Pending Leave</p>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Expiring Documents</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">0</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/hr" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View HR dashboard →
            </Link>
          </div>
        </Card>

        {/* Inventory Section */}
        <Card title="Inventory">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">0</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/inventory" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View inventory dashboard →
            </Link>
          </div>
        </Card>

        {/* Facilities Section */}
        <Card title="Facilities">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Open Maintenance</p>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Overdue Tickets</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">0</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/facilities" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View facilities dashboard →
            </Link>
          </div>
        </Card>

        {/* Purchasing Section */}
        <Card title="Purchasing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Open PRs</p>
              <p className="mt-2 text-3xl font-semibold text-yellow-600">0</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="mt-2 text-3xl font-semibold text-blue-600">0</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Recent POs</p>
              <p className="mt-2 text-3xl font-semibold text-green-600">0</p>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/purchasing" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
              View procurement dashboard →
            </Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}

