import { DashboardHeader, DashboardSidebar } from '@/components/dashboard'
import { AuthGuard } from '@/components/auth-guard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background cyber-grid flex flex-col">
        <DashboardHeader />
        <div className="flex-1 flex">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
