'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormInput } from '@/components/ui/form-input'
import { RoleGuard } from '@/components/auth/role-guard'
import { useUser } from '@/lib/contexts/user-context'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeftIcon, CameraIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      })
    }
  }, [profile])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = fileName

      // Delete old avatar if exists
      if (profile.avatar_url) {
        try {
          // Extract filename from URL (format: .../avatars/filename)
          const urlParts = profile.avatar_url.split('/')
          const oldFileName = urlParts[urlParts.length - 1]
          if (oldFileName && oldFileName !== fileName) {
            await supabase.storage.from('avatars').remove([oldFileName])
          }
        } catch (error) {
          // Ignore deletion errors (file might not exist)
          console.warn('Could not delete old avatar:', error)
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile
      const { error: updateError } = await supabase
        .from('app_users')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      // Refresh the page to show new avatar
      router.refresh()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setLoading(true)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('app_users')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getUserInitials = () => {
    if (!profile) return 'U'
    if (profile.full_name) {
      const names = profile.full_name.trim().split(' ')
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase()
      }
      return names[0][0].toUpperCase()
    }
    if (profile.email) {
      return profile.email[0].toUpperCase()
    }
    return 'U'
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500">User profile not found</p>
          <Link href="/dashboard">
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <RoleGuard>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-sm text-gray-500">Manage your account information and preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile Picture Section */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h2>
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="h-32 w-32 rounded-full object-cover border-4 border-indigo-100"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-indigo-100">
                      {getUserInitials()}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                  {success && (
                    <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                      <CheckCircleIcon className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center"
                >
                  <CameraIcon className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Change Picture'}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  JPG, PNG or GIF. Max size 5MB
                </p>
              </div>
            </div>
          </Card>

          {/* Profile Information */}
          <Card className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

              <FormInput
                label="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
              />

              <FormInput
                label="Email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
                placeholder="Email address"
              />
              <p className="text-xs text-gray-500 -mt-4">Email cannot be changed</p>

              <FormInput
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1234567890"
              />

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Account Status</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {profile.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">Member Since</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800">Profile updated successfully!</p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}

