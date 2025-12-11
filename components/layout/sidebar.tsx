'use client'

import { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeIcon,
  UserGroupIcon,
  MegaphoneIcon,
  FolderIcon,
  CubeIcon,
  BuildingOfficeIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  RectangleStackIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useUser } from '@/lib/contexts/user-context'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: NavItem[]
  allowedRoles?: string[] // Roles that can see this item. Empty = everyone can see
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    allowedRoles: ['super_admin', 'executive'],
  },
  // HR Module - Individual pages (only for hr_manager)
  {
    name: 'HR Dashboard',
    href: '/hr',
    icon: HomeIcon,
    allowedRoles: ['hr_manager'],
  },
  {
    name: 'Employees',
    href: '/hr/employees',
    icon: UserGroupIcon,
    allowedRoles: ['hr_manager'],
  },
  {
    name: 'Leave Management',
    href: '/hr/leave',
    icon: CalendarDaysIcon,
    allowedRoles: ['hr_manager'],
  },
  {
    name: 'Attendance',
    href: '/hr/attendance',
    icon: ClockIcon,
    allowedRoles: ['hr_manager'],
  },
  {
    name: 'Documents',
    href: '/hr/documents',
    icon: DocumentTextIcon,
    allowedRoles: ['hr_manager'],
  },
  // Projects Module - Individual pages (only for project_manager and site_engineer)
  {
    name: 'Projects Dashboard',
    href: '/projects',
    icon: HomeIcon,
    allowedRoles: ['project_manager', 'site_engineer'],
  },
  {
    name: 'Team Management',
    href: '/projects/team',
    icon: UserGroupIcon,
    allowedRoles: ['project_manager', 'site_engineer'],
  },
  {
    name: 'Budget & Costs',
    href: '/projects/budget',
    icon: CurrencyDollarIcon,
    allowedRoles: ['project_manager', 'site_engineer'],
  },
  {
    name: 'Issues',
    href: '/projects/issues',
    icon: ExclamationTriangleIcon,
    allowedRoles: ['project_manager', 'site_engineer'],
  },
  {
    name: 'Documents',
    href: '/projects/documents',
    icon: DocumentTextIcon,
    allowedRoles: ['project_manager', 'site_engineer'],
  },
  {
    name: 'Reports',
    href: '/projects/reports',
    icon: ChartBarIcon,
    allowedRoles: ['project_manager', 'site_engineer'],
  },
  {
    name: 'Calendar',
    href: '/projects/calendar',
    icon: CalendarIcon,
    allowedRoles: ['project_manager', 'site_engineer'],
  },
  {
    name: 'Messages',
    href: '/projects/messages',
    icon: ChatBubbleLeftRightIcon,
    allowedRoles: ['project_manager', 'site_engineer'],
  },
  // Module dashboards (for super_admin and executives)
  {
    name: 'HR',
    href: '/hr',
    icon: UserGroupIcon,
    allowedRoles: ['super_admin', 'executive'],
  },
  {
    name: 'Marketing / CRM',
    href: '/marketing',
    icon: MegaphoneIcon,
    allowedRoles: ['super_admin', 'marketing_officer', 'executive'],
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderIcon,
    allowedRoles: ['super_admin', 'executive'],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: CubeIcon,
    allowedRoles: ['super_admin', 'inventory_officer', 'executive', 'project_manager'],
  },
  {
    name: 'Facilities',
    href: '/facilities',
    icon: BuildingOfficeIcon,
    allowedRoles: ['super_admin', 'facility_manager', 'executive'],
  },
  {
    name: 'Purchasing',
    href: '/purchasing',
    icon: ShoppingCartIcon,
    allowedRoles: ['super_admin', 'procurement_officer', 'executive'],
  },
  // Agent role pages
  {
    name: 'Agent Dashboard',
    href: '/agents/dashboard',
    icon: HomeIcon,
    allowedRoles: ['agent'],
  },
  {
    name: 'Properties',
    href: '/marketing/properties',
    icon: BuildingOfficeIcon,
    allowedRoles: ['agent'],
  },
  {
    name: 'My Commissions',
    href: '/agents/commissions',
    icon: CurrencyDollarIcon,
    allowedRoles: ['agent'],
  },
  // Agent Manager role pages
  {
    name: 'All Agents',
    href: '/agents',
    icon: UsersIcon,
    allowedRoles: ['super_admin', 'agent_manager', 'executive'],
  },
  {
    name: 'Properties',
    href: '/marketing/properties',
    icon: BuildingOfficeIcon,
    allowedRoles: ['agent_manager'],
  },
  {
    name: 'Team Performance',
    href: '/agents/manager',
    icon: ChartBarIcon,
    allowedRoles: ['super_admin', 'agent_manager', 'executive'],
  },
  {
    name: 'Commissions',
    href: '/agents/commissions',
    icon: CurrencyDollarIcon,
    allowedRoles: ['super_admin', 'agent_manager', 'executive'],
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Cog6ToothIcon,
    allowedRoles: ['super_admin'],
  },
]

