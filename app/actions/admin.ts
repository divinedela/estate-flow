'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/types/database'

// Create admin client with service role for bypassing RLS
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

interface CreateUserInput {
  email: string
  password: string
  full_name: string
  phone?: string
  organization_id: string
  role_id: string
  is_active: boolean
}

export async function createUser(input: CreateUserInput) {
  try {
    // Verify the current user is a super admin
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Check if current user is super admin
    const { data: currentAppUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', currentUser.id)
      .single()

    if (!currentAppUser) {
      return { error: 'User profile not found' }
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', currentAppUser.id)

    const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'super_admin')

    if (!isSuperAdmin) {
      return { error: 'Unauthorized: Only super admins can create users' }
    }

    // Use admin client to bypass RLS
    const adminClient = getAdminClient()

    // Step 1: Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: input.full_name
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create auth user' }
    }

    // Step 2: Create app_user record using admin client
    const { data: appUserData, error: appUserError } = await adminClient
      .from('app_users')
      .insert({
        user_id: authData.user.id,
        email: input.email,
        full_name: input.full_name,
        phone: input.phone || null,
        organization_id: input.organization_id,
        is_active: input.is_active,
      })
      .select()
      .single()

    if (appUserError) {
      console.error('Error creating app_user:', appUserError)
      // Try to clean up auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return { error: 'Failed to create user profile: ' + appUserError.message }
    }

    // Step 3: Assign role using admin client
    if (input.role_id && appUserData) {
      const { error: roleError } = await adminClient
        .from('user_roles')
        .insert({
          user_id: appUserData.id,
          role_id: input.role_id,
          organization_id: input.organization_id,
        })

      if (roleError) {
        console.error('Error assigning role:', roleError)
        // Continue anyway, user is created, just missing role
      }
    }

    return { success: true, user: appUserData }
  } catch (error: any) {
    console.error('Error in createUser:', error)
    return { error: error.message || 'An unexpected error occurred' }
  }
}

interface UpdateUserInput {
  id: string
  full_name: string
  phone?: string
  organization_id: string
  role_id: string
  is_active: boolean
}

export async function updateUser(input: UpdateUserInput) {
  try {
    // Verify the current user is a super admin
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
      return { error: 'Not authenticated' }
    }

    // Check if current user is super admin or HR manager
    const { data: currentAppUser } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', currentUser.id)
      .single()

    if (!currentAppUser) {
      return { error: 'User profile not found' }
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role:roles(name)')
      .eq('user_id', currentAppUser.id)

    const hasPermission = userRoles?.some((ur: any) =>
      ur.role?.name === 'super_admin' || ur.role?.name === 'hr_manager'
    )

    if (!hasPermission) {
      return { error: 'Unauthorized: Only super admins or HR managers can update users' }
    }

    // Use admin client for reliable updates
    const adminClient = getAdminClient()

    // Update app_user
    const { error: updateError } = await adminClient
      .from('app_users')
      .update({
        full_name: input.full_name,
        phone: input.phone || null,
        organization_id: input.organization_id,
        is_active: input.is_active,
      })
      .eq('id', input.id)

    if (updateError) {
      console.error('Error updating user:', updateError)
      return { error: updateError.message }
    }

    // Update user role
    if (input.role_id) {
      // Delete existing roles
      await adminClient
        .from('user_roles')
        .delete()
        .eq('user_id', input.id)

      // Insert new role
      const { error: roleError } = await adminClient
        .from('user_roles')
        .insert({
          user_id: input.id,
          role_id: input.role_id,
          organization_id: input.organization_id,
        })

      if (roleError) {
        console.error('Error updating role:', roleError)
        return { error: 'User updated but failed to update role: ' + roleError.message }
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateUser:', error)
    return { error: error.message || 'An unexpected error occurred' }
  }
}
