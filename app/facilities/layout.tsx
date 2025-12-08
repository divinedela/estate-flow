import { AppShell } from '@/components/layout/app-shell'

export default function FacilitiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

