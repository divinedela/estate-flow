'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { RoleGuard } from '@/components/auth/role-guard'
import { Modal } from '@/components/ui/modal'
import { FormInput } from '@/components/ui/form-input'
import { FormSelect } from '@/components/ui/form-select'
import { FormTextarea } from '@/components/ui/form-textarea'
import { createClient } from '@/lib/supabase/client'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  DocumentIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

interface EmployeeDocument {
  id: string
  employee_id: string
  employee_name: string
  employee_number: string
  document_type: string
  title: string
  file_url: string
  file_name: string | null
  file_size: number | null
  expiry_date: string | null
  issued_date: string | null
  issued_by: string | null
  notes: string | null
  is_active: boolean
  created_at: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string
  employee_number: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [editingDocument, setEditingDocument] = useState<EmployeeDocument | null>(null)
  const [viewingDocument, setViewingDocument] = useState<EmployeeDocument | null>(null)
  const [formData, setFormData] = useState({
    employee_id: '',
    document_type: '',
    title: '',
    file_url: '',
    file_name: '',
    expiry_date: '',
    issued_date: '',
    issued_by: '',
    notes: '',
    is_active: true,
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchEmployees()
    fetchDocuments()
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [selectedEmployee, selectedType])

  async function fetchEmployees() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    const profile = profileData as { organization_id: string } | null
    if (!profile?.organization_id) return

    const { data } = await (supabase
      .from('employees') as any)
      .select('id, first_name, last_name, employee_number')
      .eq('organization_id', profile.organization_id)
      .order('first_name')

    setEmployees(data || [])
  }

