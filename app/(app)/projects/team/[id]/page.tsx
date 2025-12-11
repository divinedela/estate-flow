import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BriefcaseIcon,
  FolderIcon,
  PencilIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

interface TeamMemberDetails {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
  created_at: string
  projects: {
    id: string
    name: string
    project_code: string
    status: string
  }[]
}

async function getTeamMember(id: string): Promise<TeamMemberDetails | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) return null

  // Fetch team member details
  const { data: member } = await supabase
    .from('app_users')
    .select(`
      id,
      full_name,
      email,
      phone,
      created_at,
      user_roles!inner(
        role:roles(name)
      )
    `)
    .eq('id', id)
    .eq('organization_id', profile.organization_id)
    .single()

  if (!member) return null

  // Get role
  const roles = member.user_roles?.map((ur: any) => ur.role?.name).filter(Boolean) || []
  const projectRole = roles.find((r: string) =>
    ['project_manager', 'site_engineer'].includes(r)
  ) || 'team_member'

  // Get projects
  const { data: projectAssignments } = await supabase
    .from('project_team_members')
    .select(`
      project:projects(
        id,
        name,
        project_code,
        status
      )
    `)
    .eq('user_id', id)

  const projects = projectAssignments?.map((pa: any) => pa.project).filter(Boolean) || []

  return {
    id: member.id,
    full_name: member.full_name || 'Unknown',
    email: member.email || '',
    phone: member.phone,
    role: projectRole,
    created_at: member.created_at,
    projects,
  }
}

export default async function TeamMemberDetailsPage({ params }: { params: { id: string } }) {
  const member = await getTeamMember(params.id)

  if (!member) {
    notFound()
  }

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

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-800',
    active: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'project_manager', 'executive']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/projects/team" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{member.full_name}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Team member details and project assignments
              </p>
            </div>
          </div>
          <Link href={`/projects/team/${member.id}/edit`}>
            <Button>
              <PencilIcon className="h-5 w-5 mr-2" />
              Edit Member
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Member Information */}
          <Card className="lg:col-span-1">
            <div className="text-center">
              <div className="mx-auto h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                <span className="text-3xl font-medium text-indigo-800">
                  {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">{member.full_name}</h2>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold mt-2 ${roleColors[member.role] || roleColors.team_member}`}>
                {roleLabels[member.role] || 'Team Member'}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {member.email}
                </div>
              </div>

              {member.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Phone</label>
                  <div className="mt-1 flex items-center text-sm text-gray-900">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    {member.phone}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500">Role</label>
                <div className="mt-1 flex items-center text-sm text-gray-900">
                  <BriefcaseIcon className="h-4 w-4 mr-2 text-gray-400" />
                  {roleLabels[member.role] || 'Team Member'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">Member Since</label>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(member.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </Card>

          {/* Project Assignments */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Assignments</h3>
              <div className="flex items-center space-x-2">
                <FolderIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">{member.projects.length} Projects</span>
              </div>
            </div>

            {member.projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Not assigned to any projects yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {member.projects.map((project) => (
                  <div key={project.id} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{project.name}</h4>
                        <p className="text-xs text-gray-500 mt-1">{project.project_code}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusColors[project.status] || statusColors.planning}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Link
                        href={`/projects/${project.id}`}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        View Project →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}
