/**
 * Script to check which users have which roles
 * Run this with: npx tsx scripts/check-user-roles.ts
 */

import { createClient } from '@supabase/supabase-js'

// Hardcode from .env.local (for testing only)
const supabaseUrl = 'https://vwuxoohxvbkeshsdnidc.supabase.co'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dXhvb2h4dmJrZXNoc2RuaWRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg4NjIyMywiZXhwIjoyMDgwNDYyMjIzfQ.fb16VR6RRzz0cKx0AfuGa8tpAT7_q-_-94VImwXxkUM'

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function checkUserRoles() {
  console.log('🔍 Checking user roles...\n')

  // Get all app users
  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('id, email, full_name, is_active')
    .order('email')

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return
  }

  console.log(`Found ${users?.length || 0} users\n`)

  // Get all roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('id, name')

  if (rolesError) {
    console.error('Error fetching roles:', rolesError)
    return
  }

  console.log('Available roles:')
  roles?.forEach(role => {
    console.log(`  - ${role.name} (${role.id})`)
  })
  console.log('')

  // Check each user's roles
  for (const user of users || []) {
    const { data: userRoles, error: userRolesError } = await supabase
      .from('user_roles')
      .select(`
        role_id,
        role:roles(name)
      `)
      .eq('user_id', user.id)

    const roleNames = userRoles?.map((ur: any) => ur.role?.name).filter(Boolean) || []

    console.log(`📧 ${user.email}`)
    console.log(`   Name: ${user.full_name || 'N/A'}`)
    console.log(`   Status: ${user.is_active ? '✅ Active' : '❌ Inactive'}`)
    console.log(`   Roles: ${roleNames.length > 0 ? roleNames.join(', ') : '⚠️  NO ROLES ASSIGNED'}`)

    if (roleNames.includes('super_admin')) {
      console.log(`   ⭐ SUPER ADMIN`)
    }
    console.log('')
  }

  // Count users per role
  console.log('\n📊 Users per role:')
  const { data: roleCounts } = await supabase
    .from('user_roles')
    .select('role_id, role:roles(name)')

  const countMap = new Map<string, number>()
  roleCounts?.forEach((ur: any) => {
    const roleName = ur.role?.name
    if (roleName) {
      countMap.set(roleName, (countMap.get(roleName) || 0) + 1)
    }
  })

  countMap.forEach((count, roleName) => {
    console.log(`   ${roleName}: ${count} users`)
  })

  const usersWithoutRoles = (users?.length || 0) - (roleCounts?.length || 0)
  if (usersWithoutRoles > 0) {
    console.log(`   ⚠️  ${usersWithoutRoles} users have NO roles assigned`)
  }
}

checkUserRoles().then(() => {
  console.log('\n✅ Done!')
  process.exit(0)
}).catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