  async function fetchDocuments() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profileData } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    const profile = profileData as { organization_id: string } | null
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    let query = (supabase
      .from('employee_documents') as any)
      .select(`
        *,
        employee:employees(first_name, last_name, employee_number, organization_id)
      `)
      .order('created_at', { ascending: false })

    if (selectedEmployee) {
      query = query.eq('employee_id', selectedEmployee)
    }
    if (selectedType) {
      query = query.eq('document_type', selectedType)
    }

    const { data } = await query

    interface DocumentRaw {
      id: string
      employee_id: string
      document_type: string
      title: string
      file_url: string
      file_name: string | null
      file_size: number | null
      expiry_date: string | null
      issued_date: string | null
      issued_by: string | null
      notes: string | null
      is_active: boolean
      created_at: string
      employee: {
        first_name: string
        last_name: string
        employee_number: string
        organization_id: string
      } | null
    }

    const rawData = data as DocumentRaw[] | null
    const filteredData = (rawData || [])
      .filter(d => d.employee?.organization_id === profile.organization_id)
      .map(d => ({
        id: d.id,
        employee_id: d.employee_id,
        employee_name: `${d.employee?.first_name} ${d.employee?.last_name}`,
        employee_number: d.employee?.employee_number || '',
        document_type: d.document_type,
        title: d.title,
        file_url: d.file_url,
        file_name: d.file_name,
        file_size: d.file_size,
        expiry_date: d.expiry_date,
        issued_date: d.issued_date,
        issued_by: d.issued_by,
        notes: d.notes,
        is_active: d.is_active,
        created_at: d.created_at,
      }))

    setDocuments(filteredData)
    setLoading(false)
  }

  function openCreateModal() {
    setEditingDocument(null)
    setSelectedFile(null)
    setUploadProgress(0)
    setFormData({
      employee_id: selectedEmployee || '',
      document_type: '',
      title: '',
      file_url: '',
      file_name: '',
      expiry_date: '',
      issued_date: '',
      issued_by: '',
      notes: '',
      is_active: true,
    })
    setIsModalOpen(true)
  }

  function openEditModal(doc: EmployeeDocument) {
    setEditingDocument(doc)
    setSelectedFile(null)
    setUploadProgress(0)
    setFormData({
      employee_id: doc.employee_id,
      document_type: doc.document_type,
      title: doc.title,
      file_url: doc.file_url,
      file_name: doc.file_name || '',
      expiry_date: doc.expiry_date || '',
      issued_date: doc.issued_date || '',
      issued_by: doc.issued_by || '',
      notes: doc.notes || '',
      is_active: doc.is_active,
    })
    setIsModalOpen(true)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
      setFormData({ ...formData, file_name: file.name })
    }
  }

  async function uploadFile(file: File, employeeId: string): Promise<string | null> {
    setUploading(true)
    setUploadProgress(0)

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${employeeId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('Upload error:', error)
        throw error
      }

      setUploadProgress(100)

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('employee-documents')
        .getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (error: any) {
      console.error('Upload failed:', error)
      alert('Failed to upload file: ' + (error.message || 'Unknown error'))
      return null
    } finally {
      setUploading(false)
    }
  }

  async function downloadFile(doc: EmployeeDocument) {
    try {
      // If it's a full URL, just open it
      if (doc.file_url.startsWith('http')) {
        window.open(doc.file_url, '_blank')
        return
      }

      // Otherwise try to download from storage
      const { data, error } = await supabase.storage
        .from('employee-documents')
        .download(doc.file_url)

      if (error) throw error

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.file_name || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Download failed:', error)
      // Fallback to opening the URL
      window.open(doc.file_url, '_blank')
    }
  }

  function viewDocument(doc: EmployeeDocument) {
    setViewingDocument(doc)
    setIsViewModalOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.employee_id) {
      alert('Please select an employee')
      return
    }

    // For new documents, require file upload
    if (!editingDocument && !selectedFile) {
      alert('Please select a file to upload')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: appUserData } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    const appUser = appUserData as { id: string } | null

    let fileUrl = formData.file_url
    let fileName = formData.file_name
    let fileSize: number | null = null

    // Upload new file if selected
    if (selectedFile) {
      const uploadedUrl = await uploadFile(selectedFile, formData.employee_id)
      if (!uploadedUrl) {
        return // Upload failed
      }
      fileUrl = uploadedUrl
      fileName = selectedFile.name
      fileSize = selectedFile.size
    }

    const documentData = {
      employee_id: formData.employee_id,
      document_type: formData.document_type,
      title: formData.title,
      file_url: fileUrl,
      file_name: fileName || null,
      file_size: fileSize,
      expiry_date: formData.expiry_date || null,
      issued_date: formData.issued_date || null,
      issued_by: formData.issued_by || null,
      notes: formData.notes || null,
      is_active: formData.is_active,
      created_by: appUser?.id,
    }

    if (editingDocument) {
      const { error } = await (supabase
        .from('employee_documents') as any)
        .update(documentData)
        .eq('id', editingDocument.id)

      if (error) {
        alert('Error updating document: ' + error.message)
        return
      }
    } else {
      const { error } = await (supabase
        .from('employee_documents') as any)
        .insert(documentData)

      if (error) {
        alert('Error creating document: ' + error.message)
        return
      }
    }

    setIsModalOpen(false)
    setSelectedFile(null)
    fetchDocuments()
  }

  async function handleDelete(doc: EmployeeDocument) {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      return
    }

    const { error } = await (supabase
      .from('employee_documents') as any)
      .delete()
      .eq('id', doc.id)

    if (error) {
      alert('Error deleting document: ' + error.message)
      return
    }

    fetchDocuments()
  }

  async function toggleActive(doc: EmployeeDocument) {
    const { error } = await (supabase
      .from('employee_documents') as any)
      .update({ is_active: !doc.is_active })
      .eq('id', doc.id)

    if (error) {
      alert('Error updating document: ' + error.message)
      return
    }

    fetchDocuments()
  }

  function getExpiryStatus(expiryDate: string | null): { label: string; color: string } {
    if (!expiryDate) return { label: 'No Expiry', color: 'bg-gray-100 text-gray-800' }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' }
    } else if (daysUntilExpiry <= 30) {
      return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' }
    } else {
      return { label: 'Valid', color: 'bg-green-100 text-green-800' }
    }
  }

  const documentTypes = [
    { value: 'contract', label: 'Employment Contract' },
    { value: 'id_card', label: 'ID Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'visa', label: 'Visa/Work Permit' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'license', label: 'License' },
    { value: 'qualification', label: 'Qualification' },
    { value: 'medical', label: 'Medical Record' },
    { value: 'background_check', label: 'Background Check' },
    { value: 'other', label: 'Other' },
  ]

  // Calculate stats
  const stats = {
    total: documents.length,
    valid: documents.filter(d => {
      if (!d.expiry_date) return true
      return new Date(d.expiry_date) > new Date()
    }).length,
    expiringSoon: documents.filter(d => {
      if (!d.expiry_date) return false
      const daysUntil = Math.ceil((new Date(d.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil > 0 && daysUntil <= 30
    }).length,
    expired: documents.filter(d => {
      if (!d.expiry_date) return false
      return new Date(d.expiry_date) < new Date()
    }).length,
  }

  return (
    <RoleGuard allowedRoles={['super_admin', 'hr_manager']}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/hr" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <div className="flex items-center space-x-2">
                  <Link href="/hr" className="text-sm text-indigo-600 hover:text-indigo-500">HR</Link>
                  <span className="text-gray-400">/</span>
                  <span className="text-sm text-gray-500">Documents</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Employee Documents</h1>
              </div>
            </div>
            <Button onClick={openCreateModal}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Document
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <Card>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100">
                  <DocumentIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Documents</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Valid</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.valid}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100">
                  <ClockIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.expiringSoon}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Expired</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.expired}</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Types</option>
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading documents...</p>
              </div>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Employee</TableHeader>
                    <TableHeader>Document Type</TableHeader>
                    <TableHeader>Title</TableHeader>
                    <TableHeader>Issued Date</TableHeader>
                    <TableHeader>Expiry Date</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Actions</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                        No documents found.
                        <button
                          onClick={openCreateModal}
                          className="ml-2 text-indigo-600 hover:text-indigo-500"
                        >
                          Add a document
                        </button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((doc) => {
                      const expiryStatus = getExpiryStatus(doc.expiry_date)
                      return (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{doc.employee_name}</p>
                              <p className="text-sm text-gray-500">{doc.employee_number}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">{doc.document_type.replace('_', ' ')}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              {doc.file_name && (
                                <p className="text-sm text-gray-500">{doc.file_name}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {doc.issued_date 
                              ? new Date(doc.issued_date).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {doc.expiry_date 
                              ? new Date(doc.expiry_date).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${expiryStatus.color}`}>
                              {expiryStatus.label}
                            </span>
                            {!doc.is_active && (
                              <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => viewDocument(doc)}
                                className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                                title="View Details"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => downloadFile(doc)}
                                className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                                title="Download"
                              >
                                <ArrowDownTrayIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => openEditModal(doc)}
                                className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                                title="Edit"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc)}
                                className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingDocument ? 'Edit Document' : 'Add Document'}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormSelect
              label="Employee"
              value={formData.employee_id}
              onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} ({emp.employee_number})
                </option>
              ))}
            </FormSelect>

            <FormSelect
              label="Document Type"
              value={formData.document_type}
              onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
              required
            >
              <option value="">Select Type</option>
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </FormSelect>

            <FormInput
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Employment Contract 2024"
              required
            />

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document File {!editingDocument && <span className="text-red-500">*</span>}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors">
                <div className="space-y-1 text-center">
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <DocumentIcon className="h-12 w-12 text-indigo-500" />
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-500"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : editingDocument ? (
                    <div className="flex flex-col items-center">
                      <DocumentIcon className="h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600">{editingDocument.file_name || 'Current file'}</p>
                      <p className="text-xs text-gray-500">Upload a new file to replace</p>
                    </div>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        <span className="text-indigo-600 hover:text-indigo-500 cursor-pointer">
                          Click to upload
                        </span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-2"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    {selectedFile || editingDocument ? 'Change File' : 'Select File'}
                  </label>
                </div>
              </div>
              {uploading && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                label="Issued Date"
                type="date"
                value={formData.issued_date}
                onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
              />
              <FormInput
                label="Expiry Date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>

            <FormInput
              label="Issued By"
              value={formData.issued_by}
              onChange={(e) => setFormData({ ...formData, issued_by: e.target.value })}
              placeholder="e.g., Government Authority"
            />

            <FormTextarea
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes..."
              rows={2}
            />

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Active Document
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingDocument ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Document Details"
          size="lg"
        >
          {viewingDocument && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium">{viewingDocument.employee_name}</p>
                  <p className="text-sm text-gray-500">{viewingDocument.employee_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Document Type</p>
                  <p className="font-medium capitalize">{viewingDocument.document_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="font-medium">{viewingDocument.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExpiryStatus(viewingDocument.expiry_date).color}`}>
                    {getExpiryStatus(viewingDocument.expiry_date).label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issued Date</p>
                  <p className="font-medium">
                    {viewingDocument.issued_date 
                      ? new Date(viewingDocument.issued_date).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className="font-medium">
                    {viewingDocument.expiry_date 
                      ? new Date(viewingDocument.expiry_date).toLocaleDateString()
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Issued By</p>
                  <p className="font-medium">{viewingDocument.issued_by || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">File Name</p>
                  <p className="font-medium">{viewingDocument.file_name || '-'}</p>
                </div>
              </div>

              {viewingDocument.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{viewingDocument.notes}</p>
                </div>
              )}

              {viewingDocument.file_size && (
                <div>
                  <p className="text-sm text-gray-500">File Size</p>
                  <p className="font-medium">
                    {(viewingDocument.file_size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="secondary" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => downloadFile(viewingDocument)}>
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </RoleGuard>
  )
}
