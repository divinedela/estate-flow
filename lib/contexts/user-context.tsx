'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url?: string | null
  organization_id: string | null
  is_active: boolean
}

interface UserRole {
  role: {
    name: string
    description: string | null
  }
  organization: {
    name: string
  } | null
}

interface UserContextType {
  authUser: User | null
  profile: UserProfile | null
  roles: UserRole[]
  loading: boolean
  hasRole: (roleName: string) => boolean
  isSuperAdmin: () => boolean
  refetch: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [roles, setRoles] = useState<UserRole[]>([])
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const fetchProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null)
      setRoles([])
      setLoading(false)
      setInitialized(true)
      return
    }

    const supabase = createClient()

    // Fetch app user profile
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (appUserError || !appUser) {
      setProfile(null)
      setRoles([])
      setLoading(false)
      setInitialized(true)
      return
    }

    setProfile(appUser as UserProfile)

    // Fetch user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        role:roles(name, description),
        organization:organizations(name)
      `)
      .eq('user_id', appUser.id)

    if (userRoles && Array.isArray(userRoles)) {
      setRoles(userRoles as unknown as UserRole[])
    } else {
      setRoles([])
    }

    setLoading(false)
    setInitialized(true)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      setAuthUser(user)
      if (!initialized) {
        fetchProfile(user)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null
      setAuthUser(user)
      // Only refetch if user changed
      if (user?.id !== authUser?.id) {
        fetchProfile(user)
      }
    })

    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hasRole = useCallback((roleName: string) => {
    return roles.some((ur) => ur.role?.name === roleName)
  }, [roles])

  const isSuperAdmin = useCallback(() => {
    return hasRole('super_admin')
  }, [hasRole])

  const refetch = useCallback(async () => {
    await fetchProfile(authUser)
  }, [authUser, fetchProfile])

  return (
    <UserContext.Provider value={{ authUser, profile, roles, loading, hasRole, isSuperAdmin, refetch }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

