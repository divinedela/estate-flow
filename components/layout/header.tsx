'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useUser } from '@/lib/contexts/user-context'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { createClient } from '@/lib/supabase/client'
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline'

export function Header() {
  const { profile } = useUser()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const getUserInitials = () => {
    if (!profile) return 'U'
    if (profile.full_name) {
      const names = profile.full_name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    if (profile.email) {
      return profile.email[0].toUpperCase()
    }
    return 'U'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">Estate Flow ERP</h2>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          {profile && (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                    className="h-9 w-9 rounded-full object-cover border-2 border-gray-300 hover:border-indigo-500 transition-colors"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-300 hover:border-indigo-500 transition-colors">
                    {getUserInitials()}
                  </div>
                )}
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profile.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {profile.email}
                    </p>
                  </div>
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        >
                          <UserCircleIcon className="h-5 w-5 mr-3 text-gray-400" />
                          Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSignOut}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100`}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-400" />
                          Sign Out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>
      </div>
    </header>
  )
}

