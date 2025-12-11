import { createClient } from '@/lib/supabase/client'

export async function getUserRole(): Promise<string | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: appUser } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!appUser) return null

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', appUser.id)

  const roles = userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || []

  // Return the highest priority role
  if (roles.includes('super_admin')) return 'super_admin'
  if (roles.includes('executive')) return 'executive'
  if (roles.includes('hr_manager')) return 'hr_manager'

  return null
}

export function shouldShowBackButton(userRole: string | null): boolean {
  return userRole === 'super_admin' || userRole === 'executive'
}
