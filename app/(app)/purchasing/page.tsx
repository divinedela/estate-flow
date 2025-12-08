import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import Link from 'next/link'
import {
  ShoppingCartIcon,
  DocumentTextIcon,
  TruckIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline'
import { createClient } from '@/lib/supabase/server'

// Helper function to format currency
const formatCurrency = (amount: number | null | undefined) => {
  return amount ? `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
};

export default async function PurchasingDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <p>Please log in to view this page.</p>;
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();

  if (!profile?.organization_id) {
    return <p>User not associated with an organization.</p>;
  }

  const organizationId = profile.organization_id;

  // Fetch suppliers count
  const { data: suppliersData, count: suppliersCount } = await supabase
    .from('suppliers')
    .select('id, status', { count: 'exact' })
    .eq('organization_id', organizationId);

  // Fetch purchase requisitions
  const { data: prsData } = await supabase
    .from('purchase_requisitions')
    .select('id, pr_number, status, priority, total_amount, required_date, created_at, requester:app_users!requested_by(full_name)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch all PRs for stats
  const { data: allPrsData } = await supabase
    .from('purchase_requisitions')
    .select('id, status, total_amount')
    .eq('organization_id', organizationId);

  // Fetch purchase orders
  const { data: posData } = await supabase
    .from('purchase_orders')
    .select('id, po_number, status, total_amount, issued_date, expected_delivery_date, supplier:suppliers(name)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch all POs for stats
  const { data: allPosData } = await supabase
    .from('purchase_orders')
    .select('id, status, total_amount')
    .eq('organization_id', organizationId);

  // Fetch goods receipts
  const { data: grnsData } = await supabase
    .from('goods_receipts')
    .select('id, status')
    .eq('organization_id', organizationId);

  // Fetch invoices
  const { data: invoicesData } = await supabase
    .from('invoices')
    .select('id, status, total_amount, due_date, amount_paid')
    .eq('organization_id', organizationId);

  // Calculate stats
  const totalSuppliers = suppliersCount || 0;
  const activeSuppliers = suppliersData?.filter(s => s.status === 'active').length || 0;

  const totalPRs = allPrsData?.length || 0;
  const pendingPRs = allPrsData?.filter(pr => pr.status === 'submitted').length || 0;
  const approvedPRs = allPrsData?.filter(pr => pr.status === 'approved').length || 0;
  const prTotalValue = allPrsData?.reduce((sum, pr) => sum + (pr.total_amount || 0), 0) || 0;

  const totalPOs = allPosData?.length || 0;
  const openPOs = allPosData?.filter(po => ['sent', 'confirmed', 'partial'].includes(po.status)).length || 0;
  const receivedPOs = allPosData?.filter(po => po.status === 'received').length || 0;
  const poTotalValue = allPosData?.reduce((sum, po) => sum + (po.total_amount || 0), 0) || 0;

  const totalGRNs = grnsData?.length || 0;
  const pendingGRNs = grnsData?.filter(g => g.status === 'pending').length || 0;

  const totalInvoices = invoicesData?.length || 0;
  const pendingInvoices = invoicesData?.filter(i => i.status === 'pending').length || 0;
  const today = new Date();
  const overdueInvoices = invoicesData?.filter(i => {
    if (i.status === 'paid') return false;
    if (!i.due_date) return false;
    return new Date(i.due_date) < today;
  }).length || 0;
  const totalOutstanding = invoicesData
    ?.filter(i => i.status !== 'paid')
    .reduce((sum, i) => sum + (i.total_amount - (i.amount_paid || 0)), 0) || 0;

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    converted: 'bg-purple-100 text-purple-800',
    sent: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-indigo-100 text-indigo-800',
    partial: 'bg-yellow-100 text-yellow-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
  };

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'procurement_officer', 'executive']}>
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative bg-gradient-to-r from-emerald-700 to-teal-600 rounded-lg shadow-lg p-6 sm:p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Purchasing Dashboard</h1>
                <p className="mt-1 text-emerald-100">Manage procurement, suppliers, and vendor relationships</p>
              </div>
              <ShoppingCartIcon className="h-12 w-12 text-emerald-300 opacity-70" />
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="border-t border-emerald-400 pt-4">
                <p className="text-emerald-100 text-sm">Total PO Value</p>
                <p className="text-2xl font-semibold">{formatCurrency(poTotalValue)}</p>
              </div>
              <div className="border-t border-emerald-400 pt-4">
                <p className="text-emerald-100 text-sm">Outstanding Invoices</p>
                <p className="text-2xl font-semibold">{formatCurrency(totalOutstanding)}</p>
              </div>
              <div className="border-t border-emerald-400 pt-4">
                <p className="text-emerald-100 text-sm">Active Suppliers</p>
                <p className="text-2xl font-semibold">{activeSuppliers}</p>
              </div>
              <div className="border-t border-emerald-400 pt-4">
                <p className="text-emerald-100 text-sm">Open POs</p>
                <p className="text-2xl font-semibold">{openPOs}</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Link href="/purchasing/suppliers" passHref>
              <Card className="group hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="h-6 w-6 text-emerald-500 group-hover:text-emerald-600" />
                  <p className="font-medium text-gray-900 group-hover:text-emerald-700">Suppliers</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Manage vendors</p>
              </Card>
            </Link>
            <Link href="/purchasing/prs" passHref>
              <Card className="group hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <DocumentTextIcon className="h-6 w-6 text-blue-500 group-hover:text-blue-600" />
                  <p className="font-medium text-gray-900 group-hover:text-blue-700">Requisitions</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Purchase requests</p>
              </Card>
            </Link>
            <Link href="/purchasing/pos" passHref>
              <Card className="group hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <ShoppingCartIcon className="h-6 w-6 text-indigo-500 group-hover:text-indigo-600" />
                  <p className="font-medium text-gray-900 group-hover:text-indigo-700">Orders</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Purchase orders</p>
              </Card>
            </Link>
            <Link href="/purchasing/grns" passHref>
              <Card className="group hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <TruckIcon className="h-6 w-6 text-orange-500 group-hover:text-orange-600" />
                  <p className="font-medium text-gray-900 group-hover:text-orange-700">Goods Receipt</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Receive deliveries</p>
              </Card>
            </Link>
            <Link href="/purchasing/invoices" passHref>
              <Card className="group hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <ReceiptPercentIcon className="h-6 w-6 text-purple-500 group-hover:text-purple-600" />
                  <p className="font-medium text-gray-900 group-hover:text-purple-700">Invoices</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">Manage payments</p>
              </Card>
            </Link>
            <Link href="/purchasing/pr/new" passHref>
              <Card className="group hover:bg-emerald-50 transition-colors cursor-pointer bg-emerald-50 border-emerald-200">
                <div className="flex items-center space-x-3">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-emerald-600" />
                  <p className="font-medium text-emerald-700">New PR</p>
                </div>
                <p className="text-sm text-emerald-600 mt-1">Create request</p>
              </Card>
            </Link>
          </div>

          {/* Alerts Section */}
          {(pendingPRs > 0 || overdueInvoices > 0 || pendingGRNs > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {pendingPRs > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <div className="flex items-center">
                    <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-blue-800">Pending Approvals</p>
                      <p className="text-sm text-blue-600">
                        {pendingPRs} PR(s) awaiting approval
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {overdueInvoices > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-red-800">Overdue Invoices</p>
                      <p className="text-sm text-red-600">
                        {overdueInvoices} invoice(s) past due date
                      </p>
                    </div>
                  </div>
                </Card>
              )}
              {pendingGRNs > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <div className="flex items-center">
                    <TruckIcon className="h-6 w-6 text-yellow-600 mr-3" />
                    <div>
                      <p className="font-medium text-yellow-800">Pending Receipts</p>
                      <p className="text-sm text-yellow-600">
                        {pendingGRNs} GRN(s) need verification
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalPRs}</p>
              <p className="text-xs text-gray-500">Total PRs</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-blue-600">{pendingPRs}</p>
              <p className="text-xs text-gray-500">Pending PRs</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalPOs}</p>
              <p className="text-xs text-gray-500">Total POs</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-green-600">{receivedPOs}</p>
              <p className="text-xs text-gray-500">Received POs</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalGRNs}</p>
              <p className="text-xs text-gray-500">Total GRNs</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{pendingGRNs}</p>
              <p className="text-xs text-gray-500">Pending GRNs</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
              <p className="text-xs text-gray-500">Total Invoices</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-red-600">{overdueInvoices}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Purchase Requisitions */}
            <Card title="Recent Purchase Requisitions">
              {prsData && prsData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PR #</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {prsData.map((pr: any) => (
                        <tr key={pr.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{pr.pr_number}</p>
                            <p className="text-xs text-gray-500">{pr.requester?.full_name || 'N/A'}</p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[pr.priority]}`}>
                              {pr.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(pr.total_amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[pr.status]}`}>
                              {pr.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No purchase requisitions yet.</p>
              )}
              <div className="mt-4 text-right">
                <Link href="/purchasing/prs" passHref>
                  <Button variant="secondary" size="sm">View All PRs</Button>
                </Link>
              </div>
            </Card>

            {/* Recent Purchase Orders */}
            <Card title="Recent Purchase Orders">
              {posData && posData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO #</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {posData.map((po: any) => (
                        <tr key={po.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <p className="text-sm font-medium text-gray-900">{po.po_number}</p>
                            <p className="text-xs text-gray-500">
                              {po.expected_delivery_date ? `Due: ${new Date(po.expected_delivery_date).toLocaleDateString()}` : 'No ETA'}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {po.supplier?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(po.total_amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[po.status]}`}>
                              {po.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No purchase orders yet.</p>
              )}
              <div className="mt-4 text-right">
                <Link href="/purchasing/pos" passHref>
                  <Button variant="secondary" size="sm">View All POs</Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Procurement Pipeline */}
            <Card title="Procurement Pipeline">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">PRs → POs Conversion</span>
                    <span className="font-medium">{totalPRs > 0 ? Math.round((approvedPRs / totalPRs) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${totalPRs > 0 ? (approvedPRs / totalPRs) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">POs Fulfilled</span>
                    <span className="font-medium">{totalPOs > 0 ? Math.round((receivedPOs / totalPOs) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${totalPOs > 0 ? (receivedPOs / totalPOs) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Invoices Paid</span>
                    <span className="font-medium">
                      {totalInvoices > 0 ? Math.round(((totalInvoices - pendingInvoices - overdueInvoices) / totalInvoices) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${totalInvoices > 0 ? ((totalInvoices - pendingInvoices - overdueInvoices) / totalInvoices) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">PR Value Pending</span>
                  <span className="font-medium text-gray-900">{formatCurrency(prTotalValue)}</span>
                </div>
              </div>
            </Card>

            {/* Supplier Overview */}
            <Card title="Supplier Overview">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <UserGroupIcon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Total Suppliers</p>
                      <p className="text-xs text-gray-500">In your network</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{totalSuppliers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Active</p>
                      <p className="text-xs text-gray-500">Ready to order</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{activeSuppliers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <ClockIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Inactive</p>
                      <p className="text-xs text-gray-500">Not currently used</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-600">{totalSuppliers - activeSuppliers}</span>
                </div>
              </div>
              <div className="mt-4 text-right">
                <Link href="/purchasing/suppliers" passHref>
                  <Button variant="secondary" size="sm">Manage Suppliers</Button>
                </Link>
              </div>
            </Card>

            {/* Financial Summary */}
            <Card title="Financial Summary">
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-700">Total PO Value</span>
                    <CurrencyDollarIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(poTotalValue)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-purple-700">Outstanding Invoices</span>
                    <ReceiptPercentIcon className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{formatCurrency(totalOutstanding)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{pendingInvoices}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-lg font-bold text-red-600">{overdueInvoices}</p>
                    <p className="text-xs text-red-600">Overdue</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </RoleGuard>
  );
}
