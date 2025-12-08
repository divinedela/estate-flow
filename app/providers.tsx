'use client'

import { UserProvider } from '@/lib/contexts/user-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      {children}
    </UserProvider>
  )
}

