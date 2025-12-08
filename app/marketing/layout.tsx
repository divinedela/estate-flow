import { AppShell } from '@/components/layout/app-shell'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

