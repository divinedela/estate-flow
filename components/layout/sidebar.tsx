'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  UserGroupIcon,
  MegaphoneIcon,
  FolderIcon,
  CubeIcon,
  BuildingOfficeIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'HR', href: '/hr', icon: UserGroupIcon },
  { name: 'Marketing / CRM', href: '/marketing', icon: MegaphoneIcon },
  { name: 'Projects', href: '/projects', icon: FolderIcon },
  { name: 'Inventory', href: '/inventory', icon: CubeIcon },
  { name: 'Facilities', href: '/facilities', icon: BuildingOfficeIcon },
  { name: 'Purchasing', href: '/purchasing', icon: ShoppingCartIcon },
  { name: 'Admin', href: '/admin', icon: Cog6ToothIcon },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-gray-900 text-white">
      <div className="flex items-center h-16 px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold">Estate Flow</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href)
          return (
            <Link
              key={item.name}
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
        })}
      </nav>
    </div>
  )
}



