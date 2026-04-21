"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  History,
  BarChart3,
  BadgeDollarSign,
  Settings,
  Wallet,
  LogOut,
  Loader2,
  ListChecks,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { CurrentUser } from "@/actions/user"
import { useLogout } from "@/hooks/useLogout"

const mainNav = [
  { title: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { title: "Carnets", href: "/carnets", icon: BookOpen },
  { title: "Clients", href: "/clients", icon: Users },
]

const operationsNav = [
  { title: "Retraits", href: "/retraits", icon: ArrowUpFromLine },
  { title: "Depot & Collecte", href: "/depot", icon: ArrowDownToLine },
  { title: "Cotisations", href: "/cotisations", icon: ListChecks },
  { title: "Remuneration", href: "/remuneration", icon: Coins },
]

const systemNav = [
  { title: "Historique", href: "/historique", icon: History },
  { title: "Rapports", href: "/rapports", icon: BarChart3 },
  { title: "Finance", href: "/finance", icon: BadgeDollarSign },
  { title: "Parametrage", href: "/parametrage", icon: Settings },
]

export function AppSidebar({ user }: { user: CurrentUser | null }) {
  const pathname = usePathname()
  const { logout, isPending } = useLogout()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold tracking-tight text-foreground">
              GECEC Finance
            </span>
            <span className="text-[11px] text-muted-foreground leading-none">
              Epargne a la Carte
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Systeme</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-lg p-2 group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {user?.initials ?? "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col group-data-[collapsible=icon]:hidden min-w-0">
                  <span className="text-sm font-medium text-foreground truncate">
                    {user?.username ?? "Utilisateur"}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {user?.zone ? `${user.role} · ${user.zone}` : user?.role ?? ""}
                  </span>
                </div>
              </div>

              <SidebarMenuButton
                onClick={logout}
                disabled={isPending}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:justify-center"
                tooltip="Se deconnecter"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="group-data-[collapsible=icon]:hidden">
                  {isPending ? "Deconnexion..." : "Se deconnecter"}
                </span>
              </SidebarMenuButton>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
