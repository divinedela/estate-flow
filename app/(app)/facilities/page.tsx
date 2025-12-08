'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  PlusIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'

interface Facility {
  id: string
  facility_code: string
  name: string
  facility_type: string | null
  address: string
  city: string | null
  state: string | null
  country: string | null
  total_units: number | null
  total_area: number | null
  status: string
  created_at: string
}

interface MaintenanceRequest {
  id: string
  request_number: string
  title: string
  priority: string
  status: string
  facility_id: string | null
  created_at: string
  facility?: { name: string }
}

interface WorkOrder {
  id: string
  work_order_number: string
  title: string
  status: string
  scheduled_date: string | null
  created_at: string
}

interface Asset {
  id: string
  asset_code: string
  name: string
  asset_type: string | null
  status: string
}

interface PreventiveSchedule {
  id: string
  schedule_name: string
  frequency_type: string
  next_due_date: string | null
  is_active: boolean
}

export default function FacilitiesDashboardPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [preventiveSchedules, setPreventiveSchedules] = useState<PreventiveSchedule[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  async function fetchAllData() {
    setLoading(true)

    const [facilitiesRes, maintenanceRes, workOrdersRes, assetsRes, preventiveRes] = await Promise.all([
      supabase.from('facilities').select('*').order('created_at', { ascending: false }),
      supabase.from('maintenance_requests').select('*, facility:facilities(name)').order('created_at', { ascending: false }).limit(10),
      supabase.from('maintenance_work_orders').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('assets').select('*').order('created_at', { ascending: false }),
      supabase.from('preventive_maintenance_schedules').select('*').eq('is_active', true).order('next_due_date', { ascending: true }),
    ])

    setFacilities((facilitiesRes.data as Facility[]) || [])
    setMaintenanceRequests((maintenanceRes.data as MaintenanceRequest[]) || [])
    setWorkOrders((workOrdersRes.data as WorkOrder[]) || [])
    setAssets((assetsRes.data as Asset[]) || [])
    setPreventiveSchedules((preventiveRes.data as PreventiveSchedule[]) || [])
    setLoading(false)
  }

  // Calculate stats
  const today = new Date()
  const stats = {
    totalFacilities: facilities.length,
    activeFacilities: facilities.filter(f => f.status === 'active').length,
    totalUnits: facilities.reduce((sum, f) => sum + (f.total_units || 0), 0),
    totalArea: facilities.reduce((sum, f) => sum + (f.total_area || 0), 0),
    openRequests: maintenanceRequests.filter(r => r.status === 'open').length,
    inProgressRequests: maintenanceRequests.filter(r => r.status === 'in_progress' || r.status === 'assigned').length,
    completedRequests: maintenanceRequests.filter(r => r.status === 'completed').length,
    urgentRequests: maintenanceRequests.filter(r => r.priority === 'urgent' || r.priority === 'emergency').length,
    totalAssets: assets.length,
    operationalAssets: assets.filter(a => a.status === 'operational').length,
    assetsInMaintenance: assets.filter(a => a.status === 'maintenance').length,
    pendingWorkOrders: workOrders.filter(w => w.status === 'pending' || w.status === 'scheduled').length,
    overdueSchedules: preventiveSchedules.filter(s => s.next_due_date && new Date(s.next_due_date) < today).length,
    upcomingSchedules: preventiveSchedules.filter(s => {
      if (!s.next_due_date) return false
      const dueDate = new Date(s.next_due_date)
      const weekFromNow = new Date(today)
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return dueDate >= today && dueDate <= weekFromNow
    }).length,
  }

  const quickLinks = [
    { name: 'Facilities', href: '/facilities/list', icon: BuildingOfficeIcon, color: 'bg-blue-500', count: stats.totalFacilities },
    { name: 'Maintenance Requests', href: '/facilities/maintenance', icon: WrenchScrewdriverIcon, color: 'bg-orange-500', count: stats.openRequests },
    { name: 'Work Orders', href: '/facilities/work-orders', icon: ClipboardDocumentListIcon, color: 'bg-purple-500', count: stats.pendingWorkOrders },
    { name: 'Assets', href: '/facilities/assets', icon: CubeIcon, color: 'bg-green-500', count: stats.totalAssets },
    { name: 'Units', href: '/facilities/units', icon: BuildingStorefrontIcon, color: 'bg-pink-500', count: stats.totalUnits },
    { name: 'Preventive Maintenance', href: '/facilities/preventive', icon: CalendarDaysIcon, color: 'bg-cyan-500', count: preventiveSchedules.length },
  ]

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
    pending: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800',
    emergency: 'bg-red-200 text-red-900',
  }

  const facilityTypeColors: Record<string, string> = {
    residential: 'bg-green-100 text-green-800',
    commercial: 'bg-blue-100 text-blue-800',
    mixed_use: 'bg-purple-100 text-purple-800',
    office: 'bg-indigo-100 text-indigo-800',
    retail: 'bg-pink-100 text-pink-800',
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={['super_admin', 'facility_manager', 'executive']}>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading facilities data...</p>
            </div>
          </div>
        </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'facility_manager', 'executive']}>
        <div className="space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-xl">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Facility Management</h1>
                  <p className="mt-2 text-blue-100">
                    Manage facilities, units, assets, and maintenance operations
                  </p>
                </div>
                <Link href="/facilities/list">
                  <Button className="bg-white text-blue-700 hover:bg-blue-50">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Facility
                  </Button>
                </Link>
              </div>

              {/* Hero Stats */}
              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <BuildingOfficeIcon className="h-8 w-8 text-blue-200" />
                    <span className="text-3xl font-bold">{stats.totalFacilities}</span>
                  </div>
                  <p className="mt-2 text-sm text-blue-100">Total Facilities</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <WrenchScrewdriverIcon className="h-8 w-8 text-orange-300" />
                    <span className="text-3xl font-bold">{stats.openRequests}</span>
                  </div>
                  <p className="mt-2 text-sm text-blue-100">Open Requests</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <CubeIcon className="h-8 w-8 text-green-300" />
                    <span className="text-3xl font-bold">{stats.totalAssets}</span>
                  </div>
                  <p className="mt-2 text-sm text-blue-100">Total Assets</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <BuildingStorefrontIcon className="h-8 w-8 text-pink-300" />
                    <span className="text-3xl font-bold">{stats.totalUnits}</span>
                  </div>
                  <p className="mt-2 text-sm text-blue-100">Total Units</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link) => (
              <Link key={link.name} href={link.href}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group h-full">
                  <div className="flex flex-col items-center text-center p-4">
                    <div className={`${link.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform`}>
                      <link.icon className="h-6 w-6" />
                    </div>
                    <p className="mt-3 font-medium text-gray-900 text-sm">{link.name}</p>
                    <p className="text-2xl font-bold text-gray-700 mt-1">{link.count}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Alerts Section */}
          {(stats.urgentRequests > 0 || stats.overdueSchedules > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats.urgentRequests > 0 && (
                <Card className="border-l-4 border-l-red-500 bg-red-50">
                  <div className="flex items-center p-4">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mr-4" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-800">Urgent Maintenance Required</h3>
                      <p className="text-sm text-red-600">{stats.urgentRequests} urgent/emergency requests pending</p>
                    </div>
                    <Link href="/facilities/maintenance?priority=urgent">
                      <Button size="sm" variant="danger">View Now</Button>
                    </Link>
                  </div>
                </Card>
              )}
              {stats.overdueSchedules > 0 && (
                <Card className="border-l-4 border-l-orange-500 bg-orange-50">
                  <div className="flex items-center p-4">
                    <ClockIcon className="h-8 w-8 text-orange-500 mr-4" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-orange-800">Overdue Preventive Maintenance</h3>
                      <p className="text-sm text-orange-600">{stats.overdueSchedules} schedules are overdue</p>
                    </div>
                    <Link href="/facilities/preventive">
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">View</Button>
                    </Link>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Maintenance Requests */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <WrenchScrewdriverIcon className="h-5 w-5 mr-2 text-orange-500" />
                    Recent Maintenance Requests
                  </h2>
                  <Link href="/facilities/maintenance" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                  </Link>
                </div>
                {maintenanceRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <WrenchScrewdriverIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p>No maintenance requests yet</p>
                    <Link href="/facilities/maintenance">
                      <Button size="sm" className="mt-3">Create Request</Button>
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableHeader>Request</TableHeader>
                        <TableHeader>Facility</TableHeader>
                        <TableHeader>Priority</TableHeader>
                        <TableHeader>Status</TableHeader>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {maintenanceRequests.slice(0, 5).map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{request.request_number}</p>
                              <p className="text-sm text-gray-500 truncate max-w-xs">{request.title}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {(request.facility as { name: string } | undefined)?.name || '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityColors[request.priority] || 'bg-gray-100 text-gray-800'}`}>
                              {request.priority}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status] || 'bg-gray-100 text-gray-800'}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Card>
            </div>

            {/* Maintenance Summary */}
            <div className="space-y-6">
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Open</span>
                    </div>
                    <span className="font-semibold text-blue-600">{stats.openRequests}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-yellow-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">In Progress</span>
                    </div>
                    <span className="font-semibold text-yellow-600">{stats.inProgressRequests}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Completed</span>
                    </div>
                    <span className="font-semibold text-green-600">{stats.completedRequests}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-red-500 rounded-full mr-3"></div>
                      <span className="text-sm text-gray-700">Urgent/Emergency</span>
                    </div>
                    <span className="font-semibold text-red-600">{stats.urgentRequests}</span>
                  </div>
                </div>
              </Card>

              {/* Asset Health */}
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Asset Health</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Operational</span>
                    <span className="font-semibold text-green-600">{stats.operationalAssets}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.totalAssets > 0 ? (stats.operationalAssets / stats.totalAssets) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">In Maintenance: {stats.assetsInMaintenance}</span>
                    <span className="text-gray-500">Total: {stats.totalAssets}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Facilities Overview */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-500" />
                  Facilities Overview
                </h2>
                <Link href="/facilities/list" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              {facilities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BuildingOfficeIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No facilities added yet</p>
                  <Link href="/facilities/list">
                    <Button size="sm" className="mt-3">Add Facility</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {facilities.slice(0, 5).map((facility) => (
                    <div key={facility.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{facility.name}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPinIcon className="h-3 w-3 mr-1" />
                            {facility.city || facility.address || 'No location'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${facilityTypeColors[facility.facility_type || ''] || 'bg-gray-100 text-gray-800'}`}>
                          {facility.facility_type?.replace('_', ' ') || 'N/A'}
                        </span>
                        <p className="text-sm text-gray-500 mt-1">{facility.total_units || 0} units</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Upcoming Preventive Maintenance */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 mr-2 text-cyan-500" />
                  Upcoming Preventive Maintenance
                </h2>
                <Link href="/facilities/preventive" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                  View All <ArrowRightIcon className="h-4 w-4 ml-1" />
                </Link>
              </div>
              {preventiveSchedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>No preventive maintenance scheduled</p>
                  <Link href="/facilities/preventive">
                    <Button size="sm" className="mt-3">Add Schedule</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {preventiveSchedules.slice(0, 5).map((schedule) => {
                    const isOverdue = schedule.next_due_date && new Date(schedule.next_due_date) < today
                    const isDueSoon = schedule.next_due_date && !isOverdue && (() => {
                      const dueDate = new Date(schedule.next_due_date)
                      const weekFromNow = new Date(today)
                      weekFromNow.setDate(weekFromNow.getDate() + 7)
                      return dueDate <= weekFromNow
                    })()

                    return (
                      <div key={schedule.id} className={`flex items-center justify-between p-3 rounded-lg ${isOverdue ? 'bg-red-50' : isDueSoon ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                        <div className="flex items-center">
                          {isOverdue ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-3" />
                          ) : isDueSoon ? (
                            <ClockIcon className="h-5 w-5 text-yellow-500 mr-3" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{schedule.schedule_name}</p>
                            <p className="text-sm text-gray-500">{schedule.frequency_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-600'}`}>
                            {schedule.next_due_date ? new Date(schedule.next_due_date).toLocaleDateString() : 'Not scheduled'}
                          </p>
                          {isOverdue && <p className="text-xs text-red-500">Overdue</p>}
                          {isDueSoon && !isOverdue && <p className="text-xs text-yellow-500">Due soon</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="text-center p-4">
                <p className="text-sm font-medium text-blue-600">Active Facilities</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">{stats.activeFacilities}</p>
                <p className="text-xs text-blue-500 mt-1">of {stats.totalFacilities} total</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <div className="text-center p-4">
                <p className="text-sm font-medium text-green-600">Total Area</p>
                <p className="text-3xl font-bold text-green-700 mt-2">{stats.totalArea.toLocaleString()}</p>
                <p className="text-xs text-green-500 mt-1">sq ft managed</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="text-center p-4">
                <p className="text-sm font-medium text-purple-600">Pending Work Orders</p>
                <p className="text-3xl font-bold text-purple-700 mt-2">{stats.pendingWorkOrders}</p>
                <p className="text-xs text-purple-500 mt-1">awaiting completion</p>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100">
              <div className="text-center p-4">
                <p className="text-sm font-medium text-cyan-600">Upcoming Maintenance</p>
                <p className="text-3xl font-bold text-cyan-700 mt-2">{stats.upcomingSchedules}</p>
                <p className="text-xs text-cyan-500 mt-1">due this week</p>
              </div>
            </Card>
          </div>
        </div>
      </RoleGuard>
  )
}
