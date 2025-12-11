'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { UploadDocumentModal } from '@/components/projects/upload-document-modal'
import { EditDocumentModal } from '@/components/projects/edit-document-modal'
import { deleteProjectDocument, getDocumentDownloadUrl } from '@/app/actions/project-documents'
import {
  DocumentTextIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  TrashIcon,
  FolderIcon,
  PhotoIcon,
  DocumentIcon,
  PaperClipIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'

interface DocumentsPageClientProps {
  initialDocuments: any[]
  projects: { id: string; name: string }[]
  totalDocuments: number
  totalSize: number
  categoryCounts: Record<string, number>
}

export function DocumentsPageClient({
  initialDocuments,
  projects,
  totalDocuments,
  totalSize,
  categoryCounts,
}: DocumentsPageClientProps) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Filter and search documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesProject = !selectedProject || doc.project_id === selectedProject
      const matchesCategory = !selectedCategory || doc.category === selectedCategory
      const matchesSearch = !searchQuery ||
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesProject && matchesCategory && matchesSearch
    })
  }, [documents, selectedProject, selectedCategory, searchQuery])

  const categoryColors: Record<string, string> = {
    contract: 'bg-blue-100 text-blue-800',
    blueprint: 'bg-purple-100 text-purple-800',
    drawing: 'bg-indigo-100 text-indigo-800',
    permit: 'bg-yellow-100 text-yellow-800',
    photo: 'bg-pink-100 text-pink-800',
    report: 'bg-green-100 text-green-800',
    invoice: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800',
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <PhotoIcon className="h-5 w-5 text-blue-500" />
    if (fileType.includes('pdf')) return <DocumentTextIcon className="h-5 w-5 text-red-500" />
    return <DocumentIcon className="h-5 w-5 text-gray-500" />
  }

  const handleDelete = async (documentId: string, fileUrl: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    setIsDeleting(documentId)

    try {
      const result = await deleteProjectDocument(documentId, fileUrl)

      if (result.success) {
        // Remove document from local state
        setDocuments(documents.filter((doc) => doc.id !== documentId))
      } else {
        alert(result.error || 'Failed to delete document')
      }
    } catch (error: any) {
      alert(error.message || 'An error occurred')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const result = await getDocumentDownloadUrl(fileUrl)

      if (result.success && result.url) {
        // Create a temporary link and click it to download
        const link = document.createElement('a')
        link.href = result.url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert(result.error || 'Failed to get download URL')
      }
    } catch (error: any) {
      alert(error.message || 'An error occurred')
    }
  }

  const handleView = async (fileUrl: string) => {
    try {
      const result = await getDocumentDownloadUrl(fileUrl)

      if (result.success && result.url) {
        window.open(result.url, '_blank')
      } else {
        alert(result.error || 'Failed to get view URL')
      }
    } catch (error: any) {
      alert(error.message || 'An error occurred')
    }
  }

  const handleEdit = (doc: any) => {
    setSelectedDocument(doc)
    setIsEditModalOpen(true)
  }

  const handleUploadSuccess = () => {
    // Refresh the page to get updated documents
    window.location.reload()
  }

  const handleEditSuccess = () => {
    // Refresh the page to get updated documents
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Project Documents</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and share project files and documents
          </p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)}>
          <PlusIcon className="h-5 w-5 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100">
              <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-semibold text-gray-900">{totalDocuments}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <FolderIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Storage Used</p>
              <p className="text-2xl font-semibold text-gray-900">{formatFileSize(totalSize)}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <DocumentIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Contracts</p>
              <p className="text-2xl font-semibold text-gray-900">{categoryCounts.contract || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <PaperClipIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Blueprints</p>
              <p className="text-2xl font-semibold text-gray-900">{categoryCounts.blueprint || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            <option value="contract">Contracts</option>
            <option value="blueprint">Blueprints</option>
            <option value="drawing">Drawings</option>
            <option value="permit">Permits</option>
            <option value="photo">Photos</option>
            <option value="report">Reports</option>
            <option value="invoice">Invoices</option>
            <option value="other">Other</option>
          </select>
          <input
            type="search"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1 min-w-[200px]"
          />
        </div>
      </Card>

      {/* Documents Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Document</TableHeader>
                <TableHeader>Project</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader>Size</TableHeader>
                <TableHeader>Uploaded By</TableHeader>
                <TableHeader>Date</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                      {documents.length === 0 ? 'No documents' : 'No documents match your filters'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {documents.length === 0 ? 'Get started by uploading your first document.' : 'Try adjusting your filters'}
                    </p>
                    {documents.length === 0 && (
                      <div className="mt-6">
                        <Button
                          className="inline-flex items-center"
                          onClick={() => setIsUploadModalOpen(true)}
                        >
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocuments.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        {getFileIcon(doc.file_type)}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          {doc.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <FolderIcon className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900">{doc.project?.name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${categoryColors[doc.category] || categoryColors.other}`}>
                        {doc.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatFileSize(doc.file_size)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {doc.uploader?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(doc.file_url)}
                          className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded"
                          title="View"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(doc.file_url, doc.name)}
                          className="p-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded"
                          title="Download"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(doc)}
                          className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id, doc.file_url)}
                          disabled={isDeleting === doc.id}
                          className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modals */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false)
          handleUploadSuccess()
        }}
        projects={projects}
      />

      <EditDocumentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          handleEditSuccess()
        }}
        document={selectedDocument}
      />
    </div>
  )
}
