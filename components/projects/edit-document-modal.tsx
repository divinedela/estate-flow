'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { updateProjectDocument } from '@/app/actions/project-documents'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface EditDocumentModalProps {
  isOpen: boolean
  onClose: () => void
  document: {
    id: string
    name: string
    category: string
    description: string | null
  } | null
}

export function EditDocumentModal({ isOpen, onClose, document }: EditDocumentModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (document) {
      setName(document.name)
      setCategory(document.category)
      setDescription(document.description || '')
    }
  }, [document])

  if (!isOpen || !document) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!category) {
      setError('Category is required')
      return
    }

    setIsUpdating(true)

    try {
      const result = await updateProjectDocument(document.id, {
        name: name.trim(),
        category,
        description: description.trim() || undefined,
      })

      if (!result.success) {
        setError(result.error || 'Failed to update document')
        setIsUpdating(false)
        return
      }

      // Success - close modal
      onClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Edit Document</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isUpdating}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Document Name *
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isUpdating}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled={isUpdating}
            >
              <option value="">Select a category</option>
              <option value="contract">Contract</option>
              <option value="blueprint">Blueprint</option>
              <option value="drawing">Drawing</option>
              <option value="permit">Permit</option>
              <option value="photo">Photo</option>
              <option value="report">Report</option>
              <option value="invoice">Invoice</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add a description..."
              disabled={isUpdating}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {isUpdating ? 'Updating...' : 'Update Document'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
