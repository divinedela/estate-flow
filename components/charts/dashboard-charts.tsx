'use client'

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts'

// Color palettes
const COLORS = {
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  red: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1',
  pink: '#EC4899',
  cyan: '#06B6D4',
  orange: '#F97316',
  gray: '#6B7280',
}

const PIE_COLORS = [COLORS.blue, COLORS.yellow, COLORS.green, COLORS.red, COLORS.purple]

// Project Status Pie Chart
interface ProjectStatusChartProps {
  ongoing: number
  onHold: number
  completed: number
}

export function ProjectStatusChart({ ongoing, onHold, completed }: ProjectStatusChartProps) {
  const data = [
    { name: 'Ongoing', value: ongoing, color: COLORS.blue },
    { name: 'On Hold', value: onHold, color: COLORS.yellow },
    { name: 'Completed', value: completed, color: COLORS.green },
  ].filter(item => item.value > 0)

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-400">
        No project data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [value, 'Projects']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Budget vs Actual Bar Chart
interface BudgetChartProps {
  budget: number
  actual: number
}

export function BudgetChart({ budget, actual }: BudgetChartProps) {
  const data = [
    { name: 'Budget', value: budget, fill: COLORS.blue },
    { name: 'Actual', value: actual, fill: actual > budget ? COLORS.red : COLORS.green },
  ]

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tickFormatter={formatCurrency} />
        <YAxis type="category" dataKey="name" width={60} />
        <Tooltip 
          formatter={(value: number) => [formatCurrency(value), '']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Lead Status Pie Chart
interface LeadStatusChartProps {
  hot: number
  warm: number
  cold: number
  converted: number
}

export function LeadStatusChart({ hot, warm, cold, converted }: LeadStatusChartProps) {
  const data = [
    { name: 'Hot', value: hot, color: COLORS.red },
    { name: 'Warm', value: warm, color: COLORS.orange },
    { name: 'Cold', value: cold, color: COLORS.blue },
    { name: 'Converted', value: converted, color: COLORS.green },
  ].filter(item => item.value > 0)

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-400">
        No lead data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [value, 'Leads']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Lead Trend Line Chart
interface LeadTrendChartProps {
  data: { month: string; leads: number }[]
}

export function LeadTrendChart({ data }: LeadTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-gray-400">
        No trend data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Area
          type="monotone"
          dataKey="leads"
          stroke={COLORS.purple}
          strokeWidth={2}
          fill="url(#leadGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// Employee Status Chart
interface EmployeeStatusChartProps {
  active: number
  inactive: number
}

export function EmployeeStatusChart({ active, inactive }: EmployeeStatusChartProps) {
  const data = [
    { name: 'Active', value: active, color: COLORS.green },
    { name: 'Inactive', value: inactive, color: COLORS.gray },
  ].filter(item => item.value > 0)

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-gray-400">
        No employee data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [value, 'Employees']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Inventory Stock Chart
interface InventoryChartProps {
  inStock: number
  lowStock: number
  outOfStock: number
}

export function InventoryChart({ inStock, lowStock, outOfStock }: InventoryChartProps) {
  const data = [
    { name: 'In Stock', value: inStock, color: COLORS.green },
    { name: 'Low Stock', value: lowStock, color: COLORS.yellow },
    { name: 'Out of Stock', value: outOfStock, color: COLORS.red },
  ].filter(item => item.value > 0)

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-gray-400">
        No inventory data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [value, 'Items']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// Maintenance Status Chart
interface MaintenanceChartProps {
  pending: number
  inProgress: number
  completed: number
  overdue: number
}

export function MaintenanceChart({ pending, inProgress, completed, overdue }: MaintenanceChartProps) {
  const data = [
    { name: 'Pending', value: pending },
    { name: 'In Progress', value: inProgress },
    { name: 'Completed', value: completed },
    { name: 'Overdue', value: overdue },
  ]

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          <Cell fill={COLORS.yellow} />
          <Cell fill={COLORS.blue} />
          <Cell fill={COLORS.green} />
          <Cell fill={COLORS.red} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// Purchase Orders Trend
interface POTrendChartProps {
  data: { month: string; orders: number; amount: number }[]
}

export function POTrendChart({ data }: POTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-gray-400">
        No purchase order data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
        />
        <Line
          type="monotone"
          dataKey="orders"
          stroke={COLORS.indigo}
          strokeWidth={2}
          dot={{ fill: COLORS.indigo, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// System Users Chart
interface UsersChartProps {
  active: number
  inactive: number
}

export function UsersChart({ active, inactive }: UsersChartProps) {
  const total = active + inactive
  const activePercent = total > 0 ? (active / total) * 100 : 0

  return (
    <div className="h-[120px] flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="48"
            cy="48"
            r="40"
            stroke={COLORS.green}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${activePercent * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-gray-900">{activePercent.toFixed(0)}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-gray-500">Active Users</p>
    </div>
  )
}

// Conversion Funnel
interface ConversionFunnelProps {
  total: number
  qualified: number
  proposal: number
  converted: number
}

export function ConversionFunnel({ total, qualified, proposal, converted }: ConversionFunnelProps) {
  const stages = [
    { name: 'Total Leads', value: total, color: COLORS.blue },
    { name: 'Qualified', value: qualified, color: COLORS.purple },
    { name: 'Proposal', value: proposal, color: COLORS.orange },
    { name: 'Converted', value: converted, color: COLORS.green },
  ]

  const maxValue = Math.max(...stages.map(s => s.value), 1)

  return (
    <div className="space-y-3">
      {stages.map((stage, index) => (
        <div key={stage.name} className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-600">{stage.name}</span>
            <span className="text-sm font-semibold text-gray-900">{stage.value}</span>
          </div>
          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(stage.value / maxValue) * 100}%`,
                backgroundColor: stage.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

