'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EllipsisVerticalIcon, EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { deactivateTeamMember, reactivateTeamMember } from '@/app/actions/marketing-teams'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface TeamMember {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  assigned_at: string
  stats: {
    total_leads: number
    active_leads: number
    converted_leads: number
    conversion_rate: string
  }
}

interface TeamMembersListProps {
  initialMembers: TeamMember[]
}

export function TeamMembersList({ initialMembers }: TeamMembersListProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleDeactivate = async (memberId: string) => {
    if (!confirm('Are you sure you want to deactivate this team member? They will no longer be able to login.')) {
      return
    }

    setLoading(memberId)
    try {
      const result = await deactivateTeamMember(memberId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Team member deactivated')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to deactivate team member')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const handleReactivate = async (memberId: string) => {
    setLoading(memberId)
    try {
      const result = await reactivateTeamMember(memberId)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Team member reactivated')
        router.refresh()
      }
    } catch (error) {
      toast.error('Failed to reactivate team member')
      console.error(error)
    } finally {
      setLoading(null)
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (initialMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No team members yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Click "Add Team Member" to create your first team member
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Team Member</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Total Leads</TableHead>
            <TableHead>Active</TableHead>
            <TableHead>Converted</TableHead>
            <TableHead>Conversion Rate</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialMembers.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback>{getInitials(member.full_name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{member.full_name || 'No name'}</div>
                    <div className="text-sm text-muted-foreground">{member.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <EnvelopeIcon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                      {member.email}
                    </span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-1 text-sm">
                      <PhoneIcon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{member.phone}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold">{member.stats.total_leads}</span>
              </TableCell>
              <TableCell>
                <span className="text-orange-600 font-medium">{member.stats.active_leads}</span>
              </TableCell>
              <TableCell>
                <span className="text-green-600 font-medium">{member.stats.converted_leads}</span>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {member.stats.conversion_rate}%
                </Badge>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(member.assigned_at), { addSuffix: true })}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant={member.is_active ? 'default' : 'secondary'}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading === member.id}
                    >
                      <EllipsisVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {member.is_active ? (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeactivate(member.id)}
                      >
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleReactivate(member.id)}>
                        Reactivate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
