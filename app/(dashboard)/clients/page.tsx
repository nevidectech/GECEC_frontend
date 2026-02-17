"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  BookOpen,
  Users,
  UserCheck,
  UserX,
  Download,
} from "lucide-react"

const statusMap: Record<string, { status: "success" | "warning" | "error"; label: string }> = {
  active: { status: "success", label: "Actif" },
  inactive: { status: "error", label: "Inactif" },
  suspended: { status: "warning", label: "Suspendu" },
}

const currencyMap: Record<number, string> = {
  0: "CDF",
  1: "USD",
  2: "EUR",
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
  return `${new Intl.NumberFormat(locale).format(value)} ${label}`
}

export default function ClientsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [clients, setClients] = useState<ClientView[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    async function fetchClients() {
      setLoading(true)
      setFetchError(null)

      const [clientsRes, zonesRes, carnetsRes] = await Promise.all([
        supabase.from("client").select("*").is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("zone").select("id, name"),
        supabase.from("carnet").select("id, client_code, initial_amount, currency"),
      ])

      if (clientsRes.error) {
        setFetchError(clientsRes.error.message)
        setClients([])
        setLoading(false)
        return
      }

      if (zonesRes.error) {
        setFetchError(zonesRes.error.message)
      }
      if (carnetsRes.error) {
        setFetchError(carnetsRes.error.message)
      }

      const zones = (zonesRes.data ?? []) as Pick<Zone, "id" | "name">[]
      const zoneMap = new Map(zones.map((zone) => [zone.id, zone.name]))
      const carnets = (carnetsRes.data ?? []) as Pick<Carnet, "id" | "client_code" | "initial_amount" | "currency">[]

      const mapped = ((clientsRes.data ?? []) as Client[]).map((client) => {
        const name = `${client.first_name} ${client.last_name}`.trim()
        const initials = `${client.first_name[0] ?? ""}${client.last_name[0] ?? ""}`.toUpperCase()
        const clientCarnets = carnets.filter((carnet) => carnet.client_code === client.code)
        const totalByCurrency = new Map<number, number>()
        clientCarnets.forEach((carnet) => {
          const current = totalByCurrency.get(carnet.currency) ?? 0
          totalByCurrency.set(carnet.currency, current + Number(carnet.initial_amount ?? 0))
        })

        const primaryCurrency = totalByCurrency.keys().next().value ?? 0
        const primaryTotal = totalByCurrency.get(primaryCurrency) ?? 0
        const status = client.status === 1 ? "active" : client.status === 0 ? "inactive" : "suspended"
        const since = client.created_at ? new Date(client.created_at).getFullYear().toString() : "-"

        return {
          id: client.id,
          code: client.code,
          name,
          initials,
          phone: client.phone,
          zone: zoneMap.get(client.zone_id) ?? "-",
          carnets: clientCarnets.length,
          totalEpargne: formatMoney(primaryTotal, primaryCurrency),
          status,
          since,
        } satisfies ClientView
      })

      setClients(mapped)
      setLoading(false)
    }

    void fetchClients()
  }, [supabase])

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  )

  const activeCount = clients.filter((client) => client.status === "active").length
  const inactiveCount = clients.filter((client) => client.status === "inactive").length

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
                <p className="text-xl font-bold text-foreground">{clients.length}</p>
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
                <p className="text-xl font-bold text-foreground">{activeCount}</p>
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
                <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
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
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export
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
                    filtered.map((client) => (
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

                  {!loading && !fetchError && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                        Aucun client trouve.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
