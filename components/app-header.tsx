"use client"

import { Bell, Search } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/useCurrentUser"

interface AppHeaderProps {
  breadcrumbs?: { label: string; href?: string }[]
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const { user } = useCurrentUser()
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-5" />

      {breadcrumbs.length > 0 && (
        <Breadcrumb className="hidden md:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Accueil</BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((item, index) => (
              <span key={index} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {item.href ? (
                    <BreadcrumbLink href={item.href}>
                      {item.label}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:flex">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-64 pl-9 h-9 bg-muted/50 border-0 focus-visible:bg-background focus-visible:ring-1"
          />
        </div>

        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 text-[10px] bg-destructive text-destructive-foreground border-2 border-card">
            3
          </Badge>
          <span className="sr-only">Notifications</span>
        </Button>

        <ThemeToggle />

        <Separator orientation="vertical" className="h-5 hidden md:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2 rounded-lg">
              <Avatar className="h-7 w-7">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} />}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {user?.initials || "AD"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm font-medium">{user?.username || "Chargement..."}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-10 w-10">
                {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} />}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {user?.initials || "AD"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="font-medium text-sm leading-none">{user?.username || "Utilisateur"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                {user?.role && (
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                )}
                {user?.zone && (
                  <p className="text-xs text-muted-foreground">{user.zone}</p>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs">Mon compte</DropdownMenuLabel>
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Deconnexion</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
