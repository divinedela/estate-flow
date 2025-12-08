'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'
import { ProtectedRoute } from '@/components/auth/protected-route'

// This component provides the app shell (sidebar + header)
// It's designed to be used in a layout file to prevent remounting on navigation
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

