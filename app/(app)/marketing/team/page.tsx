import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { ArrowLeftIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { getTeamMembers, getTeamOverview } from '@/app/actions/marketing-teams'
import { TeamMembersList } from '@/components/marketing/team-members-list'
import { AddTeamMemberDialog } from '@/components/marketing/add-team-member-dialog'

export const dynamic = 'force-dynamic'

export default async function MarketingTeamPage() {
  const teamMembersResult = await getTeamMembers()
  const teamOverviewResult = await getTeamOverview()

  const teamMembers = teamMembersResult.success ? teamMembersResult.data : []
  const overview = teamOverviewResult.success ? teamOverviewResult.data : {
    team_size: 0,
    total_leads: 0,
    active_leads: 0,
    converted_leads: 0,
    conversion_rate: '0'
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'marketing_officer']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/marketing">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Marketing
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Team Management</h1>
              <p className="text-muted-foreground">
                Manage your marketing team members and their client assignments
              </p>
            </div>
          </div>
          <AddTeamMemberDialog />
        </div>

        {/* Team Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Team Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{overview.team_size}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active team members
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview.total_leads}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across entire team
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {overview.active_leads}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Converted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {overview.converted_leads}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Successful conversions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {overview.conversion_rate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Team average
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              View and manage your team members, track their performance, and assign clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMembersList initialMembers={teamMembers} />
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
