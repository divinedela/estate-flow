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
} from '@heroicons/react/24/outline'
import { useUser } from '@/lib/contexts/user-context'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  subItems?: NavItem[]
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'HR',
    href: '/hr',
    icon: UserGroupIcon,
  },
  {
    name: 'Marketing / CRM',
    href: '/marketing',
    icon: MegaphoneIcon,
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: FolderIcon,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: CubeIcon,
  },
  {
    name: 'Facilities',
    href: '/facilities',
    icon: BuildingOfficeIcon,
  },
  {
    name: 'Purchasing',
    href: '/purchasing',
    icon: ShoppingCartIcon,
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Cog6ToothIcon,
  },
]

// Memoized Nav Item Component - only re-renders when its specific props change
const NavItemComponent = memo(function NavItemComponent({
  item,
  isExpanded,
  isActive,
  onToggle,
  currentPathname,
}: {
  item: NavItem
  isExpanded: boolean
  isActive: boolean
  onToggle: () => void
  currentPathname: string
}) {
  const hasSubItems = item.subItems && item.subItems.length > 0
  
  const isSubItemActive = (href: string) => {
    if (!currentPathname) return false
    if (href === '/dashboard') {
      return currentPathname === '/dashboard'
    }
    return currentPathname.startsWith(href)
  }

  if (hasSubItems) {
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
            {item.subItems!.map((subItem) => {
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
    prevProps.item.name === nextProps.item.name
  )
})

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { loading } = useUser()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const initializedRef = useRef(false)

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

  // Stable navigation reference
  const visibleNavigation = navigation

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
