'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('app_users')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return profile
}

export async function createUser(data: {
  email: string
  password: string
  full_name?: string
  phone?: string
  organization_id?: string
  role_id?: string
  is_active?: boolean
}) {
  const supabase = await createClient()
  
  // Check if user is super admin
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'You must be logged in to create users' }
  }

  // Verify user is super admin
  const { data: profile } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', currentUser.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found' }
  }

  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', profile.id)

  const isSuperAdmin = userRoles?.some((ur: any) => ur.role?.name === 'super_admin')
  
  if (!isSuperAdmin) {
    return { error: 'Only super admins can create users' }
  }

  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
        },
        emailRedirectTo: undefined, // Don't send confirmation email
      }
    })

    if (authError) {
      return { error: authError.message }
    }

    if (!authData.user) {
      return { error: 'Failed to create auth user' }
    }

    // Step 2: Create app_user record
    const { data: appUserData, error: appUserError } = await supabase
      .from('app_users')
      .insert({
        user_id: authData.user.id,
        email: data.email,
        full_name: data.full_name || null,
        phone: data.phone || null,
        organization_id: data.organization_id || null,
        is_active: data.is_active ?? true,
      })
      .select()
      .single()

    if (appUserError) {
      console.error('Error creating app_user:', appUserError)
      return { error: `Failed to create user profile: ${appUserError.message}` }
    }

    // Step 3: Assign role if provided
    if (data.role_id && appUserData) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: appUserData.id,
          role_id: data.role_id,
          organization_id: data.organization_id || null,
        })

      if (roleError) {
        console.error('Error assigning role:', roleError)
        // Don't fail the whole operation, just log it
      }
    }

    return { 
      success: true, 
      data: appUserData,
      message: 'User created successfully' 
    }
  } catch (error: any) {
    console.error('Error in createUser:', error)
    return { error: error.message || 'Failed to create user' }
  }
}



