import { AppShell } from '@/components/layout/app-shell'

export default function PurchasingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

