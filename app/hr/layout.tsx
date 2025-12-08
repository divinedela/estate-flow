import { AppShell } from '@/components/layout/app-shell'

export default function HRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

