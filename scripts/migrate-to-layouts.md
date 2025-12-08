# Migrate to Next.js App Router Layouts

## Problem
The sidebar reloads on every page navigation because `MainLayout` is used inside each page component, causing it to remount.

## Solution
Move all protected pages into a route group with a shared layout.

## Steps

1. Stop the dev server (Ctrl+C)

2. Create the route group structure:
```bash
mkdir -p "app/(app)"
```

3. Create the shared layout at `app/(app)/layout.tsx`:
```tsx
'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
```

4. Move all protected folders into `app/(app)/`:
```bash
mv app/dashboard app/(app)/
mv app/admin app/(app)/
mv app/hr app/(app)/
mv app/marketing app/(app)/
mv app/projects app/(app)/
mv app/inventory app/(app)/
mv app/facilities app/(app)/
mv app/purchasing app/(app)/
```

5. Update all page components to remove `MainLayout` wrapper:
   - Each page should just return its content directly
   - Remove `import { MainLayout } from '@/components/layout/main-layout'`
   - Remove the `<MainLayout>...</MainLayout>` wrapper

6. Clean the Next.js cache:
```bash
rm -rf .next
```

7. Restart the dev server:
```bash
npm run dev
```

## Example Page Update

Before:
```tsx
import { MainLayout } from '@/components/layout/main-layout'

export default function SomePage() {
  return (
    <MainLayout>
      <div>Page content</div>
    </MainLayout>
  )
}
```

After:
```tsx
export default function SomePage() {
  return (
    <div>Page content</div>
  )
}
```

## Benefits
- Sidebar and Header persist across navigation
- Faster page transitions
- Better user experience
- Follows Next.js best practices

