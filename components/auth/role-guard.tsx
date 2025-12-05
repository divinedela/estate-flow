'use client'

import { useUserProfile } from '@/lib/hooks/use-user-profile'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallback?: React.ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { roles, loading } = useUserProfile()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const hasAccess = roles.some(ur => allowedRoles.includes(ur.role.name))

  if (!hasAccess) {
    return fallback || (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800">You don't have permission to access this resource.</p>
      </div>
    )
  }

  return <>{children}</>
}

