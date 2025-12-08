import { Card } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  CubeIcon,
  PlusIcon,
  BuildingStorefrontIcon,
  ArrowsRightLeftIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentCheckIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'

interface Item {
  id: string
  item_code: string
  name: string
  category: string | null
  unit_of_measure: string
  is_active: boolean
  created_at: string
}

interface Transaction {
  id: string
  item_id: string
  transaction_type: string
  quantity: number
  transaction_date: string
  item?: {
    name: string
  }
  location?: {
    name: string
  }
  created_by_user?: {
    full_name: string | null
  }
}

interface StockLevel {
  id: string
  quantity: number
  item?: {
    name: string
    item_code: string
  }
  location?: {
    name: string
  }
}

async function getInventoryStats() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalItems: 0,
      activeItems: 0,
      totalLocations: 0,
      lowStockItems: 0,
      todayTransactions: 0,
      totalInbound: 0,
      totalOutbound: 0,
      recentTransactions: [] as Transaction[],
      lowStockAlerts: [] as StockLevel[],
      itemsByCategory: [] as { category: string; count: number }[],
      recentItems: [] as Item[],
    }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) {
    return {
      totalItems: 0,
      activeItems: 0,
      totalLocations: 0,
      lowStockItems: 0,
      todayTransactions: 0,
      totalInbound: 0,
      totalOutbound: 0,
      recentTransactions: [] as Transaction[],
      lowStockAlerts: [] as StockLevel[],
      itemsByCategory: [] as { category: string; count: number }[],
      recentItems: [] as Item[],
    }
  }

  const orgId = profile.organization_id
  const today = new Date().toISOString().split('T')[0]

  // Fetch items
  const { data: items } = await supabase
    .from('items')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  const allItems = (items || []) as Item[]
  const totalItems = allItems.length
  const activeItems = allItems.filter(i => i.is_active).length
  const recentItems = allItems.slice(0, 5)

  // Items by category
  const categoryMap = new Map<string, number>()
  allItems.forEach(item => {
    const cat = item.category || 'Uncategorized'
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1)
  })
  const itemsByCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Fetch locations
  const { count: totalLocations } = await supabase
    .from('stock_locations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)

  // Fetch today's transactions
  const { data: todayTxns } = await supabase
    .from('stock_transactions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('transaction_date', today)

  const todayTransactions = (todayTxns || []).length
  const totalInbound = (todayTxns || []).filter(t => t.transaction_type === 'inbound' || t.transaction_type === 'return').reduce((sum, t) => sum + Number(t.quantity), 0)
  const totalOutbound = (todayTxns || []).filter(t => t.transaction_type === 'outbound').reduce((sum, t) => sum + Number(t.quantity), 0)

  // Fetch recent transactions
  const { data: recentTxns } = await supabase
    .from('stock_transactions')
    .select(`
      *,
      item:items(name),
      location:stock_locations(name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentTransactions = (recentTxns || []) as Transaction[]

  // Fetch low stock alerts (items below reorder point)
  const { data: reorderRules } = await supabase
    .from('reorder_rules')
    .select(`
      min_quantity,
      item_id,
      location_id
    `)
    .eq('is_active', true)

  // Get stock levels that are below reorder points
  let lowStockItems = 0
  const lowStockAlerts: StockLevel[] = []

  if (reorderRules && reorderRules.length > 0) {
    for (const rule of reorderRules) {
      const { data: stockLevel } = await supabase
        .from('stock_levels')
        .select(`
          *,
          item:items(name, item_code),
          location:stock_locations(name)
        `)
        .eq('item_id', rule.item_id)
        .eq('location_id', rule.location_id)
        .single()

      if (stockLevel && Number(stockLevel.quantity) <= Number(rule.min_quantity)) {
        lowStockItems++
        if (lowStockAlerts.length < 5) {
          lowStockAlerts.push(stockLevel as StockLevel)
        }
      }
    }
  }

  return {
    totalItems,
    activeItems,
    totalLocations: totalLocations || 0,
    lowStockItems,
    todayTransactions,
    totalInbound,
    totalOutbound,
    recentTransactions,
    lowStockAlerts,
    itemsByCategory,
    recentItems,
  }
}

export default async function InventoryPage() {
  const stats = await getInventoryStats()

  const quickLinks = [
    { name: 'Items', href: '/inventory/items', icon: CubeIcon, color: 'bg-blue-500', description: 'Manage inventory items' },
    { name: 'Locations', href: '/inventory/locations', icon: BuildingStorefrontIcon, color: 'bg-green-500', description: 'Stock locations' },
    { name: 'Transactions', href: '/inventory/transactions', icon: ArrowsRightLeftIcon, color: 'bg-purple-500', description: 'Stock movements' },
    { name: 'Reorder Rules', href: '/inventory/reorder-rules', icon: ClipboardDocumentCheckIcon, color: 'bg-amber-500', description: 'Low stock alerts' },
  ]

  const transactionTypeColors: Record<string, string> = {
    inbound: 'bg-green-100 text-green-800',
    outbound: 'bg-red-100 text-red-800',
    transfer: 'bg-blue-100 text-blue-800',
    adjustment: 'bg-yellow-100 text-yellow-800',
    return: 'bg-purple-100 text-purple-800',
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'inventory_officer', 'project_manager', 'executive']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage stock levels, items, and transactions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/inventory/items/new">
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Add Item
                </button>
              </Link>
              <Link href="/inventory/transactions">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <ArrowsRightLeftIcon className="h-5 w-5 mr-2" />
                  New Transaction
                </button>
              </Link>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Items</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalItems}</p>
                  <p className="text-blue-100 text-xs mt-2">
                    {stats.activeItems} active
                  </p>
                </div>
                <div className="p-3 bg-blue-400/30 rounded-lg">
                  <CubeIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Locations</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalLocations}</p>
                  <p className="text-green-100 text-xs mt-2">
                    Warehouses & sites
                  </p>
                </div>
                <div className="p-3 bg-green-400/30 rounded-lg">
                  <BuildingStorefrontIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Today&apos;s Transactions</p>
                  <p className="text-4xl font-bold mt-2">{stats.todayTransactions}</p>
                  <p className="text-purple-100 text-xs mt-2">
                    +{stats.totalInbound} / -{stats.totalOutbound}
                  </p>
                </div>
                <div className="p-3 bg-purple-400/30 rounded-lg">
                  <ArrowsRightLeftIcon className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className={`bg-gradient-to-br ${stats.lowStockItems > 0 ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'} rounded-xl shadow-lg p-6 text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${stats.lowStockItems > 0 ? 'text-red-100' : 'text-gray-100'} text-sm font-medium`}>Low Stock Alerts</p>
                  <p className="text-4xl font-bold mt-2">{stats.lowStockItems}</p>
                  <p className={`${stats.lowStockItems > 0 ? 'text-red-100' : 'text-gray-100'} text-xs mt-2`}>
                    {stats.lowStockItems > 0 ? 'Needs attention' : 'All good'}
                  </p>
                </div>
                <div className={`p-3 ${stats.lowStockItems > 0 ? 'bg-red-400/30' : 'bg-gray-400/30'} rounded-lg`}>
                  <ExclamationTriangleIcon className="h-8 w-8" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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

          {/* Low Stock Alert Banner */}
          {stats.lowStockItems > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Low Stock Alert</p>
                  <p className="text-sm text-red-600">
                    {stats.lowStockItems} item(s) have reached their reorder point. Review and reorder to avoid stockouts.
                  </p>
                </div>
                <Link href="/inventory/reorder-rules">
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                    View Alerts
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Recent Transactions */}
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <Link href="/inventory/transactions" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              {stats.recentTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowsRightLeftIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No transactions yet</p>
                  <Link href="/inventory/transactions">
                    <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Record First Transaction
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stats.recentTransactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {new Date(txn.transaction_date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {txn.item?.name || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${transactionTypeColors[txn.transaction_type] || 'bg-gray-100 text-gray-800'}`}>
                              {txn.transaction_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`text-sm font-medium ${txn.transaction_type === 'outbound' ? 'text-red-600' : 'text-green-600'}`}>
                              {txn.transaction_type === 'outbound' ? '-' : '+'}{txn.quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {txn.location?.name || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Items by Category */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">By Category</h3>
              </div>
              {stats.itemsByCategory.length === 0 ? (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No data yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats.itemsByCategory.map((item, index) => {
                    const percentage = stats.totalItems > 0 
                      ? Math.round((item.count / stats.totalItems) * 100) 
                      : 0
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']
                    return (
                      <div key={item.category}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 capitalize">{item.category}</span>
                          <span className="font-medium text-gray-900">{item.count}</span>
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

          {/* Low Stock Alerts & Recent Items */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Low Stock Alerts */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
                <Link href="/inventory/reorder-rules" className="text-sm text-indigo-600 hover:text-indigo-500">
                  Manage rules →
                </Link>
              </div>
              {stats.lowStockAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No low stock alerts</p>
                  <p className="text-xs text-gray-400 mt-1">Set up reorder rules to get alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.lowStockAlerts.map((stock) => (
                    <div key={stock.id} className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{stock.item?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-500">{stock.location?.name || 'Unknown location'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">{stock.quantity}</p>
                          <p className="text-xs text-red-500">units left</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Items */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Items</h3>
                <Link href="/inventory/items" className="text-sm text-indigo-600 hover:text-indigo-500">
                  View all →
                </Link>
              </div>
              {stats.recentItems.length === 0 ? (
                <div className="text-center py-8">
                  <CubeIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-gray-500">No items yet</p>
                  <Link href="/inventory/items/new">
                    <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add First Item
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <CubeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.item_code} • {item.unit_of_measure}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </RoleGuard>
  )
}
