'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  PencilIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'

interface Employee {
  id: string
  employee_number: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  department: string | null
  position: string | null
  employment_type: string | null
  hire_date: string | null
  status: string
  manager_id: string | null
  salary: number | null
  address: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  notes: string | null
  created_at: string
}

interface Document {
  id: string
  document_type: string
  document_name: string
  expiry_date: string | null
  status: string
}

interface LeaveBalance {
  leave_type: string
  balance: number
  used: number
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchEmployee()
    }
  }, [params.id])

  async function fetchEmployee() {
    setLoading(true)
    
    // Fetch employee
    const { data: employeeData, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !employeeData) {
      router.push('/hr/employees')
      return
    }

    // Fetch documents
    const { data: docsData } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('employee_id', params.id)
      .order('created_at', { ascending: false })

    // Fetch leave balances
    const { data: leaveData } = await supabase
      .from('leave_balances')
      .select('*')
      .eq('employee_id', params.id)

    setEmployee(employeeData)
    setDocuments(docsData || [])
    setLeaveBalances(leaveData || [])
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
          <p className="text-gray-500">Employee not found</p>
          <Link href="/hr/employees" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
            Back to Employees
          </Link>
        </div>
    )
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    terminated: 'bg-red-100 text-red-800',
    on_leave: 'bg-yellow-100 text-yellow-800',
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'hr_manager']}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/hr/employees" className="text-gray-500 hover:text-gray-700">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {employee.first_name} {employee.last_name}
                </h1>
                <p className="text-sm text-gray-500">
                  {employee.employee_number} • {employee.position || 'No Position'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[employee.status]}`}>
                {employee.status}
              </span>
              <Link href={`/hr/employees/${employee.id}/edit`}>
                <Button>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card title="Personal Information">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{employee.first_name} {employee.last_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{employee.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{employee.phone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{employee.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Employment Details */}
              <Card title="Employment Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{employee.department || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="font-medium">{employee.position || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Employment Type</p>
                    <p className="font-medium capitalize">{employee.employment_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hire Date</p>
                    <p className="font-medium">
                      {employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {employee.salary && (
                    <div>
                      <p className="text-sm text-gray-500">Salary</p>
                      <p className="font-medium">${employee.salary.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Emergency Contact */}
              <Card title="Emergency Contact">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-500">Contact Name</p>
                    <p className="font-medium">{employee.emergency_contact_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Phone</p>
                    <p className="font-medium">{employee.emergency_contact_phone || 'N/A'}</p>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              {employee.notes && (
                <Card title="Notes">
                  <p className="text-gray-700 whitespace-pre-wrap">{employee.notes}</p>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Leave Balances */}
              <Card title="Leave Balances">
                {leaveBalances.length === 0 ? (
                  <p className="text-gray-500 text-sm">No leave balances configured</p>
                ) : (
                  <div className="space-y-4">
                    {leaveBalances.map((balance, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm capitalize">{balance.leave_type.replace('_', ' ')}</span>
                        <span className="font-medium">
                          {balance.balance - balance.used} / {balance.balance} days
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Documents */}
              <Card title="Documents">
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No documents uploaded</p>
                ) : (
                  <div className="space-y-3">
                    {documents.slice(0, 5).map((doc) => {
                      const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date()
                      return (
                        <div key={doc.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium">{doc.document_name}</p>
                              <p className="text-xs text-gray-500">{doc.document_type}</p>
                            </div>
                          </div>
                          {doc.expiry_date && (
                            <span className={`text-xs ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                              {isExpired ? 'Expired' : `Exp: ${new Date(doc.expiry_date).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {documents.length > 5 && (
                      <Link href="/hr/documents" className="text-sm text-indigo-600 hover:text-indigo-500">
                        View all documents →
                      </Link>
                    )}
                  </div>
                )}
              </Card>

              {/* Quick Actions */}
              <Card title="Quick Actions">
                <div className="space-y-2">
                  <Link href={`/hr/employees/${employee.id}/edit`}>
                    <Button variant="secondary" className="w-full justify-start">
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit Employee
                    </Button>
                  </Link>
                  <Link href="/hr/leave">
                    <Button variant="secondary" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      View Leave Requests
                    </Button>
                  </Link>
                  <Link href="/hr/documents">
                    <Button variant="secondary" className="w-full justify-start">
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      Manage Documents
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </RoleGuard>
  )
}

