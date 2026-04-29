"use client"

import { useEffect, useMemo, useState } from "react"
import React from "react"
import Link from "next/link"
import * as XLSX from "xlsx"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { Carnet, Client, Zone } from "@/types/db"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatusBadge } from "@/components/status-badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  BookOpen,
  Users,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react"

const statusMap: Record<string, { status: "success" | "warning" | "error"; label: string }> = {
  active: { status: "success", label: "Actif" },
  inactive: { status: "error", label: "Inactif" },
  suspended: { status: "warning", label: "Suspendu" },
}

const currencyMap: Record<number, string> = {
  1: "CDF",
  2: "USD",
}

type ClientView = {
  id: string
  code: string
  name: string
  initials: string
  phone: string
  zone: string
  carnets: number
  totalEpargne: string
  status: "active" | "inactive" | "suspended"
  since: string
}

function formatMoney(value: number, currency: number) {
  const label = currencyMap[currency] ?? `CUR-${currency}`
  const locale = label === "USD" || label === "EUR" ? "en-US" : "fr-FR"
  return `${new Intl.NumberFormat(locale).format(value)} ${currency === 1 ? "CDF" : "USD"}`
}

export default function ClientsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [clients, setClients] = useState<ClientView[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState({ active: 0, inactive: 0, total: 0 })
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    try {
      setIsExporting(true)
      const searchFilter = search
        ? `first_name.ilike.%${search}%,last_name.ilike.%${search}%,code.ilike.%${search}%,phone.ilike.%${search}%`
        : null

      let clientQuery = supabase.from("client").select("*").is("deleted_at", null)
      if (searchFilter) {
        clientQuery = clientQuery.or(searchFilter)
      }

      const { data: clientsData, error: clientsError } = await clientQuery.order("created_at", { ascending: false })
      if (clientsError) throw clientsError

      const { data: zonesData } = await supabase.from("zone").select("id, name")
      const zoneMap = new Map((zonesData ?? []).map((zone) => [zone.id, zone.name]))

      const clientCodes = (clientsData ?? []).map((c: any) => c.code)
      
      let carnets: Pick<Carnet, "client_code" | "initial_amount" | "currency">[] = []
      if (clientCodes.length > 0) {
        // Fetch carnets in chunks if necessary, but for now just one query
        const { data: carnetsData } = await supabase
          .from("carnet")
          .select("client_code, initial_amount, currency")
          .in("client_code", clientCodes)
        if (carnetsData) {
          carnets = carnetsData as Pick<Carnet, "client_code" | "initial_amount" | "currency">[]
        }
      }

      const exportData = ((clientsData ?? []) as Client[]).map((client) => {
        const name = `${client.first_name} ${client.last_name}`.trim()
        const clientCarnets = carnets.filter((carnet) => carnet.client_code === client.code)
        
        const totalByCurrency = new Map<number, number>()
        clientCarnets.forEach((carnet) => {
          const current = totalByCurrency.get(carnet.currency) ?? 0
          totalByCurrency.set(carnet.currency, current + Number(carnet.initial_amount ?? 0))
        })

        const primaryCurrency = totalByCurrency.keys().next().value ?? 1
        const primaryTotal = totalByCurrency.get(primaryCurrency) ?? 0
        const status = client.status === 1 ? "Actif" : client.status === 0 ? "Inactif" : "Suspendu"
        const since = client.created_at ? new Date(client.created_at).toLocaleDateString() : "-"

        return {
          "Nom complet": name,
          "Code": client.code,
          "Téléphone": client.phone,
          "Zone": zoneMap.get(client.zone_id) ?? "-",
          "Nombre de carnets": clientCarnets.length,
          "Épargne totale": formatMoney(primaryTotal, primaryCurrency),
          "Statut": status,
          "Inscrit le": since,
        }
      })

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clients")
      XLSX.writeFile(workbook, "Export_Clients.xlsx")
    } catch (err) {
      console.error("Erreur lors de l'export", err)
      alert("Une erreur est survenue lors de l'exportation.")
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    async function fetchGlobalStats() {
      const statsPromises = [
        supabase
          .from("client")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null),
        supabase
          .from("client")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", 1),
        supabase
          .from("client")
          .select("id", { count: "exact", head: true })
          .is("deleted_at", null)
          .eq("status", 0),
      ]
      const [totalRes, activeRes, inactiveRes] = await Promise.all(statsPromises)
      setStats({ total: totalRes.count ?? 0, active: activeRes.count ?? 0, inactive: inactiveRes.count ?? 0 })
    }
    fetchGlobalStats()
  }, [supabase])

  useEffect(() => {
    async function fetchClients() {
      setLoading(true)
      setFetchError(null)

      const searchFilter = search
        ? `first_name.ilike.%${search}%,last_name.ilike.%${search}%,code.ilike.%${search}%,phone.ilike.%${search}%`
        : null

      // Fetch zones
      const { data: zonesData, error: zonesError } = await supabase.from("zone").select("id, name")
      if (zonesError) setFetchError(zonesError.message) // non-fatal
      const zoneMap = new Map((zonesData ?? []).map((zone) => [zone.id, zone.name]))

      // Fetch page of clients
      let clientQuery = supabase.from("client").select("*", { count: "exact" }).is("deleted_at", null)

      if (searchFilter) {
        clientQuery = clientQuery.or(searchFilter)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      const { data: clientsData, error: clientsError, count } = await clientQuery
        .order("created_at", { ascending: false })
        .range(from, to)

      if (clientsError) {
        setFetchError(clientsError.message)
        setClients([])
        setTotalCount(0)
        setLoading(false)
        return
      }

      // Fetch related data for the page
      const clientCodes = (clientsData ?? []).map((c: any) => c.code)
      const { data: carnetsData, error: carnetsError } = await supabase
        .from("carnet")
        .select("client_code, initial_amount, currency")
        .in("client_code", clientCodes)
      if (carnetsError) setFetchError(carnetsError.message) // non-fatal
      const carnets = (carnetsData ?? []) as Pick<Carnet, "client_code" | "initial_amount" | "currency">[]

      const mapped = ((clientsData ?? []) as Client[]).map((client) => {
        const name = `${client.first_name} ${client.last_name}`.trim()
        const initials = `${client.first_name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`.toUpperCase()
        const clientCarnets = carnets.filter((carnet) => carnet.client_code === client.code)
        const totalByCurrency = new Map<number, number>()
        clientCarnets.forEach((carnet) => {
          const current = totalByCurrency.get(carnet.currency) ?? 0
          totalByCurrency.set(carnet.currency, current + Number(carnet.initial_amount ?? 0))
        })

        const primaryCurrency = totalByCurrency.keys().next().value ?? 1
        const primaryTotal = totalByCurrency.get(primaryCurrency) ?? 0
        const status = client.status === 1 ? "active" : client.status === 0 ? "inactive" : "suspended"
        const since = client.created_at ? new Date(client.created_at).getFullYear().toString() : "-"

        return { id: client.id, code: client.code, name, initials, phone: client.phone, zone: zoneMap.get(client.zone_id) ?? "-", carnets: clientCarnets.length, totalEpargne: formatMoney(primaryTotal, primaryCurrency), status, since } satisfies ClientView
      })

      setClients(mapped)
      setTotalCount(count ?? 0)
      setLoading(false)
    }

    void fetchClients()
  }, [supabase, search, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <>
      <AppHeader breadcrumbs={[{ label: "Clients" }]} />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestion de votre portefeuille client
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau client
          </Button>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total clients</p>
                <p className="text-xl font-bold text-foreground">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Actifs</p>
                <p className="text-xl font-bold text-foreground">{stats.active}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inactifs</p>
                <p className="text-xl font-bold text-foreground">{stats.inactive}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base font-semibold">Liste des clients</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, ID ou telephone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-72 h-9"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-1.5" 
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  <Download className="h-3.5 w-3.5" />
                  {isExporting ? "Export en cours..." : "Export"}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">ID</TableHead>
                    <TableHead className="font-semibold">Telephone</TableHead>
                    <TableHead className="font-semibold">Zone</TableHead>
                    <TableHead className="font-semibold text-center">Carnets</TableHead>
                    <TableHead className="font-semibold">Epargne totale</TableHead>
                    <TableHead className="font-semibold">Statut</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Chargement des clients...
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading && fetchError && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-red-500">
                        {fetchError}
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    !fetchError &&
                    clients.map((client) => (
                    <TableRow key={client.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                              {client.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link href={`/clients/${client.id}`} className="font-medium text-foreground hover:text-primary hover:underline">
                              {client.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">Depuis {client.since}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{client.code}</TableCell>
                      <TableCell className="text-muted-foreground">{client.phone}</TableCell>
                      <TableCell className="text-muted-foreground">{client.zone}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                          {client.carnets}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold tabular-nums text-foreground">{client.totalEpargne}</TableCell>
                      <TableCell>
                        <StatusBadge
                          status={statusMap[client.status].status}
                          label={statusMap[client.status].label}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/clients/${client.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir profil
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Nouveau carnet
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    ))}

                  {!loading && !fetchError && clients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Aucun client trouve.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalCount > pageSize && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Affichage de {(page - 1) * pageSize + 1} à {Math.min(page * pageSize, totalCount)} sur {totalCount} clients
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="gap-1 pl-2.5"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Précédent
                      </Button>
                    </PaginationItem>
                    <div className="flex items-center gap-1 mx-2">
                      {Array.from({ length: Math.ceil(totalCount / pageSize) }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === Math.ceil(totalCount / pageSize) || Math.abs(p - page) <= 1)
                        .map((p, i, arr) => (
                          <React.Fragment key={p}>
                            {i > 0 && arr[i - 1] !== p - 1 && <span className="text-muted-foreground">...</span>}
                            <PaginationItem>
                              <Button
                                variant={page === p ? "default" : "outline"}
                                size="sm"
                                onClick={() => setPage(p)}
                                className="h-8 w-8 p-0"
                              >
                                {p}
                              </Button>
                            </PaginationItem>
                          </React.Fragment>
                        ))
                      }
                    </div>
                    <PaginationItem>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= Math.ceil(totalCount / pageSize)}
                        onClick={() => setPage((p) => p + 1)}
                        className="gap-1 pr-2.5"
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
