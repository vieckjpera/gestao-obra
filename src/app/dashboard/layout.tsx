import { Sidebar } from '@/components/layout/Sidebar'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { SidebarProvider } from '@/components/layout/sidebar-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        {/* Sem margin em mobile; margin-left só a partir de md (sidebar fixa visível) */}
        <main className="flex-1 md:ml-60 min-h-screen relative z-10 min-w-0">
          <MobileHeader />
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
