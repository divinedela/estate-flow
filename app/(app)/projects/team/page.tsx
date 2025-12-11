import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  UserGroupIcon,
  UserPlusIcon,
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  FolderIcon,
} from '@heroicons/react/24/outline'

interface TeamMember {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  project_count: number
  avatar_url: string | null
}

interface ProjectAssignment {
  project_id: string
  project_name: string
  project_code: string
  role: string
  assigned_date: string
}

async function getTeamMembers() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) return []

  // Fetch all team members in the organization
  const { data: teamMembers, error: membersError } = await supabase
    .from('app_users')
    .select(`
      id,
      full_name,
      email,
      phone,
      user_roles!user_id(
        role:roles(name)
      )
    `)
    .eq('organization_id', profile.organization_id)

  if (membersError) {
    console.error('Error fetching team members:', membersError)
    return []
  }

  if (!teamMembers) return []

  // Get project counts for each member
  const membersWithCounts = await Promise.all(
    teamMembers.map(async (member: any) => {
      const { count } = await supabase
        .from('project_team_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', member.id)

      const roles = member.user_roles?.map((ur: any) => ur.role?.name).filter(Boolean) || []
      const projectRole = roles.find((r: string) =>
        ['project_manager', 'site_engineer'].includes(r)
      ) || 'team_member'

      return {
        id: member.id,
        full_name: member.full_name || 'Unknown',
        email: member.email || '',
        phone: member.phone,
        role: projectRole,
        project_count: count || 0,
        avatar_url: null,
      }
    })
  )

  return membersWithCounts as TeamMember[]
}

export default async function TeamManagementPage() {
  const teamMembers = await getTeamMembers()

  const roleColors: Record<string, string> = {
    project_manager: 'bg-indigo-100 text-indigo-800',
    site_engineer: 'bg-blue-100 text-blue-800',
    team_member: 'bg-gray-100 text-gray-800',
  }

  const roleLabels: Record<string, string> = {
    project_manager: 'Project Manager',
    site_engineer: 'Site Engineer',
    team_member: 'Team Member',
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'project_manager', 'executive']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage project team members and assignments
            </p>
          </div>
          <Link href="/projects/team/new">
            <Button>
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Add Team Member
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100">
                <UserGroupIcon className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Members</p>
                <p className="text-2xl font-semibold text-gray-900">{teamMembers.length}</p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <BriefcaseIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Project Managers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {teamMembers.filter(m => m.role === 'project_manager').length}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Site Engineers</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {teamMembers.filter(m => m.role === 'site_engineer').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Team Members Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Team Member</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Contact</TableHeader>
                  <TableHeader>Projects</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by adding team members.</p>
                      <div className="mt-6">
                        <Link href="/projects/team/new">
                          <Button className="inline-flex items-center">
                            <UserPlusIcon className="h-5 w-5 mr-2" />
                            Add Team Member
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  teamMembers.map((member) => (
                    <TableRow key={member.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-800">
                                {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.full_name}
                            </div>
                            <div className="text-sm text-gray-500">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${roleColors[member.role] || roleColors.team_member}`}>
                          {roleLabels[member.role] || 'Team Member'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center">
                            <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="flex items-center mt-1">
                              <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FolderIcon className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">{member.project_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        <Link href={`/projects/team/${member.id}`} className="text-indigo-600 hover:text-indigo-900">
                          View Details
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </RoleGuard>
  )
}
