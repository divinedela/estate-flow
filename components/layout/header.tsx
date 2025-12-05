'use client'

import { useUserProfile } from '@/lib/hooks/use-user-profile'
import { LogoutButton } from '@/components/auth/logout-button'
import { NotificationBell } from '@/components/notifications/notification-bell'

export function Header() {
  const { profile } = useUserProfile()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-900">Estate Flow ERP</h2>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationBell />
          {profile && (
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile.full_name || profile.email}</p>
                <p className="text-xs text-gray-500">{profile.email}</p>
              </div>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(profile.full_name || profile.email)[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}

