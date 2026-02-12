"use client"

import { useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Search,
  Download,
  Filter,
  UserPlus,
  Edit,
  Trash2,
  ShieldCheck,
  BookOpen,
  ArrowUpFromLine,
  ArrowDownToLine,
  Settings,
} from "lucide-react"

const auditLogs = [
  {
    id: 1,
    action: "Depot enregistre",
    description: "Depot de 250,000 FC sur carnet C-2024-1847",
    user: "Patrick Mbuyi",
    role: "Collecteur",
    timestamp: "10/02/2024 14:32:15",
    type: "depot",
    icon: ArrowDownToLine,
  },
  {
    id: 2,
    action: "Retrait valide",
    description: "Retrait de 500,000 FC sur carnet C-2024-1847 - validation secondaire",
    user: "Jean Dupont",
    role: "Administrateur",
    timestamp: "10/02/2024 13:45:00",
    type: "retrait",
    icon: ShieldCheck,
  },
  {
    id: 3,
    action: "Retrait initie",
    description: "Demande de retrait de 500,000 FC sur carnet C-2024-1847",
    user: "Sarah Kalala",
    role: "Agent",
    timestamp: "10/02/2024 13:30:22",
    type: "retrait",
    icon: ArrowUpFromLine,
  },
  {
    id: 4,
    action: "Client modifie",
    description: "Mise a jour adresse pour client CLT-0456 (Marie Kabila)",
    user: "Jean Dupont",
    role: "Administrateur",
    timestamp: "10/02/2024 11:20:00",
    type: "edit",
    icon: Edit,
  },
  {
    id: 5,
    action: "Nouveau carnet cree",
    description: "Carnet C-2024-1848 cree pour Albert Tshisekedi - Type Standard",
    user: "Sarah Kalala",
    role: "Agent",
    timestamp: "10/02/2024 10:05:33",
    type: "create",
    icon: BookOpen,
  },
  {
    id: 6,
    action: "Nouveau client enregistre",
    description: "Client CLT-0464 (Paul Kabongo) - Zone Lubumbashi-Centre",
    user: "Patrick Mbuyi",
    role: "Collecteur",
    timestamp: "10/02/2024 09:15:00",
    type: "create",
    icon: UserPlus,
  },
  {
    id: 7,
    action: "Parametres modifies",
    description: "Taux de remuneration CDF mis a jour: 1.5% -> 1.75%",
    user: "Jean Dupont",
    role: "Administrateur",
    timestamp: "09/02/2024 17:00:00",
    type: "settings",
    icon: Settings,
  },
  {
    id: 8,
    action: "Carnet suspendu",
    description: "Carnet C-2024-1842 suspendu - Motif: inactivite prolongee",
    user: "Jean Dupont",
    role: "Administrateur",
    timestamp: "09/02/2024 15:30:00",
    type: "warning",
    icon: Trash2,
  },
]

const typeColors: Record<string, string> = {
  depot: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  retrait: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  edit: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  create: "bg-primary/10 text-primary",
  settings: "bg-muted text-muted-foreground",
  warning: "bg-red-500/10 text-red-600 dark:text-red-400",
}

export default function HistoriquePage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const filtered = auditLogs.filter((log) => {
    const matchSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || log.type === typeFilter
    return matchSearch && matchType
  })

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Historique" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Historique des modifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Journal d&apos;audit complet de toutes les operations
            </p>
          </div>
          <Button variant="outline" className="gap-1.5">
            <Download className="h-4 w-4" />
            Exporter le journal
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">Journal d&apos;audit</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-56 h-9"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40 h-9">
                    <Filter className="h-3.5 w-3.5 mr-1.5" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="depot">Depots</SelectItem>
                    <SelectItem value="retrait">Retraits</SelectItem>
                    <SelectItem value="create">Creations</SelectItem>
                    <SelectItem value="edit">Modifications</SelectItem>
                    <SelectItem value="settings">Parametres</SelectItem>
                    <SelectItem value="warning">Alertes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
              <div className="flex flex-col gap-0">
                {filtered.map((log, index) => {
                  const Icon = log.icon
                  return (
                    <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                      <div
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background",
                          typeColors[log.type]
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-1 flex-col gap-1 pt-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-medium text-foreground">{log.action}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {log.description}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground font-mono whitespace-nowrap">
                            {log.timestamp}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-foreground">{log.user}</span>
                          <span className="text-xs text-muted-foreground">-</span>
                          <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {log.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
