"use client"

import { useState, useEffect } from "react"
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
  Loader2,
} from "lucide-react"
import { getAuditHistoryAction, type AuditLog } from "@/actions/audit-history"

const getIconForType = (type: string) => {
  const icons: Record<string, any> = {
    depot: ArrowDownToLine,
    retrait: ArrowUpFromLine,
    edit: Edit,
    create: BookOpen,
    settings: Settings,
    validation: ShieldCheck,
    warning: Trash2,
  }
  return icons[type] || BookOpen
}

const typeColors: Record<string, string> = {
  depot: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  retrait: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  edit: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  create: "bg-primary/10 text-primary",
  settings: "bg-muted text-muted-foreground",
  validation: "bg-green-500/10 text-green-600 dark:text-green-400",
  warning: "bg-red-500/10 text-red-600 dark:text-red-400",
}

export default function HistoriquePage() {
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAuditHistory = async () => {
      try {
        const result = await getAuditHistoryAction(100)
        if (result.success && result.data) {
          setAuditLogs(result.data)
        } else {
          setError(result.error || "Erreur lors du chargement de l'historique")
        }
      } catch (err) {
        setError("Erreur lors du chargement de l'historique")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadAuditHistory()
  }, [])

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
              Journal d&apos;audit complet de toutes les operations ({auditLogs.length} operation
              {auditLogs.length !== 1 ? "s" : ""})
            </p>
          </div>
          <Button variant="outline" className="gap-1.5" disabled={auditLogs.length === 0}>
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
                    disabled={loading}
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter} disabled={loading}>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Chargement de l&apos;historique...
                </span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-red-500">{error}</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <span className="text-sm text-muted-foreground">
                  {auditLogs.length === 0
                    ? "Aucun historique disponible"
                    : "Aucun resultat correspondant aux filtres"}
                </span>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />
                <div className="flex flex-col gap-0">
                  {filtered.map((log) => {
                    const Icon = getIconForType(log.type)
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
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
