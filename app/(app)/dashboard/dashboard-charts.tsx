'use client'

import dynamic from 'next/dynamic'

// Dynamically import charts to avoid SSR issues with Recharts
const ProjectStatusChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.ProjectStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const BudgetChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.BudgetChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const LeadStatusChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.LeadStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const LeadTrendChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.LeadTrendChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const EmployeeStatusChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.EmployeeStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const InventoryChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.InventoryChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const MaintenanceChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.MaintenanceChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const POTrendChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.POTrendChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

const UsersChart = dynamic(
  () => import('@/components/charts/dashboard-charts').then(mod => mod.UsersChart),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

function ChartSkeleton() {
  return (
    <div className="h-[180px] flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
        <div className="mt-2 w-16 h-3 bg-gray-200 rounded"></div>
      </div>
    </div>
  )
}

type ChartType = 
  | 'projectStatus' 
  | 'budget' 
  | 'leadStatus' 
  | 'leadTrend' 
  | 'employeeStatus' 
  | 'inventory' 
  | 'maintenance' 
  | 'poTrend' 
  | 'users'

interface DashboardChartsProps {
  type: ChartType
  data: any
}

export function DashboardCharts({ type, data }: DashboardChartsProps) {
  switch (type) {
    case 'projectStatus':
      return <ProjectStatusChart {...data} />
    case 'budget':
      return <BudgetChart {...data} />
    case 'leadStatus':
      return <LeadStatusChart {...data} />
    case 'leadTrend':
      return <LeadTrendChart data={data} />
    case 'employeeStatus':
      return <EmployeeStatusChart {...data} />
    case 'inventory':
      return <InventoryChart {...data} />
    case 'maintenance':
      return <MaintenanceChart {...data} />
    case 'poTrend':
      return <POTrendChart data={data} />
    case 'users':
      return <UsersChart {...data} />
    default:
      return null
  }
}

