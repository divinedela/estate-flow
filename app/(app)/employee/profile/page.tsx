import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RoleGuard } from '@/components/auth/role-guard'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  BriefcaseIcon,
  UserGroupIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline'
import { getMyEmployeeProfile } from '@/app/actions/employee'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function MyProfilePage() {
  const profileResult = await getMyEmployeeProfile()
  const profile = profileResult.success ? profileResult.data : null

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-600">
              Employee profile not found. Please contact HR.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const employmentStatusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    on_leave: 'bg-blue-100 text-blue-800',
    terminated: 'bg-red-100 text-red-800',
  }

  return (
    <RoleGuard allowedRoles={['employee']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/employee">
              <Button variant="ghost" size="sm">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">View your personal information and employment details</p>
            </div>
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-indigo-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {profile.first_name} {profile.last_name}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {profile.position} • {profile.department}
                  </CardDescription>
                  <div className="mt-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize ${
                        employmentStatusColors[profile.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {profile.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-base font-medium text-gray-900">
                  {profile.first_name} {profile.last_name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <EnvelopeIcon className="h-4 w-4" />
                  Email
                </label>
                <p className="text-base text-gray-900">{profile.email || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4" />
                  Phone
                </label>
                <p className="text-base text-gray-900">{profile.phone || 'Not provided'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Date of Birth
                </label>
                <p className="text-base text-gray-900">
                  {profile.date_of_birth
                    ? format(new Date(profile.date_of_birth), 'MMMM d, yyyy')
                    : 'Not provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  Address
                </label>
                <p className="text-base text-gray-900">{profile.address || 'Not provided'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BriefcaseIcon className="h-5 w-5" />
                Employment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <IdentificationIcon className="h-4 w-4" />
                  Employee Number
                </label>
                <p className="text-base font-medium text-gray-900">
                  {profile.employee_number || 'Not assigned'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Position</label>
                <p className="text-base text-gray-900">{profile.position || 'Not assigned'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-base text-gray-900">{profile.department || 'Not assigned'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Employment Type</label>
                <p className="text-base text-gray-900 capitalize">
                  {profile.employment_type?.replace('_', ' ') || 'Not specified'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Hire Date
                </label>
                <p className="text-base text-gray-900">
                  {profile.hire_date
                    ? format(new Date(profile.hire_date), 'MMMM d, yyyy')
                    : 'Not provided'}
                </p>
              </div>

              {profile.manager && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <UserGroupIcon className="h-4 w-4" />
                    Reports To
                  </label>
                  <p className="text-base text-gray-900">
                    {profile.manager.first_name} {profile.manager.last_name}
                  </p>
                  <p className="text-sm text-gray-500">{profile.manager.position}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PhoneIcon className="h-5 w-5" />
                Emergency Contact
              </CardTitle>
              <CardDescription>Person to contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Contact Name</label>
                <p className="text-base text-gray-900">
                  {profile.emergency_contact_name || 'Not provided'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                  <PhoneIcon className="h-4 w-4" />
                  Contact Phone
                </label>
                <p className="text-base text-gray-900">
                  {profile.emergency_contact_phone || 'Not provided'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          {profile.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base text-gray-700 whitespace-pre-wrap">{profile.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Note */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> If you need to update any of your personal information, please contact the HR department.
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