// Memoized Nav Item Component - only re-renders when its specific props change
const NavItemComponent = memo(function NavItemComponent({
  item,
  isExpanded,
  isActive,
  onToggle,
  currentPathname,
  userRoleNames,
}: {
  item: NavItem
  isExpanded: boolean
  isActive: boolean
  onToggle: () => void
  currentPathname: string
  userRoleNames: string[]
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0

  const isSubItemActive = (href: string) => {
    if (!currentPathname) return false
    if (href === '/dashboard') {
      return currentPathname === '/dashboard'
    }
    return currentPathname.startsWith(href)
  }

  // Filter sub-items based on user roles
  const visibleSubItems = hasSubItems
    ? item.subItems!.filter((subItem) => {
        if (!subItem.allowedRoles || subItem.allowedRoles.length === 0) {
          return true
        }
        return subItem.allowedRoles.some((role) => userRoleNames.includes(role))
      })
    : []

  if (hasSubItems && visibleSubItems.length > 0) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={`w-full flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive
              ? 'bg-indigo-600 text-white'
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }`}
        >
          <div className="flex items-center">
            <item.icon className="mr-3 h-5 w-5" />
            {item.name}
          </div>
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {visibleSubItems.map((subItem) => {
              const isSubActive = isSubItemActive(subItem.href)
              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  className={`flex items-center px-4 py-2 text-sm rounded-md transition-colors ${
                    isSubActive
                      ? 'bg-indigo-700 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                >
                  <subItem.icon className="mr-3 h-4 w-4" />
                  {subItem.name}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-indigo-600 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <item.icon className="mr-3 h-5 w-5" />
      {item.name}
    </Link>
  )
}, (prevProps, nextProps) => {
  // Return true if props are equal (skip re-render)
  return (
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.currentPathname === nextProps.currentPathname &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.userRoleNames.length === nextProps.userRoleNames.length &&
    prevProps.userRoleNames.every((role, index) => role === nextProps.userRoleNames[index])
  )
})

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { loading, roles } = useUser()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const initializedRef = useRef(false)

  // Get user's role names
  const userRoleNames = useMemo(() => {
    return roles.map((ur) => ur.role?.name).filter(Boolean) as string[]
  }, [roles])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Initialize expanded sections on mount only
  useEffect(() => {
    if (!initializedRef.current && pathname) {
      const newExpanded = new Set<string>()
      navigation.forEach((item) => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some((subItem) =>
            pathname.startsWith(subItem.href)
          )
          if (hasActiveSubItem || pathname.startsWith(item.href)) {
            newExpanded.add(item.name)
          }
        }
      })
      setExpandedSections(newExpanded)
      initializedRef.current = true
    }
  }, [pathname])

  const toggleSection = useCallback((sectionName: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName)
      } else {
        newSet.add(sectionName)
      }
      return newSet
    })
  }, [])

  const isItemActive = useCallback((href: string) => {
    if (!pathname) return false
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }, [pathname])

  // Filter navigation based on user roles
  const visibleNavigation = useMemo(() => {
    return navigation.filter((item) => {
      // If no allowedRoles specified, show to everyone
      if (!item.allowedRoles || item.allowedRoles.length === 0) {
        return true
      }
      // Check if user has any of the allowed roles
      return item.allowedRoles.some((role) => userRoleNames.includes(role))
    })
  }, [userRoleNames])

  // Compute effective expanded sections
  const effectiveExpanded = useMemo(() => {
    const expanded = new Set(expandedSections)
    if (pathname) {
      navigation.forEach((item) => {
        if (item.subItems) {
          const hasActiveSubItem = item.subItems.some((subItem) =>
            pathname.startsWith(subItem.href)
          )
          if (hasActiveSubItem || pathname.startsWith(item.href)) {
            expanded.add(item.name)
          }
        }
      })
    }
    return expanded
  }, [expandedSections, pathname])

  if (loading) {
    return (
      <div className="flex flex-col w-64 bg-gray-900 text-white">
        <div className="flex items-center h-16 px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Estate Flow</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white h-screen">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Estate Flow</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleNavigation.map((item) => {
          const hasSubItems = item.subItems && item.subItems.length > 0
          const isExpanded = !!(hasSubItems && effectiveExpanded.has(item.name))
          const isActive = isItemActive(item.href) || isExpanded

          return (
            <NavItemComponent
              key={item.name}
              item={item}
              isExpanded={isExpanded}
              isActive={isActive}
              onToggle={() => toggleSection(item.name)}
              currentPathname={pathname}
              userRoleNames={userRoleNames}
            />
          )
        })}
      </nav>
      
      {/* Sign Out Button at Bottom */}
      <div className="border-t border-gray-800 p-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  )
})
