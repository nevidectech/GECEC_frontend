import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { getCurrentUserAction } from "@/actions/user"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const userRes = await getCurrentUserAction()
  const user = userRes.success && userRes.data ? userRes.data : null

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
