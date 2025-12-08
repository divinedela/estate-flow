'use client'

import { memo } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { ProtectedRoute } from '@/components/auth/protected-route'

// Memoized shell components to prevent re-renders
const MemoizedSidebar = memo(Sidebar)
const MemoizedHeader = memo(Header)

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <MemoizedSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <MemoizedHeader />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}



