'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Create a new marketing team member
 * Only marketing managers can create team members
 */
export async function createTeamMember(data: {
  email: string
  password: string
  full_name: string
  phone?: string
}) {
  const supabase = await createClient()

  // Get current user
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'You must be logged in to create team members' }
  }

  // Get current user profile
  const { data: profile } = await supabase
    .from('app_users')
    .select('id, organization_id')
    .eq('user_id', currentUser.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found' }
  }

  // Check if user is a marketing manager or super admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(name)')
    .eq('user_id', profile.id)

  const hasPermission = userRoles?.some((ur: any) =>
    ur.role?.name === 'marketing_officer' || ur.role?.name === 'super_admin'
  )

  if (!hasPermission) {
    return { error: 'Only marketing managers can create team members' }
  }

  try {
    // Step 1: Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: data.full_name,
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
        full_name: data.full_name,
        phone: data.phone || null,
        organization_id: profile.organization_id,
        is_active: true,
      })
      .select()
      .single()

    if (appUserError) {
      console.error('Error creating app_user:', appUserError)
      return { error: `Failed to create user profile: ${appUserError.message}` }
    }

    // Step 3: Get marketing_team_member role
    const { data: roleData } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'marketing_team_member')
      .single()

    if (!roleData) {
      return { error: 'Marketing team member role not found. Please run database migrations.' }
    }

    // Step 4: Assign marketing_team_member role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: appUserData.id,
        role_id: roleData.id,
        organization_id: profile.organization_id,
      })

    if (roleError) {
      console.error('Error assigning role:', roleError)
      return { error: 'Failed to assign role to team member' }
    }

    // Step 5: Create team relationship
    const { error: teamError } = await supabase
      .from('marketing_teams')
      .insert({
        organization_id: profile.organization_id,
        manager_id: profile.id,
        team_member_id: appUserData.id,
        assigned_by: profile.id,
        is_active: true,
      })

    if (teamError) {
      console.error('Error creating team relationship:', teamError)
      return { error: 'Failed to create team relationship' }
    }

    revalidatePath('/marketing/team')

    return {
      success: true,
      data: appUserData,
      message: 'Team member created successfully'
    }
  } catch (error: any) {
    console.error('Error in createTeamMember:', error)
    return { error: error.message || 'Failed to create team member' }
  }
}

/**
 * Get all team members for the current marketing manager
 */
export async function getTeamMembers() {
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'You must be logged in' }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', currentUser.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found' }
  }

  // Get team members with their details and assigned lead counts
  const { data: teamMembers, error } = await supabase
    .from('marketing_teams')
    .select(`
      id,
      is_active,
      assigned_at,
      team_member:app_users!marketing_teams_team_member_id_fkey(
        id,
        email,
        full_name,
        phone,
        avatar_url,
        is_active
      )
    `)
    .eq('manager_id', profile.id)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching team members:', error)
    return { error: 'Failed to fetch team members' }
  }

  // Get lead counts for each team member
  const teamMembersWithStats = await Promise.all(
    (teamMembers || []).map(async (tm: any) => {
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', tm.team_member.id)

      const { count: activeLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', tm.team_member.id)
        .in('status', ['new', 'contacted', 'qualified', 'negotiating'])

      const { count: convertedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_to', tm.team_member.id)
        .eq('status', 'converted')

      return {
        ...tm.team_member,
        team_relationship_id: tm.id,
        assigned_at: tm.assigned_at,
        stats: {
          total_leads: totalLeads || 0,
          active_leads: activeLeads || 0,
          converted_leads: convertedLeads || 0,
          conversion_rate: totalLeads ? ((convertedLeads || 0) / totalLeads * 100).toFixed(1) : '0'
        }
      }
    })
  )

  return { success: true, data: teamMembersWithStats }
}

/**
 * Deactivate a team member (soft delete)
 */
export async function deactivateTeamMember(teamMemberId: string) {
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'You must be logged in' }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', currentUser.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found' }
  }

  // Update team relationship
  const { error: teamError } = await supabase
    .from('marketing_teams')
    .update({ is_active: false })
    .eq('manager_id', profile.id)
    .eq('team_member_id', teamMemberId)

  if (teamError) {
    console.error('Error deactivating team member:', teamError)
    return { error: 'Failed to deactivate team member' }
  }

  // Also deactivate the user account
  const { error: userError } = await supabase
    .from('app_users')
    .update({ is_active: false })
    .eq('id', teamMemberId)

  if (userError) {
    console.error('Error deactivating user:', userError)
  }

  revalidatePath('/marketing/team')

  return { success: true, message: 'Team member deactivated successfully' }
}

/**
 * Reactivate a team member
 */
export async function reactivateTeamMember(teamMemberId: string) {
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'You must be logged in' }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', currentUser.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found' }
  }

  // Update team relationship
  const { error: teamError } = await supabase
    .from('marketing_teams')
    .update({ is_active: true })
    .eq('manager_id', profile.id)
    .eq('team_member_id', teamMemberId)

  if (teamError) {
    console.error('Error reactivating team member:', teamError)
    return { error: 'Failed to reactivate team member' }
  }

  // Also reactivate the user account
  const { error: userError } = await supabase
    .from('app_users')
    .update({ is_active: true })
    .eq('id', teamMemberId)

  if (userError) {
    console.error('Error reactivating user:', userError)
  }

  revalidatePath('/marketing/team')

  return { success: true, message: 'Team member reactivated successfully' }
}

/**
 * Get team members for lead assignment dropdown
 */
export async function getTeamMembersForAssignment() {
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'You must be logged in' }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', currentUser.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found' }
  }

  // Get team members
  const { data: teamMembers, error } = await supabase
    .from('marketing_teams')
    .select(`
      team_member:app_users!marketing_teams_team_member_id_fkey(
        id,
        full_name,
        email
      )
    `)
    .eq('manager_id', profile.id)
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching team members:', error)
    return { error: 'Failed to fetch team members' }
  }

  // Include the manager themselves
  const members = [
    {
      id: profile.id,
      full_name: 'Me (Manager)',
      email: currentUser.email
    },
    ...(teamMembers || []).map((tm: any) => tm.team_member)
  ]

  return { success: true, data: members }
}

/**
 * Get team overview stats for the marketing manager
 */
export async function getTeamOverview() {
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser) {
    return { error: 'You must be logged in' }
  }

  const { data: profile } = await supabase
    .from('app_users')
    .select('id')
    .eq('user_id', currentUser.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found' }
  }

  // Get team member IDs
  const { data: teamMembers } = await supabase
    .from('marketing_teams')
    .select('team_member_id')
    .eq('manager_id', profile.id)
    .eq('is_active', true)

  const teamMemberIds = teamMembers?.map(tm => tm.team_member_id) || []
  const allMemberIds = [profile.id, ...teamMemberIds] // Include manager

  // Get total leads for entire team
  const { count: totalTeamLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .in('assigned_to', allMemberIds)

  // Get active leads for entire team
  const { count: activeTeamLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .in('assigned_to', allMemberIds)
    .in('status', ['new', 'contacted', 'qualified', 'negotiating'])

  // Get converted leads for entire team
  const { count: convertedTeamLeads } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .in('assigned_to', allMemberIds)
    .eq('status', 'converted')

  return {
    success: true,
    data: {
      team_size: teamMemberIds.length,
      total_leads: totalTeamLeads || 0,
      active_leads: activeTeamLeads || 0,
      converted_leads: convertedTeamLeads || 0,
      conversion_rate: totalTeamLeads
        ? ((convertedTeamLeads || 0) / totalTeamLeads * 100).toFixed(1)
        : '0'
    }
  }
}
