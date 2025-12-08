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
  AreaChart,
  Area,
} from 'recharts'

// Modern color palette
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
  gray: '#9CA3AF',
  emerald: '#059669',
  amber: '#D97706',
}

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-100">
        {label && <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color || entry.fill }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Project Status Pie Chart
interface ProjectStatusChartProps {
  ongoing: number
  onHold: number
  completed: number
}

export function ProjectStatusChart({ ongoing, onHold, completed }: ProjectStatusChartProps) {
  const data = [
    { name: 'Ongoing', value: ongoing, color: COLORS.blue },
    { name: 'On Hold', value: onHold, color: COLORS.amber },
    { name: 'Completed', value: completed, color: COLORS.emerald },
  ].filter(item => item.value > 0)

  const total = ongoing + onHold + completed

  if (data.length === 0 || total === 0) {
    return (
      <div className="h-[160px] flex flex-col items-center justify-center text-gray-400">
        <svg className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm">No projects yet</p>
      </div>
    )
  }

  return (
    <div className="h-[160px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
      </div>
    </div>
  )
}

// Budget vs Actual Bar Chart
interface BudgetChartProps {
  budget: number
  actual: number
}

export function BudgetChart({ budget, actual }: BudgetChartProps) {
  const percentage = budget > 0 ? Math.round((actual / budget) * 100) : 0
  const isOverBudget = actual > budget

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`
    return `$${value}`
  }

  if (budget === 0 && actual === 0) {
    return (
      <div className="h-[160px] flex flex-col items-center justify-center text-gray-400">
        <svg className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">No budget data</p>
      </div>
    )
  }

  return (
    <div className="h-[160px] flex flex-col justify-center">
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-600">Budget</span>
            <span className="font-semibold text-gray-900">{formatCurrency(budget)}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-600">Actual</span>
            <span className={`font-semibold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(actual)}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                isOverBudget 
                  ? 'bg-gradient-to-r from-red-400 to-red-500' 
                  : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
              }`} 
              style={{ width: `${Math.min(percentage, 100)}%` }} 
            />
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <span className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
          {percentage}%
        </span>
        <span className="text-xs text-gray-500 ml-1">utilized</span>
      </div>
    </div>
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
    { name: 'Won', value: converted, color: COLORS.emerald },
  ].filter(item => item.value > 0)

  const total = hot + warm + cold + converted

  if (data.length === 0 || total === 0) {
    return (
      <div className="h-[160px] flex flex-col items-center justify-center text-gray-400">
        <svg className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p className="text-sm">No leads yet</p>
      </div>
    )
  }

  return (
    <div className="h-[160px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500">Leads</p>
        </div>
      </div>
    </div>
  )
}

// Lead Trend Line Chart
interface LeadTrendChartProps {
  data: { month: string; leads: number }[]
}

export function LeadTrendChart({ data }: LeadTrendChartProps) {
  if (data.length === 0 || data.every(d => d.leads === 0)) {
    return (
      <div className="h-[160px] flex flex-col items-center justify-center text-gray-400">
        <svg className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-sm">No trend data</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="leads"
          stroke={COLORS.purple}
          strokeWidth={2}
          fill="url(#leadGradient)"
          dot={{ fill: COLORS.purple, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: COLORS.purple }}
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
  const total = active + inactive
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0

  if (total === 0) {
    return (
      <div className="h-[140px] flex flex-col items-center justify-center text-gray-400">
        <svg className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-xs">No employees</p>
      </div>
    )
  }

  return (
    <div className="h-[140px] flex flex-col items-center justify-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="40"
            cy="40"
            r="32"
            stroke="url(#activeGradient)"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${activePercent * 2.01} 201`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={COLORS.emerald} />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{activePercent}%</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">Active</p>
    </div>
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
    { name: 'In Stock', value: inStock, color: COLORS.emerald },
    { name: 'Low Stock', value: lowStock, color: COLORS.amber },
    { name: 'Out of Stock', value: outOfStock, color: COLORS.red },
  ].filter(item => item.value > 0)

  const total = inStock + lowStock + outOfStock

  if (data.length === 0 || total === 0) {
    return (
      <div className="h-[140px] flex flex-col items-center justify-center text-gray-400">
        <svg className="h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-xs">No items</p>
      </div>
    )
  }

  return (
    <div className="h-[140px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={50}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{total}</p>
          <p className="text-[10px] text-gray-500">Items</p>
        </div>
      </div>
    </div>
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
    { name: 'Pending', value: pending, fill: COLORS.amber },
    { name: 'In Progress', value: inProgress, fill: COLORS.blue },
    { name: 'Done', value: completed, fill: COLORS.emerald },
    { name: 'Overdue', value: overdue, fill: COLORS.red },
  ]

  const hasData = data.some(d => d.value > 0)

  if (!hasData) {
    return (
      <div className="h-[160px] flex flex-col items-center justify-center text-gray-400">
        <svg className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p className="text-sm">No maintenance data</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
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
  if (data.length === 0 || data.every(d => d.orders === 0)) {
    return (
      <div className="h-[160px] flex flex-col items-center justify-center text-gray-400">
        <svg className="h-10 w-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">No PO data</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="poGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="orders"
          stroke={COLORS.indigo}
          strokeWidth={2}
          fill="url(#poGradient)"
          dot={{ fill: COLORS.indigo, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: COLORS.indigo }}
        />
      </AreaChart>
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
  const activePercent = total > 0 ? Math.round((active / total) * 100) : 0

  return (
    <div className="h-[100px] flex flex-col items-center justify-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke="#E5E7EB"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="32"
            cy="32"
            r="26"
            stroke={COLORS.emerald}
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${activePercent * 1.63} 163`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-gray-900">{activePercent}%</span>
        </div>
      </div>
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
    { name: 'Converted', value: converted, color: COLORS.emerald },
  ]

  const maxValue = Math.max(...stages.map(s => s.value), 1)

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <div key={stage.name} className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-600">{stage.name}</span>
            <span className="text-xs font-semibold text-gray-900">{stage.value}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
