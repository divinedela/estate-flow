import { AppShell } from '@/components/layout/app-shell'

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

