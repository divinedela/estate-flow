'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface DocumentFormData {
  projectId: string
  name: string
  category: string
  description?: string
  fileUrl: string
  fileType: string
  fileSize: number
}

export interface UpdateDocumentData {
  name?: string
  category?: string
  description?: string
}

/**
 * Upload a new project document
 */
export async function createProjectDocument(data: DocumentFormData) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: profile } = await supabase
      .from('app_users')
      .select('id, organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Profile not found' }
    }

    // Insert document record
    const { data: document, error } = await supabase
      .from('project_documents')
      .insert({
        project_id: data.projectId,
        name: data.name,
        file_url: data.fileUrl,
        file_type: data.fileType,
        file_size: data.fileSize,
        category: data.category,
        description: data.description,
        uploaded_by: profile.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating document:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects/documents')
    return { success: true, data: document }
  } catch (error: any) {
    console.error('Error in createProjectDocument:', error)
    return { success: false, error: error.message || 'Failed to create document' }
  }
}

/**
 * Update document metadata
 */
export async function updateProjectDocument(documentId: string, data: UpdateDocumentData) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: document, error } = await supabase
      .from('project_documents')
      .update(data)
      .eq('id', documentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating document:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/projects/documents')
    return { success: true, data: document }
  } catch (error: any) {
    console.error('Error in updateProjectDocument:', error)
    return { success: false, error: error.message || 'Failed to update document' }
  }
}

/**
 * Delete a document
 */
export async function deleteProjectDocument(documentId: string, fileUrl: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('project_documents')
      .delete()
      .eq('id', documentId)

    if (dbError) {
      console.error('Error deleting document from database:', dbError)
      return { success: false, error: dbError.message }
    }

    // Delete file from storage
    if (fileUrl) {
      try {
        // Extract the path from the URL
        const pathMatch = fileUrl.match(/project-documents\/(.+)$/)
        if (pathMatch) {
          const filePath = pathMatch[1]
          const { error: storageError } = await supabase.storage
            .from('project-documents')
            .remove([filePath])

          if (storageError) {
            console.warn('Error deleting file from storage:', storageError)
            // Continue even if storage deletion fails
          }
        }
      } catch (storageError) {
        console.warn('Error parsing file URL or deleting from storage:', storageError)
        // Continue even if storage deletion fails
      }
    }

    revalidatePath('/projects/documents')
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteProjectDocument:', error)
    return { success: false, error: error.message || 'Failed to delete document' }
  }
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFileToStorage(formData: FormData) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const file = formData.get('file') as File
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    const { data: profile } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return { success: false, error: 'Profile not found' }
    }

    // Create unique file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${profile.organization_id}/${timestamp}_${sanitizedFileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)

      // Check if bucket doesn't exist
      if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
        return {
          success: false,
          error: 'Storage bucket not configured. Please see STORAGE_SETUP_GUIDE.md for setup instructions.'
        }
      }

      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('project-documents')
      .getPublicUrl(filePath)

    return {
      success: true,
      data: {
        fileUrl: publicUrl,
        filePath: uploadData.path,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    }
  } catch (error: any) {
    console.error('Error in uploadFileToStorage:', error)
    return { success: false, error: error.message || 'Failed to upload file' }
  }
}

/**
 * Get signed URL for downloading a document
 */
export async function getDocumentDownloadUrl(fileUrl: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // Extract the path from the URL
    const pathMatch = fileUrl.match(/project-documents\/(.+)$/)
    if (!pathMatch) {
      return { success: false, error: 'Invalid file URL' }
    }

    const filePath = pathMatch[1]

    // Get signed URL (valid for 1 hour)
    const { data, error } = await supabase.storage
      .from('project-documents')
      .createSignedUrl(filePath, 3600)

    if (error) {
      console.error('Error creating signed URL:', error)
      return { success: false, error: error.message }
    }

    return { success: true, url: data.signedUrl }
  } catch (error: any) {
    console.error('Error in getDocumentDownloadUrl:', error)
    return { success: false, error: error.message || 'Failed to get download URL' }
  }
}
