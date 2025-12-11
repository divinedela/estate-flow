import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  CalendarIcon,
  ArrowLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FolderIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline'

interface ProjectEvent {
  id: string
  project_id: string
  project_name: string
  event_type: string
  title: string
  date: string
  status: string
}

async function getCalendarData() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { events: [], projects: [] }

  const { data: profile } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.organization_id) return { events: [], projects: [] }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('organization_id', profile.organization_id)
    .order('start_date', { ascending: true })

  // Mock events for now
  const mockEvents: ProjectEvent[] = []

  return {
    events: mockEvents,
    projects: projects || [],
  }
}

export default async function CalendarPage() {
  const data = await getCalendarData()
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' })
  const currentYear = currentDate.getFullYear()

  // Generate calendar days
  const firstDay = new Date(currentYear, currentDate.getMonth(), 1)
  const lastDay = new Date(currentYear, currentDate.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const calendarDays = []
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const statusColors: Record<string, string> = {
    planning: 'bg-gray-100 text-gray-800 border-gray-300',
    active: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'project_manager', 'site_engineer', 'executive']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Project Calendar</h1>
            <p className="mt-1 text-sm text-gray-500">
              View project timelines and upcoming milestones
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary">
              Today
            </Button>
            <Button>
              <CalendarIcon className="h-5 w-5 mr-2" />
              Schedule Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {currentMonth} {currentYear}
              </h2>
              <div className="flex items-center space-x-2">
                <Button variant="secondary" size="sm">
                  <ChevronLeftIcon className="h-5 w-5" />
                </Button>
                <Button variant="secondary" size="sm">
                  <ChevronRightIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const isToday = day === currentDate.getDate()
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[80px] p-2 border rounded-lg
                        ${day ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'}
                        ${isToday ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}
                      `}
                    >
                      {day && (
                        <>
                          <div className={`text-sm font-medium ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                            {day}
                          </div>
                          {/* Event indicators would go here */}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Upcoming Events */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            <div className="space-y-3">
              {data.events.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">No upcoming events</p>
                </div>
              ) : (
                data.events.map((event) => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{event.project_name}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Project Timeline */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option>All Projects</option>
                <option>Active Projects</option>
                <option>This Quarter</option>
              </select>
            </div>
          </div>

          {data.projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderIcon className="h-12 w-12 text-gray-300 mx-auto" />
              <p className="mt-2 text-sm text-gray-500">No projects to display</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.projects.slice(0, 10).map((project) => {
                const startDate = project.start_date ? new Date(project.start_date) : null
                const endDate = project.end_date ? new Date(project.end_date) : null
                const progress = Number(project.progress_percentage) || 0

                return (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900">{project.name}</h3>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${statusColors[project.status] || statusColors.planning}`}>
                            {project.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          {startDate && (
                            <span className="flex items-center">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              Start: {startDate.toLocaleDateString()}
                            </span>
                          )}
                          {endDate && (
                            <span className="flex items-center">
                              <CheckCircleIcon className="h-3 w-3 mr-1" />
                              End: {endDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{progress}%</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Timeline visualization */}
                    {startDate && endDate && (
                      <div className="mt-3 relative h-8">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t-2 border-gray-200"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-between px-2">
                          <div className="flex items-center space-x-1 bg-white px-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs text-gray-600">Start</span>
                          </div>
                          <div className="flex items-center space-x-1 bg-white px-2">
                            <span className="text-xs text-gray-600">End</span>
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </RoleGuard>
  )
}
